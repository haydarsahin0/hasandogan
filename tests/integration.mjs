import {createRequire} from 'node:module';
import {readFile,readdir,realpath} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {Miniflare}=await import(require.resolve('miniflare',{paths:[await realpath(process.cwd()+'/node_modules/wrangler')]}));
const root=process.cwd()+'/dist/server';
const files=await readdir(root,{recursive:true});
const modules=['index.js',...files.filter(f=>f!=='index.js'&&/\.m?js$/.test(f))].map(f=>({type:'ESModule',path:root+'/'+f}));
const mf=new Miniflare({modules,modulesRoot:root,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{APP_ENCRYPTION_KEY:'test-only-encryption-secret',ALLOW_OWNER_SETUP:'true',CRON_SECRET:'test-only-scheduler-secret'}});

let checks=0;function check(v,message){assert.ok(v,message);checks++;console.log('PASS',message)}
const base='https://academy.test';
async function call(action,p={},headers={}){const r=await mf.dispatchFetch(base+'/api/portal',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...headers},body:JSON.stringify({action,...p})});return {r,d:await r.json()}}
const owner={'oai-authenticated-user-id':'test-owner'};
try{
const db=await mf.getD1Database('DB');
for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile('drizzle/'+f,'utf8');for(const stmt of sql.split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(stmt).run()}
let {r,d}=await call('seminar',{title:'unauthorized'});check(r.status===401,'Anonymous visitors cannot create seminars');
({r,d}=await call('setup'));check(r.status===403,'Anonymous visitors cannot claim administrator');
({r,d}=await call('setup',{},owner));check(r.ok,'Owner setup succeeds');
({r}=await call('setup',{}, {'oai-authenticated-user-id':'different-user'}));check(r.status===403,'Second identity cannot replace owner');
({r}=await call('contact',{}, {...owner,Origin:'https://evil.test'}));check(r.status===403,'Cross-origin mutations are rejected');
const seminar={title:'Test Proloterapi',description:'Test only',start:new Date(Date.now()+5*60000).toISOString(),duration:120,price:100000,capacity:1,format:'online',published:true,meet_url:'https://meet.google.com/abc-defg-hij'};
({r,d}=await call('seminar',seminar,owner));check(r.ok,'Seminar can be created');const seminarId=d.id;
({r}=await call('seminar',{...seminar,meet_url:'https://meet.google.com.evil.test/abc-defg-hij'},owner));check(r.status===400,'Untrusted meeting URL is rejected');
let state=await (await mf.dispatchFetch(base+'/api/portal')).json();check(!JSON.stringify(state).includes('abc-defg-hij'),'Public seminar response hides meeting links');
({r,d}=await call('participant',{name:'Test Doctor',email:'doctor@example.test',seminar_id:seminarId},owner));check(r.ok&&d.credentials,'Admin can create participant credentials');const creds=d.credentials;
({r,d}=await call('login',creds));check(r.ok,'Generated participant credentials work');let cookie=r.headers.get('set-cookie').split(';')[0];check(r.headers.get('set-cookie').includes('HttpOnly')&&r.headers.get('set-cookie').includes('Secure'),'Sessions use secure HttpOnly cookies');
({r}=await call('seminar',seminar,{Cookie:cookie}));check(r.status===403,'Participant cannot create seminars');
r=await mf.dispatchFetch(base+'/api/portal?action=join&id='+seminarId,{headers:{Cookie:cookie}});check(r.status===403,'First login requires password change before joining');
({r}=await call('password',{password:'long-test-password-123'},{Cookie:cookie}));check(r.ok,'Participant can change initial password');
state=await (await mf.dispatchFetch(base+'/api/portal',{headers:{Cookie:cookie}})).json();check(state.user===null,'Password change revokes old sessions');
({r}=await call('login',{username:creds.username,password:'long-test-password-123'}));cookie=r.headers.get('set-cookie').split(';')[0];
r=await mf.dispatchFetch(base+'/api/portal?action=join&id='+seminarId,{headers:{Cookie:cookie}});check(r.status===403,'Unpaid participant cannot join');
state=await (await mf.dispatchFetch(base+'/api/portal',{headers:owner})).json();const enrollment=state.participants[0].enrollment_id;
({r}=await call('payment',{id:enrollment,status:'paid'},{Cookie:cookie}));check(r.status===403,'Participant cannot approve their own payment');
({r}=await call('payment',{id:enrollment,status:'paid'},owner));check(r.ok,'Admin can approve verified payment');
r=await mf.dispatchFetch(base+'/api/portal?action=join&id='+seminarId,{headers:{Cookie:cookie},redirect:'manual'});check(r.status===302&&r.headers.get('location')===seminar.meet_url,'Paid participant can enter during time window');
({r}=await call('payment',{id:enrollment,status:'cancelled'},owner));
r=await mf.dispatchFetch(base+'/api/portal?action=join&id='+seminarId,{headers:{Cookie:cookie}});check(r.status===403,'Revocation immediately removes meeting access');
({r}=await call('search',{cities:['Denizli'],specialties:['Ortopedi']},owner));check(r.status===400,'Search reports missing provider credentials instead of fake data');
({r}=await call('settings',{google_places_key:'test-provider-secret'},owner));check(r.ok,'Provider credentials can be stored');
const secret=await db.prepare("SELECT value FROM settings WHERE key='google_places_key'").first();check(!secret.value.includes('test-provider-secret'),'Provider credentials encrypted at rest');
state=await (await mf.dispatchFetch(base+'/api/portal',{headers:owner})).json();check(!JSON.stringify(state).includes('test-provider-secret'),'Provider credentials never returned by state API');
r=await mf.dispatchFetch(base+'/api/automation',{method:'POST'});check(r.status===401,'Scheduler requires its own secret');
({r,d}=await call('administrator',{name:'Test Instructor',email:'instructor@example.test'},owner));check(r.ok&&d.credentials,'Instructor can receive a separate administrator account');
console.log(`All ${checks} integration checks passed.`);
}finally{await mf.dispose()}
