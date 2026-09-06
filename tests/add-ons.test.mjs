import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADD_ONS, SERVICES, priceAddOns } from '../lib/services.ts';
test('all add-on prices and two headlights are applied',()=>{const r=priceAddOns(ADD_ONS.map(i=>({slug:i.slug,quantity:i.maxQuantity})));assert.equal(r.priceCents,40000);assert.equal(r.durationMinutes,180);});
test('reject forged, duplicate and invalid quantities',()=>{for(const input of [[{slug:'fake',quantity:1}],[{slug:'headlight',quantity:3}],[{slug:'clay-bar',quantity:0}],[{slug:'clay-bar',quantity:1.5}],[{slug:'clay-bar',quantity:1},{slug:'clay-bar',quantity:1}],null])assert.throws(()=>priceAddOns(input));});
test('client cannot override price or duration',()=>{const r=priceAddOns([{slug:'water-spots',quantity:1,priceCents:1,durationMinutes:0}]);assert.equal(r.priceCents,15000);assert.equal(r.durationMinutes,30);});
test('full detail includes every exterior and interior item',()=>{const full=SERVICES.find(s=>s.slug==='full-detail');for(const service of SERVICES.slice(0,2))for(const item of service.includes)assert.ok(full.includes.includes(item));});
