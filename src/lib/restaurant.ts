import { z } from "zod";

export const kinds = ['product','table','order','customer','promotion','expense','task','staff','settings'] as const;
export type Kind = typeof kinds[number];
export const recordData = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().max(80).default(''),
  icon: z.string().max(12).default(''),
  price: z.number().min(0).max(1000000).default(0),
  number: z.number().int().min(0).max(9999).default(0),
  status: z.string().max(40).default('Ativo'),
  phone: z.string().max(30).default(''),
  address: z.string().max(300).default(''),
  notes: z.string().max(1000).default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => dateKey()),
  channel: z.enum(['Mesa','Delivery','Balcão']).default('Balcão'),
  tableId: z.string().max(40).default(''),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(999) })).max(100).default([]),
  alerts: z.boolean().default(true),
  image: z.string().max(400000).refine(v => v === '' || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v), 'Imagem inválida').default(''),
});
export type RecordData = z.infer<typeof recordData>;
export type RestaurantRecord = { id: string; kind: Kind; data: RecordData; created_at: string };
export const saveSchema = z.object({ id: z.string().uuid().optional(), kind: z.enum(kinds), data: recordData });
export const resetSchema = z.object({ confirmation: z.literal('LIMPAR TUDO') });
export function dateKey(date = new Date()) { return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); }
export function money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
export function filterRecords(rows: RestaurantRecord[], search: string, status: string, from = '', to = '') {
  return rows.filter(r => r.data.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (!status || r.data.status === status) && (!from || r.data.date >= from) && (!to || r.data.date <= to));
}
export function orderTotal(items: RecordData['items'], products: RestaurantRecord[]) {
  return Math.round(items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId && p.kind === 'product');
    if (!product) throw new Error('Produto indisponível');
    return sum + product.data.price * item.quantity;
  }, 0) * 100) / 100;
}
export const sections = [
  { slug: 'pedidos', title: 'Pedidos', icon: '📋', kind: 'order' },
  { slug: 'mesas', title: 'Mesas', icon: '🍽', kind: 'table' },
  { slug: 'delivery', title: 'Delivery', icon: '🛵', kind: 'order' },
  { slug: 'produtos', title: 'Produtos', icon: '🍖', kind: 'product' },
  { slug: 'promocoes', title: 'Promoções', icon: '🔥', kind: 'promotion' },
  { slug: 'clientes', title: 'Clientes', icon: '👥', kind: 'customer' },
  { slug: 'financeiro', title: 'Financeiro', icon: '💰', kind: 'expense' },
  { slug: 'relatorios', title: 'Relatórios', icon: '📈', kind: 'order' },
  { slug: 'gestao', title: 'Gestão', icon: '👔', kind: 'task' },
  { slug: 'usuarios', title: 'Usuários', icon: '👤', kind: 'staff' },
  { slug: 'configuracoes', title: 'Configurações', icon: '⚙️', kind: 'settings' },
] as const;export function statusTone(status: string) { return ['Ativo','Livre','Concluído','Pronto'].includes(status) ? 'positive' : ['Ocupada','Reservada','Inativo','Cancelado'].includes(status) ? 'negative' : ''; }
