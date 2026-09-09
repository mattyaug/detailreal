import { SERVICES } from "@/lib/services";
import { query } from "@/lib/db";

export async function getConfiguredServices() {
  const result = await query<{ service_slug: string; duration_minutes: number }>(
    "SELECT service_slug, duration_minutes FROM service_durations",
  );
  return SERVICES.map(service => ({ ...service,
    durationMinutes: result.rows.find(row => row.service_slug === service.slug)?.duration_minutes ?? service.durationMinutes,
  }));
}
