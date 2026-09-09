import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getConfiguredServices } from "@/lib/service-durations";
import { executeBatch } from "@/lib/db";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ services: await getConfiguredServices() }); }
  catch { return NextResponse.json({ error: "Unable to load appointment durations." }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { services } = await request.json();
    if (!Array.isArray(services) || services.length !== SERVICES.length ||
      new Set(services.map(row => row?.slug)).size !== SERVICES.length ||
      services.some(row => !row || !SERVICES.some(service => service.slug === row.slug) ||
        !Number.isInteger(row.durationMinutes) || row.durationMinutes < 30 || row.durationMinutes > 720 || row.durationMinutes % 15 !== 0)) {
      return NextResponse.json({ error: "Set every package to 30–720 minutes, in 15-minute increments." }, { status: 400 });
    }
    await executeBatch(services.map(row => ({
      sql: "INSERT INTO service_durations (service_slug, duration_minutes) VALUES (?, ?) ON CONFLICT (service_slug) DO UPDATE SET duration_minutes = excluded.duration_minutes",
      params: [row.slug, row.durationMinutes],
    })));
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to save appointment durations." }, { status: 500 }); }
}
