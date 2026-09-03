import { NextRequest, NextResponse } from "next/server";
import { getService } from "@/lib/services";
import { getAvailableSlots } from "@/lib/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") || "";
    const serviceSlug = request.nextUrl.searchParams.get("service") || "";
    const service = getService(serviceSlug);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !service) {
      return NextResponse.json({ error: "Choose a valid date and service." }, { status: 400 });
    }

    const slots = await getAvailableSlots(date, service.durationMinutes);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Availability is temporarily unavailable." }, { status: 500 });
  }
}
