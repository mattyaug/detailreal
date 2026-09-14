import { SERVICES, ADD_ONS, VEHICLE_SIZES } from "@/lib/services";
import { query } from "@/lib/db";

export async function getConfiguredServices() {
  const result = await query<{ service_slug: string; duration_minutes: number }>(
    "SELECT service_slug, duration_minutes FROM service_durations",
  );
  const settings = await getSettings();
  return SERVICES.map(service => ({ ...service,
    durationMinutes: result.rows.find(row => row.service_slug === service.slug)?.duration_minutes ?? service.durationMinutes,
    ...settings.get(service.slug),
  })).map(service => ({ ...service, startingPriceCents: service.sizePrices?.[0] ?? service.startingPriceCents }));
}
async function getSettings() {
  const result = await query<{slug:string; prices_json:string; duration_minutes:number; enabled:number}>("SELECT * FROM catalog_settings");
  return new Map(result.rows.map(row => [row.slug, { sizePrices: JSON.parse(row.prices_json) as number[], durationMinutes: row.duration_minutes, enabled: row.enabled === 1 }]));
}
export async function getConfiguredAddOns() {
  const settings = await getSettings();
  return ADD_ONS.map(item => ({ ...item, ...settings.get(item.slug) })).map(item => ({ ...item, priceCents: item.sizePrices?.[0] ?? item.priceCents }));
}

