import { Pencil, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dateKey, money, filterRecords, statusTone, type RestaurantRecord } from '@/lib/restaurant';

export function PeriodShortcuts({onChange}:{onChange:(from:string,to:string)=>void}) {
 function select(days:number|'month') {
  const end=dateKey(); const start=new Date(`${end}T12:00:00Z`);
  if(days==='month') start.setUTCDate(1); else start.setUTCDate(start.getUTCDate()-days+1);
  onChange(start.toISOString().slice(0,10),end);
 }
 return <div className="section-tabs period-shortcuts"><CalendarDays size={18}/>{([[1,'Hoje'],[7,'7 dias'],[30,'30 dias'],['month','Este mês']] as const).map(([days,label])=><Button key={days} variant="secondary" onClick={()=>select(days)}>{label}</Button>)}</div>;
}

export function ProductGrid({rows,onEdit,onDelete}:{rows:RestaurantRecord[];onEdit:(r:RestaurantRecord)=>void;onDelete:(r:RestaurantRecord)=>void}) {
 return <div className="product-grid">{rows.map(r=><article key={r.id} className="product-tile">{r.data.image?<img className="product-photo" src={r.data.image} alt={r.data.name}/>:<div className="product-symbol" aria-hidden="true">{r.data.icon||'🍽'}</div>}<small>{r.data.category||'Outros'}</small><h2>{r.data.name}</h2><p>{r.data.notes||'—'}</p><span className={`record-status ${statusTone(r.data.status)}`}>{r.data.status}</span><footer><strong className="positive">{money(r.data.price)}</strong><div><Button variant="secondary" size="icon" title="Editar produto" aria-label={`Editar ${r.data.name}`} onClick={()=>onEdit(r)}><Pencil/></Button><Button variant="secondary" size="icon" title="Excluir produto" aria-label={`Excluir ${r.data.name}`} onClick={()=>onDelete(r)}><Trash2/></Button></div></footer></article>)}</div>;
}

export function SectionSummary({slug,rows,from,to}:{slug:string;rows:RestaurantRecord[];from:string;to:string}) {
 const orders=filterRecords(rows.filter(r=>r.kind==='order'),'', '',from,to);
 const closed=orders.filter(r=>r.data.status==='Concluído');
 const revenue=closed.reduce((sum,r)=>sum+r.data.price,0);
 const expenseRows=filterRecords(rows.filter(r=>r.kind==='expense'),'', '',from,to);
 const expenses=expenseRows.reduce((sum,r)=>sum+r.data.price,0);
 let stats:{icon:string;label:string;value:string|number;tone?:string}[]=[];
 if(slug==='financeiro') stats=[{icon:'📈',label:'Receita',value:money(revenue),tone:'positive'},{icon:'📉',label:'Despesas',value:money(expenses),tone:'negative'},{icon:'💎',label:'Lucro',value:money(revenue-expenses),tone:revenue>=expenses?'positive':'negative'},{icon:'🎯',label:'Ticket médio',value:money(closed.length?revenue/closed.length:0)}];
 if(slug==='relatorios') stats=[{icon:'💰',label:'Faturamento',value:money(revenue)},{icon:'📋',label:'Pedidos',value:orders.length},{icon:'🎯',label:'Ticket médio',value:money(closed.length?revenue/closed.length:0)},{icon:'🛵',label:'Delivery',value:orders.filter(r=>r.data.channel==='Delivery').length}];
 if(slug==='delivery') {
  const delivery=rows.filter(r=>r.kind==='order'&&r.data.channel==='Delivery');
  stats=[{icon:'⏳',label:'Aguardando',value:delivery.filter(r=>r.data.status==='Aguardando').length},{icon:'👨‍🍳',label:'Em preparo',value:delivery.filter(r=>r.data.status==='Preparando').length},{icon:'🛵',label:'Em trânsito',value:delivery.filter(r=>r.data.status==='Em entrega').length},{icon:'✅',label:'Entregues hoje',value:delivery.filter(r=>r.data.status==='Concluído'&&r.data.date===dateKey()).length}];
 }
 if(slug==='clientes') stats=[{icon:'👥',label:'Total de clientes',value:rows.filter(r=>r.kind==='customer').length},{icon:'✅',label:'Clientes ativos',value:rows.filter(r=>r.kind==='customer'&&r.data.status==='Ativo').length}];
 const top=new Map<string,number>();
 for(const order of closed) for(const item of order.data.items) top.set(item.productId,(top.get(item.productId)??0)+item.quantity);
 return <>{stats.length>0&&<div className="restaurant-stats">{stats.map(s=><article key={s.label}><div className="stat-symbol">{s.icon}</div><small>{s.label}</small><strong className={s.tone}>{s.value}</strong></article>)}</div>}
 {slug==='relatorios'&&<div className="summary-columns"><section><h2>🏆 Top produtos</h2>{top.size?[...top].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,quantity])=><div className="summary-line" key={id}><span>{rows.find(r=>r.id===id)?.data.name??'Produto removido'}</span><strong>{quantity} un</strong></div>):<p className="section-note">Sem vendas concluídas no período</p>}</section><section><h2>📊 Por tipo de pedido</h2>{['Mesa','Delivery','Balcão'].map(channel=><div className="summary-line" key={channel}><span>{channel}</span><strong>{orders.filter(r=>r.data.channel===channel).length}</strong></div>)}</section></div>}
 {slug==='financeiro'&&<section className="financial-overview"><h2>📊 Visão geral</h2><div className="summary-line"><span>📈 Receita · {closed.length} pedidos concluídos</span><strong className="positive">{money(revenue)}</strong></div><div className="summary-line"><span>📉 Despesas · {expenseRows.length} lançamentos</span><strong className="negative">{money(expenses)}</strong></div><div className="summary-line"><span>💎 Lucro líquido</span><strong>{money(revenue-expenses)}</strong></div></section>}</>;
}