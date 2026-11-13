import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {getChatGPTUser} from '../../chatgpt-auth';
import {applyOperation,validateState} from '../../../lib/ledger.mjs';
export const dynamic='force-dynamic';
const stateShape=z.object({schema:z.literal(2),people:z.array(z.unknown()).max(10000),cards:z.array(z.unknown()).max(10000),invoices:z.array(z.unknown()).max(10000)}).passthrough();
const operationSchema=z.object({
 type:z.enum(['link-refund','reconcile-refunds','close','reopen','allocate','process','person','card','link-card','restore','import','invoice-settings','payment','void-payment','review-alert','undo-edit']),
 invoiceId:z.string().optional(),
 transactionId:z.string().optional(),
 at:z.string().optional(),
 state:stateShape.optional(),
 invoice:z.object({id:z.string().min(1),month:z.string().regex(/^\\d{4}-(0[1-9]|1[0-2])$/),transactions:z.array(z.unknown()).max(20000),officialCents:z.number().int().safe(),carryCents:z.number().int().safe()}).passthrough().optional(),
}).passthrough().superRefine((op,ctx)=>{
 if(op.type==='restore'&&!op.state)ctx.addIssue({code:'custom',message:'Backup inválido.',path:['state']});
 if(op.type==='import'&&!op.invoice)ctx.addIssue({code:'custom',message:'Fatura inválida.',path:['invoice']});
});
const serverTimeTypes=new Set(['close','reopen','payment','void-payment','review-alert','undo-edit']);

const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function identity(){const user=await getChatGPTUser();if(!user)throw new Error('AUTH_REQUIRED');if(!env.DB)throw new Error('Banco indisponível.');return user.userId}
async function read(owner:string){const row=await env.DB!.prepare('SELECT content,revision FROM workspaces WHERE owner=?').bind(owner).first<{content:string;revision:number}>();if(row)return{state:JSON.parse(row.content),revision:row.revision};const seed=validateState({schema:2,people:[],cards:[],invoices:[],activeInvoiceId:null});await env.DB!.prepare('INSERT OR IGNORE INTO workspaces (owner,content,revision,updated_at) VALUES (?,?,0,?)').bind(owner,JSON.stringify(seed),new Date().toISOString()).run();return read(owner)}
export async function GET(){try{const owner=await identity(),data=await read(owner);const history=await env.DB!.prepare('SELECT event_id,operation,created_at,revision FROM audit WHERE owner=? ORDER BY revision DESC LIMIT 30').bind(owner).all();return response({...data,history:history.results})}catch(e){return response({error:e instanceof Error?e.message:'Falha ao carregar.'},String(e).includes('AUTH_REQUIRED')?401:500)}}
export async function POST(request:Request){try{const owner=await identity();if(Number(request.headers.get('content-length'))>3000000)return response({error:'Arquivo muito grande.'},413);const body:any=await request.json();if(!body.requestId||typeof body.requestId!=='string'||!body.operation)return response({error:'Requisição inválida.'},400);const seen=await env.DB!.prepare('SELECT revision FROM audit WHERE owner=? AND event_id=?').bind(owner,body.requestId).first();if(seen)return response(await read(owner));for(let attempt=0;attempt<3;attempt++){const previous=await read(owner);
const parsed=operationSchema.safeParse(body.operation);
if(!parsed.success)return response({error:'Operação inválida.',details:parsed.error.flatten()},400);
const operation=parsed.data;
if(operation.type==='restore')validateState(operation.state);
if(operation.type==='import')validateState({...previous.state,invoices:[...previous.state.invoices,operation.invoice]});
if(serverTimeTypes.has(operation.type))operation.at=new Date().toISOString();
const next=applyOperation(previous.state,operation);const now=new Date().toISOString(),stamp=now+':'+body.requestId;const results=await env.DB!.batch([env.DB!.prepare('UPDATE workspaces SET content=?,revision=revision+1,updated_at=? WHERE owner=? AND revision=?').bind(JSON.stringify(next),stamp,owner,previous.revision),env.DB!.prepare('INSERT OR IGNORE INTO audit(owner,event_id,operation,created_at,revision) SELECT ?,?,?,?,revision FROM workspaces WHERE owner=? AND revision=? AND updated_at=?').bind(owner,body.requestId,JSON.stringify(operation),now,owner,previous.revision+1,stamp)]);if(results[0].meta.changes)return response({state:next,revision:previous.revision+1})}return response({error:'Outra edição ocorreu. Tente novamente.'},409)}catch(e){return response({error:e instanceof Error?e.message:'Falha ao salvar.'},String(e).includes('AUTH_REQUIRED')?401:400)}}
