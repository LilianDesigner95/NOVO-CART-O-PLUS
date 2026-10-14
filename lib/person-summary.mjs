import {shares,money} from './ledger.mjs';
export function personStatement(invoice,personId){
 const entries=invoice.transactions.flatMap(t=>{const amount=shares(t).filter(a=>a.personId===personId).reduce((sum,a)=>sum+a.amountCents,0);return amount?[{...t,personCents:amount,shared:shares(t).length>1}]:[]}).sort((a,b)=>a.date.localeCompare(b.date)||a.sourceIndex-b.sourceIndex);
 const purchases=entries.filter(t=>t.personCents>0),credits=entries.filter(t=>t.personCents<0);
 const carry=(invoice.carryAllocations||[]).filter(a=>a.personId===personId).reduce((sum,a)=>sum+a.amountCents,0);
 const purchaseCents=purchases.reduce((sum,t)=>sum+t.personCents,0),creditCents=credits.reduce((sum,t)=>sum+t.personCents,0);
 return {purchases,credits,carry,purchaseCents,creditCents,total:purchaseCents+creditCents+carry,pending:entries.filter(t=>!t.processed).length};
}
export function statementText(invoice,person,cards){
 const s=personStatement(invoice,person.id),paid=(invoice.payments||[]).filter(p=>p.personId===person.id&&!p.voidedAt).reduce((sum,p)=>sum+p.amountCents,0),balance=s.total-paid,month=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(invoice.month+'-15T12:00:00'));
 const line=t=>{const card=cards.find(c=>c.id===t.cardId);return t.date.split('-').reverse().join('/')+' · '+t.name+(t.totalInstallments>1?' · parcela '+t.installment+' de '+t.totalInstallments:'')+(card?' · cartão '+card.last4:'')+(t.shared?' · sua parte':'')+' — '+money(t.personCents)};
 return ['Cartão Plus · '+month,person.name,invoice.closed?'Fatura fechada':'Resumo provisório · fatura aberta',s.pending?s.pending+' lançamento(s) ainda para conferir':'Lançamentos desta pessoa conferidos','', 'COMPRAS E PARCELAS',...s.purchases.map(line),!s.purchases.length?'Nenhuma compra atribuída.':'','', 'CRÉDITOS E ESTORNOS',...s.credits.map(line),!s.credits.length?'Nenhum crédito atribuído.':'','', 'Compras: '+money(s.purchaseCents),'Créditos: '+money(s.creditCents),'Saldo anterior: '+money(s.carry),'TOTAL LÍQUIDO: '+money(s.total),'Recebido: '+money(paid),(balance<0?'Crédito a favor: ':'Falta receber: ')+money(Math.abs(balance))].filter(v=>v!==null).join('\n');
}
