import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { recordData, dateKey, type Kind, type RecordData, type RestaurantRecord } from '@/lib/restaurant';

export function RestaurantEditor({kind, record, rows, onSave, onClose}: {kind:Kind;record?:RestaurantRecord|undefined;rows:RestaurantRecord[];onSave:(data:RecordData)=>Promise<void>;onClose:()=>void}) {
 const [data,setData]=useState<RecordData>(()=>record?.data ?? {...recordData.parse({name:'Novo cadastro',date:dateKey(),status:kind==='order'?'Aguardando':kind==='table'?'Livre':'Ativo'}),name:''});
 const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 const field=(key:keyof RecordData,value:unknown)=>setData(prev=>({...prev,[key]:value}));
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{await onSave(recordData.parse({...data,name:kind==='table'?`Mesa ${data.number}`:data.name}));onClose();}catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar');}finally{setBusy(false);}}
 return <Dialog open onOpenChange={onClose}><DialogContent className="restaurant-dialog"><DialogHeader><DialogTitle>{record?'Editar':'Novo cadastro'}</DialogTitle></DialogHeader><form onSubmit={submit} className="record-form">
 {kind!=='table'&&<label>Nome<input required maxLength={120} value={data.name} onChange={e=>field('name',e.target.value)}/></label>}
 {kind==='table'&&<label>Número da mesa<input type="number" min={1} max={9999} required value={data.number||''} onChange={e=>field('number',Number(e.target.value))}/></label>}
 {kind==='product'&&<><label>Tipo de produto<input list="product-categories" maxLength={80} value={data.category} onChange={e=>field('category',e.target.value)}/><datalist id="product-categories">{Array.from(new Set(['Espetinhos','Comida caseira','Caldos','Refrigerantes','Cervejas','Sucos','Bebidas em geral','Adicional','Combos','Carnes','Acompanhamentos','Sobremesas','Outros',...rows.filter(r=>r.kind==='product').map(r=>r.data.category)])).filter(Boolean).map(x=><option key={x} value={x}/>)}</datalist></label><label>Ícone<select value={data.icon} onChange={e=>field('icon',e.target.value)}>{['','🍢','🍖','🍗','🥩','🍚','🥗','🥤','🍺','🍲','🧃','🍰','🍔'].map(x=><option key={x} value={x}>{x||'Selecionar'}</option>)}</select></label></>}
 {['product','expense','promotion'].includes(kind)&&<label>{kind==='promotion'?'Valor promocional':'Valor (R$)'}<input type="number" required min={0} step="0.01" value={data.price} onChange={e=>field('price',Number(e.target.value))}/></label>}
 <label>Situação<select value={data.status} onChange={e=>field('status',e.target.value)}>{(kind==='order'?['Aguardando','Preparando','Pronto','Em entrega','Concluído','Cancelado']:kind==='table'?['Livre','Ocupada','Reservada']:kind==='task'?['Ativo','Concluído']:['Ativo','Inativo']).map(x=><option key={x}>{x}</option>)}</select></label>
 {['order','promotion','expense','task'].includes(kind)&&<label>Data<input type="date" required value={data.date} onChange={e=>field('date',e.target.value)}/></label>}
 {['customer','staff','order'].includes(kind)&&<label>Telefone<input maxLength={30} value={data.phone} onChange={e=>field('phone',e.target.value)}/></label>}
 {kind==='order'&&<><label>Tipo de pedido<select value={data.channel} onChange={e=>field('channel',e.target.value)}>{['Mesa','Delivery','Balcão'].map(x=><option key={x}>{x}</option>)}</select></label>{data.channel==='Mesa'&&<label>Mesa<select required value={data.tableId} onChange={e=>field('tableId',e.target.value)}><option value="">Selecionar</option>{rows.filter(r=>r.kind==='table').map(r=><option key={r.id} value={r.id}>Mesa {r.data.number}</option>)}</select></label>}
 <fieldset><legend>Produtos do pedido</legend>{rows.filter(r=>r.kind==='product'&&r.data.status==='Ativo').map(p=><label key={p.id} className="quantity-field"><span>{p.data.icon} {p.data.name}</span><input aria-label={`Quantidade de ${p.data.name}`} type="number" min={0} max={999} value={data.items.find(i=>i.productId===p.id)?.quantity??0} onChange={e=>{const quantity=Number(e.target.value);field('items',[...data.items.filter(i=>i.productId!==p.id),...(quantity>0?[{productId:p.id,quantity}]:[])]);}}/></label>)}{!rows.some(r=>r.kind==='product')&&<p>Sem produtos cadastrados.</p>}</fieldset></>}
 {['customer','order'].includes(kind)&&<label>Endereço<input maxLength={300} value={data.address} onChange={e=>field('address',e.target.value)}/></label>}
 <label>Observações<textarea maxLength={1000} value={data.notes} onChange={e=>field('notes',e.target.value)}/></label>
 {error&&<p role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy?'Salvando…':'Salvar'}</Button>
 </form></DialogContent></Dialog>;
}
