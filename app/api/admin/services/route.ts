import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getConfiguredServices, getConfiguredAddOns } from "@/lib/service-durations";
import { executeBatch } from "@/lib/db";
import { SERVICES, ADD_ONS } from "@/lib/services";
import { validCatalogRows } from "@/lib/catalog-validation";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ services: await getConfiguredServices(), addOns: await getConfiguredAddOns() }); }
  catch { return NextResponse.json({ error: "Unable to load catalog settings." }, { status: 500 }); }
}
export async function PUT(request: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { services, addOns } = await request.json();
    if (Array.isArray(services)) for (const row of services) if (row?.slug === "ceramic-coating") row.durationMinutes = 2880;
    if (!validCatalogRows(services, SERVICES.map(s => s.slug), 30) || !validCatalogRows(addOns, ADD_ONS.map(s => s.slug), 0)) return NextResponse.json({ error: "Set three valid prices and time in 15-minute increments, up to 720 minutes. Enabled services need at least 30 minutes." }, { status: 400 });
    await executeBatch([...services, ...addOns].map(row => ({ sql: "INSERT INTO catalog_settings (slug, prices_json, duration_minutes, enabled) VALUES (?, ?, ?, ?) ON CONFLICT (slug) DO UPDATE SET prices_json=excluded.prices_json, duration_minutes=excluded.duration_minutes, enabled=excluded.enabled", params: [row.slug, JSON.stringify(row.sizePrices), row.durationMinutes, row.enabled ? 1 : 0] })));
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to save catalog settings." }, { status: 500 }); }
}

