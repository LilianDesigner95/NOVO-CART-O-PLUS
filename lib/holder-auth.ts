import {env} from 'cloudflare:workers';
import {sha256} from './holder-portal';
const ITERATIONS=310000;
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const bytes=(value:string)=>new Uint8Array(value.match(/.{2}/g)?.map(x=>parseInt(x,16))||[]);
export async function passwordHash(password:string,salt:string,iterations=ITERATIONS){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const result=await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytes(salt),iterations,hash:'SHA-256'},key,256);return hex(new Uint8Array(result))}
export function randomToken(){return hex(crypto.getRandomValues(new Uint8Array(32)))}
export function randomSalt(){return hex(crypto.getRandomValues(new Uint8Array(16)))}
export function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
export function sessionCookie(token:string,maxAge=604800){return 'cp_holder_session='+token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge}
export function clearSessionCookie(){return sessionCookie('',0)}
export function getSessionToken(request:Request){return request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('cp_holder_session='))?.slice('cp_holder_session='.length)||''}
export async function createSession(accountId:string){const token=randomToken();await env.DB!.prepare('INSERT INTO holder_sessions(token_hash,account_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await sha256(token),accountId,new Date(Date.now()+604800000).toISOString(),new Date().toISOString()).run();return token}
export async function accountSession(request:Request){const token=getSessionToken(request);if(!/^[a-f0-9]{64}$/.test(token))throw Error('LOGIN_REQUIRED');const row=await env.DB!.prepare('SELECT a.owner,a.person_id,a.email FROM holder_sessions s JOIN holder_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND a.disabled_at IS NULL').bind(await sha256(token),new Date().toISOString()).first<{owner:string;person_id:string;email:string}>();if(!row)throw Error('LOGIN_REQUIRED');return {owner:row.owner,personId:row.person_id,email:row.email}}
