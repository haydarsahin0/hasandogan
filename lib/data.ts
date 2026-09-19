import {env} from 'cloudflare:workers';
import {decrypt} from './security';
export function db():D1Database{return (env as unknown as {DB:D1Database}).DB}
export const runtime=()=>env as unknown as Record<string,string>;
export async function setting(key:string){return (await db().prepare('SELECT value FROM settings WHERE key=?').bind(key).first<{value:string}>())?.value||''}
export async function secret(key:string){const s=await setting(key);return s?decrypt(s,runtime().APP_ENCRYPTION_KEY):''}
export async function saveSetting(key:string,value:string){await db().prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,value).run()}
export async function rows(sql:string,...args:unknown[]){return (await db().prepare(sql).bind(...args).all()).results}
