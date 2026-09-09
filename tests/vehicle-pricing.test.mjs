import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERVICES, VEHICLE_SIZES, priceVehicle, priceAddOns } from '../lib/services.ts';

test('each service retains its base price with $30 and $60 size adjustments', () => {
  assert.deepEqual(SERVICES.map(service => service.startingPriceCents), [9900,16900,19900,26900]);
  for (const service of SERVICES) {
    assert.deepEqual(VEHICLE_SIZES.map(size => priceVehicle(service, size.slug).priceCents),
      [service.startingPriceCents, service.startingPriceCents + 3000, service.startingPriceCents + 6000]);
  }
});

test('missing and forged size values are rejected rather than receiving the base rate', () => {
  for (const size of [undefined, null, '', 'extra-large', 0, {slug:'large', adjustmentCents:0}, ['compact']]) {
    assert.throws(() => priceVehicle(SERVICES[2], size), /Choose a vehicle size/);
  }
});

test('vehicle adjustment is charged once and add-on pricing stays unchanged', () => {
  const addOns = priceAddOns([{slug:'headlight',quantity:2}, {slug:'cabin-filter',quantity:1}]);
  const fullDetail = SERVICES.find(service => service.slug === 'full-detail');
  assert.equal(addOns.priceCents, 12000);
  assert.equal(priceVehicle(fullDetail, 'large').priceCents + addOns.priceCents, 37900);
  assert.equal(fullDetail.durationMinutes + addOns.durationMinutes, 330);
});
