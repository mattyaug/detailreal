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
test('ceramic is a standalone package with a fixed two-day reservation', () => {
  const service=SERVICES.find(s=>s.slug==='ceramic-coating');
  assert.equal(service.dropOff,true);assert.equal(service.durationMinutes,2880);
  assert.equal(ADD_ONS.some(s=>s.slug==='ceramic-coating'),false);
  assert.deepEqual(service.includes.slice(0,2),['Two-step paint correction','Clay bar decontamination']);
  const configured={...service,enabled:true,sizePrices:[50000,70000,90000],startingPriceCents:50000};
  assert.equal(priceVehicle(configured,'large').priceCents,90000);
  assert.equal(validCatalogRows([configured],['ceramic-coating'],30),true);
});
test('clay bar cannot be charged twice for included packages', () => {
  for (const slug of ['full-reset','one-step-correction','two-step-correction','ceramic-coating']) {
    assert.ok(SERVICES.find(s=>s.slug===slug).includes.includes('Clay bar decontamination'));
    assert.throws(()=>priceAddOns([{slug:'clay-bar',quantity:1}],ADD_ONS,'compact',undefined,slug),/already included/);
  }
  assert.equal(priceAddOns([{slug:'clay-bar',quantity:1}],ADD_ONS,'compact',undefined,'exterior-detail').priceCents,8000);
});
test('owner catalog validates full price sets, duration and duplicate identifiers', () => {
  const row={slug:'detail',enabled:true,sizePrices:[10000,20000,30000],durationMinutes:120};
  assert.equal(validCatalogRows([row],['detail'],30),true);
  for(const patch of [{sizePrices:[1]},{sizePrices:[-1,2,3]},{sizePrices:[1.5,2,3]},{durationMinutes:0},{durationMinutes:31},{durationMinutes:735},{enabled:'yes'}]) assert.equal(validCatalogRows([{...row,...patch}],['detail'],30),false);
  assert.equal(validCatalogRows([row,row],['detail','other'],30),false);
  assert.equal(validCatalogRows([{...row,enabled:false,durationMinutes:0}],['detail'],30),true);
});

