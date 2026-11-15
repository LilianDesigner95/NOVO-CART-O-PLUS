import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {adminOwner,holderWorkspace,sha256,portalResponse,portalError} from '../../../../../lib/holder-portal';
import {randomToken} from '../../../../../lib/holder-auth';
export const dynamic='force-dynamic';
const schema=z.object({personId:z.string().min(1)});
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return portalResponse({error:'Origem inválida.'},403);
 const owner=await adminOwner();const parsed=schema.safeParse(await request.json());if(!parsed.success)return portalResponse({error:'Selecione um titular.'},400);
 const state=await holderWorkspace(owner);if(!state.people.some((p:any)=>p.id===parsed.data.personId))return portalResponse({error:'Titular não encontrado.'},404);
 const account=await env.DB!.prepare('SELECT id FROM holder_accounts WHERE owner=? AND person_id=? AND disabled_at IS NULL').bind(owner,parsed.data.personId).first<{id:string}>();
 if(!account)return portalResponse({error:'Este titular ainda não criou uma conta. Envie um convite de primeiro acesso.'},404);
 const token=randomToken(),now=new Date().toISOString(),expires=new Date(Date.now()+30*60*1000).toISOString();
 await env.DB!.batch([env.DB!.prepare('DELETE FROM holder_password_resets WHERE account_id=?').bind(account.id),env.DB!.prepare('INSERT INTO holder_password_resets(token_hash,account_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await sha256(token),account.id,expires,now)]);
 const url=new URL('/titular',request.url);url.searchParams.set('redefinir',token);
 return portalResponse({url:url.toString(),expiresAt:expires});
 }catch(e){return portalError(e)}}
