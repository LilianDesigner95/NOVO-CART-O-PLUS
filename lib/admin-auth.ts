import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {sha256} from './holder-portal';
import {randomToken} from './holder-auth';
export const ADMIN_EMAIL='liriosdesigner071@gmail.com';
const COOKIE='cp_admin_session';
export async function adminSession(){try{const token=(await cookies()).get(COOKIE)?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const row=await env.DB!.prepare('SELECT a.email FROM admin_sessions s JOIN admin_accounts a ON a.email=s.email WHERE s.token_hash=? AND s.expires_at>?').bind(await sha256(token),new Date().toISOString()).first<{email:string}>();return row?.email===ADMIN_EMAIL?row.email:null}catch{return null}}
export async function createAdminSession(){const token=randomToken();await env.DB!.prepare('INSERT INTO admin_sessions(token_hash,email,expires_at,created_at) VALUES (?,?,?,?)').bind(await sha256(token),ADMIN_EMAIL,new Date(Date.now()+86400000).toISOString(),new Date().toISOString()).run();return token}
export const adminCookie=(token:string,maxAge=86400)=>COOKIE+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge;
export async function revokeAdminSession(){const token=(await cookies()).get(COOKIE)?.value;if(token)await env.DB!.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await sha256(token)).run()}
