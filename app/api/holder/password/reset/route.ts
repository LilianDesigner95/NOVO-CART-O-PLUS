import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {passwordHash,randomSalt,createSession,sessionCookie} from '../../../../../lib/holder-auth';
import {sha256,portalResponse,portalError} from '../../../../../lib/holder-portal';
export const dynamic='force-dynamic';
const schema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),newPassword:z.string().min(12).max(128)});
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return portalResponse({error:'Origem inválida.'},403);
 const parsed=schema.safeParse(await request.json());if(!parsed.success)return portalResponse({error:'Link ou senha inválidos. Use pelo menos 12 caracteres.'},400);
 const now=new Date().toISOString(),hash=await sha256(parsed.data.token);
 const reset=await env.DB!.prepare('SELECT r.account_id FROM holder_password_resets r JOIN holder_accounts a ON a.id=r.account_id WHERE r.token_hash=? AND r.used_at IS NULL AND r.expires_at>? AND a.disabled_at IS NULL').bind(hash,now).first<{account_id:string}>();
 if(!reset)return portalResponse({error:'Link inválido ou expirado. Solicite outro ao administrador.'},403);
 const salt=randomSalt(),newHash=await passwordHash(parsed.data.newPassword,salt);
 const used=await env.DB!.prepare('UPDATE holder_password_resets SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>?').bind(now,hash,now).run();
 if(!used.meta.changes)return portalResponse({error:'Este link já foi utilizado.'},409);
 await env.DB!.batch([env.DB!.prepare('UPDATE holder_accounts SET password_salt=?,password_hash=?,password_iterations=100000 WHERE id=?').bind(salt,newHash,reset.account_id),env.DB!.prepare('DELETE FROM holder_sessions WHERE account_id=?').bind(reset.account_id),env.DB!.prepare('DELETE FROM holder_password_resets WHERE account_id=? AND token_hash<>?').bind(reset.account_id,hash)]);
 const session=await createSession(reset.account_id);
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':sessionCookie(session)}});
 }catch(e){return portalError(e)}}
