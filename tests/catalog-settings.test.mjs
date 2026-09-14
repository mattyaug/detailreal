import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERVICES, ADD_ONS, VEHICLE_SIZES, priceVehicle, priceAddOns } from '../lib/services.ts';
import { validCatalogRows } from '../lib/catalog-validation.ts';
test('correction uses complete size prices without adding standard surcharges', () => {
  for (const [slug, prices] of [['one-step-correction',[30000,50000,70000]],['two-step-correction',[40000,60000,80000]]]) {
    const service=SERVICES.find(s=>s.slug===slug);
    assert.deepEqual(VEHICLE_SIZES.map(size=>priceVehicle(service,size.slug).priceCents), prices);
    assert.equal(service.enabled,false);
  }
});
test('configured ceramic price and time apply only to correction and enabled offerings', () => {
  const selection=[{slug:'ceramic-coating',quantity:1}];
  assert.throws(()=>priceAddOns(selection));
  const catalog=ADD_ONS.map(item=>({...item,enabled:true,sizePrices:[10000,15000,20000],durationMinutes:60}));
  assert.throws(()=>priceAddOns(selection,catalog,'large'));
  const result=priceAddOns(selection,catalog,'large','paint-correction');
  assert.equal(result.priceCents,20000);assert.equal(result.durationMinutes,60);
});
test('owner catalog validates full price sets, duration and duplicate identifiers', () => {
  const row={slug:'detail',enabled:true,sizePrices:[10000,20000,30000],durationMinutes:120};
  assert.equal(validCatalogRows([row],['detail'],30),true);
  for(const patch of [{sizePrices:[1]},{sizePrices:[-1,2,3]},{sizePrices:[1.5,2,3]},{durationMinutes:0},{durationMinutes:31},{durationMinutes:735},{enabled:'yes'}]) assert.equal(validCatalogRows([{...row,...patch}],['detail'],30),false);
  assert.equal(validCatalogRows([row,row],['detail','other'],30),false);
  assert.equal(validCatalogRows([{...row,enabled:false,durationMinutes:0}],['detail'],30),true);
});

