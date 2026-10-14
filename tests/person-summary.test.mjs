import test from 'node:test';
import assert from 'node:assert/strict';
import {personStatement,statementText} from '../lib/person-summary.mjs';
test('statement uses only the person share, discounts once and includes previous balance',()=>{
 const invoice={month:'2026-10',closed:false,carryAllocations:[{personId:'a',amountCents:101}],transactions:[{id:'1',date:'2026-10-01',name:'Compra',amountCents:10001,installment:2,totalInstallments:3,allocations:[{personId:'a',amountCents:5001},{personId:'b',amountCents:5000}],processed:true},{id:'2',date:'2026-10-02',name:'Estorno',amountCents:-1000,allocations:[{personId:'a',amountCents:-1000}],processed:false},{id:'3',date:'2026-10-03',name:'Compensada',amountCents:9999,compensationRole:'original',allocations:[{personId:'a',amountCents:9999}]}]};
 const s=personStatement(invoice,'a');assert.equal(s.purchaseCents,5001);assert.equal(s.creditCents,-1000);assert.equal(s.total,4102);assert.equal(s.pending,1);assert.equal(s.purchases.length,1);
 const text=statementText(invoice,{id:'a',name:'Ana'},[]);assert.match(text,/sua parte/);assert.match(text,/parcela 2 de 3/);assert.match(text,/Resumo provisório/);assert.ok(!text.includes('Compensada'));assert.equal(personStatement(invoice,'b').total,5000);
});
