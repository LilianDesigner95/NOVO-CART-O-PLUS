import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {accountSession,passwordHash,randomSalt,safeEqual,getSessionToken,createSession,sessionCookie} from '../../../../lib/holder-auth';
import {sha256,portalResponse,portalError} from '../../../../lib/holder-portal';
export const dynamic='force-dynamic';
const schema=z.object({currentPassword:z.string().min(1),newPassword:z.string().min(12).max(128)});
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return portalResponse({error:'Origem inválida.'},403);
 const parsed=schema.safeParse(await request.json());if(!parsed.success)return portalResponse({error:'Informe a senha atual e uma nova senha com pelo menos 12 caracteres.'},400);
 await accountSession(request);
 const token=getSessionToken(request);
 const row=await env.DB!.prepare('SELECT a.id,a.password_salt,a.password_hash,a.password_iterations FROM holder_sessions s JOIN holder_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND a.disabled_at IS NULL').bind(await sha256(token),new Date().toISOString()).first<{id:string;password_salt:string;password_hash:string;password_iterations:number}>();
 if(!row)return portalResponse({error:'Entre novamente para alterar sua senha.'},401);
 const hash=await passwordHash(parsed.data.currentPassword,row.password_salt,row.password_iterations);
 if(!safeEqual(hash,row.password_hash))return portalResponse({error:'Senha atual incorreta.'},401);
 const salt=randomSalt(),newHash=await passwordHash(parsed.data.newPassword,salt);
 await env.DB!.batch([env.DB!.prepare('UPDATE holder_accounts SET password_salt=?,password_hash=?,password_iterations=100000 WHERE id=?').bind(salt,newHash,row.id),env.DB!.prepare('DELETE FROM holder_sessions WHERE account_id=?').bind(row.id)]);
 const next=await createSession(row.id);
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':sessionCookie(next)}});
 }catch(e){return portalError(e)}}
