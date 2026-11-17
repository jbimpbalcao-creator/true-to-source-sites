import { createServerFn } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { gateSession } from './gate.server';
import { recordData, saveSchema, resetSchema, orderTotal, type RestaurantRecord } from './restaurant';

async function requireEntry(secret: string | undefined) {
  if (!secret) throw new Error('Entrada não configurada');
  const session = await gateSession(secret);
  if (!session.data.unlocked) throw redirect({ to: '/login' });
}

export const listRecords = createServerFn({ method: 'GET' }).handler(async () => {
  await requireEntry(process.env['SESSION_SECRET']);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const rows: RestaurantRecord[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabaseAdmin.from('restaurant_records').select('*').order('created_at', { ascending: false }).range(offset, offset + 999);
    if (error) throw new Error('Não foi possível carregar os dados');
    for (const row of data ?? []) rows.push({ id: row.id, kind: row.kind as RestaurantRecord['kind'], data: recordData.parse(row.data), created_at: row.created_at });
    if (!data || data.length < 1000) break;
  }
  return rows;
});

export const saveRecord = createServerFn({ method: 'POST' }).inputValidator((data: unknown) => saveSchema.parse(data)).handler(async ({ data: input }) => {
  await requireEntry(process.env['SESSION_SECRET']);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  if (input.kind === 'table') {
    if (input.data.number < 1) throw new Error('Informe o número da mesa');
    const { data: tables, error } = await supabaseAdmin.from('restaurant_records').select('id,data').eq('kind', 'table');
    if (error) throw new Error('Não foi possível verificar a mesa');
    if (tables?.some(t => t.id !== input.id && recordData.parse(t.data).number === input.data.number)) throw new Error('Esse número de mesa já existe');
    input.data.name = `Mesa ${input.data.number}`;
  }
  if (input.kind === 'order') {
    if (!input.data.items.length) throw new Error('Adicione um produto ao pedido');
    const { data: products, error } = await supabaseAdmin.from('restaurant_records').select('*').eq('kind', 'product').in('id', input.data.items.map(i => i.productId));
    if (error) throw new Error('Não foi possível calcular o pedido');
    input.data.price = orderTotal(input.data.items, (products ?? []).map(p => ({ id: p.id, kind: 'product', data: recordData.parse(p.data), created_at: p.created_at })));
  }
  const payload = { kind: input.kind, data: JSON.parse(JSON.stringify(input.data)), updated_at: new Date().toISOString() };
  const query = input.id ? supabaseAdmin.from('restaurant_records').update(payload).eq('id', input.id).eq('kind', input.kind) : supabaseAdmin.from('restaurant_records').insert(payload);
  const { data, error } = await query.select('id').single();
  if (error || !data) throw new Error('Não foi possível salvar');
  return { id: data.id };
});

export const removeRecord = createServerFn({ method: 'POST' }).inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data)).handler(async ({ data }) => {
  await requireEntry(process.env['SESSION_SECRET']);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { error } = await supabaseAdmin.from('restaurant_records').delete().eq('id', data.id);
  if (error) throw new Error('Não foi possível excluir');
  return { ok: true };
});

export const resetRecords = createServerFn({ method: 'POST' }).inputValidator((data: unknown) => resetSchema.parse(data)).handler(async () => {
  await requireEntry(process.env['SESSION_SECRET']);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { error } = await supabaseAdmin.from('restaurant_records').delete().in('kind', ['product','table','order','customer','promotion','expense','task','staff','settings']);
  if (error) throw new Error('Não foi possível limpar os dados');
  return { ok: true };
});