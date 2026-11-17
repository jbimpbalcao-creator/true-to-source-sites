import { describe, it, expect } from 'vitest';
import { recordData, filterRecords, orderTotal, resetSchema, type RestaurantRecord } from '@/lib/restaurant';
const product: RestaurantRecord = { id:'00000000-0000-4000-8000-000000000001', kind:'product', created_at:'2026-11-16', data:recordData.parse({ name:'Produto teste',price:12.5,date:'2026-11-16' }) };
describe('Restaurant rules', () => {
  it('filters reports by inclusive date range', () => {
    expect(filterRecords([product], '', '', '2026-11-16', '2026-11-16')).toHaveLength(1);
    expect(filterRecords([product], '', '', '2026-11-17', '')).toHaveLength(0);
  });
  it('computes order totals from saved products and quantities', () => {
    expect(orderTotal([{productId:product.id,quantity:3}], [product])).toBe(37.5);
  });
  it('requires explicit confirmation before resetting all data', () => {
    expect(resetSchema.safeParse({confirmation:''}).success).toBe(false);
    expect(resetSchema.safeParse({confirmation:'LIMPAR TUDO'}).success).toBe(true);
  });
  it('rejects negative product prices', () => {
    expect(recordData.safeParse({name:'Produto',price:-1}).success).toBe(false);
  });
});