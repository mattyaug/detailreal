export type Service = {
  slug: string; name: string; description: string; includes: string[];
  durationMinutes: number; startingPriceCents: number;
};
export const VEHICLE_SIZES = [
  { slug: "compact", name: "Cars & Compact Crossovers", description: "Sedans, coupes and small SUVs", adjustmentCents: 0 },
  { slug: "standard", name: "Midsize SUVs & Pickups", description: "Midsize SUVs and standard pickup trucks", adjustmentCents: 3000 },
  { slug: "large", name: "Full-Size SUVs & Trucks", description: "Large SUVs and oversized pickup trucks", adjustmentCents: 6000 },
] as const;
export function priceVehicle(service: Service, size: unknown) {
  const vehicleSize = VEHICLE_SIZES.find((item) => item.slug === size);
  if (!vehicleSize) throw new Error("Choose a vehicle size.");
  return { vehicleSize, priceCents: service.startingPriceCents + vehicleSize.adjustmentCents };
}
const exterior = [
  "A foam-cannon pre-wash followed by a careful two-bucket hand wash",
  "A pH-neutral foam wash for gentle, thorough cleaning",
  "A single application of liquid ceramic SiO2 wax for a glossy, water-repellent finish",
  "Wheels and tires cleaned thoroughly by hand",
  "An all-around sealant application for lasting exterior protection",
  "Industrial-grade Koch-Chemie products used throughout the exterior service",
];
const interior = [
  "Complete removal of trash and loose debris from the cabin",
  "Thorough leather cleaning and conditioning",
  "Complete carpet shampooing and vacuuming",
  "Detailed brushwork to lift dirt from interior surfaces and seams",
  "Careful cleaning of door jambs and other hard-to-reach areas",
];
export const SERVICES: Service[] = [
  { slug: "exterior-detail", name: "Exterior Detail", description: "A meticulous hand wash with professional Koch-Chemie products, finished with liquid ceramic SiO2 wax and sealant for a glossy, protected exterior.", includes: exterior, durationMinutes: 90, startingPriceCents: 9900 },
  { slug: "interior-detail", name: "Interior Detail", description: "Refresh your cabin with complete trash removal, deep carpet care, cleaned and conditioned leather, and precise cleaning of interior surfaces and seams.", includes: interior, durationMinutes: 120, startingPriceCents: 16900 },
  { slug: "full-detail", name: "Double Detail", description: "Our complete Exterior Detail and Interior Detail together: thorough cabin care and a meticulous exterior finish with liquid ceramic SiO2 wax. Every treatment from both packages is included.", includes: [...exterior, ...interior], durationMinutes: 240, startingPriceCents: 19900 },
  { slug: "full-reset", name: "Full Reset", description: "Our premium detailing experience. Everything in Double Detail, elevated with specialist headliner care, dedicated pet hair removal, six-month interior UV protection, and a double application of liquid ceramic SiO2 wax for an exceptionally rich exterior finish.", includes: [...exterior.filter(item => !item.includes("single application")), ...interior, "Careful, thorough headliner cleaning for a refreshed cabin from top to bottom", "Dedicated pet hair removal from upholstery and carpets", "Premium interior UV protectant with up to six months of protection", "Two carefully applied layers of liquid ceramic SiO2 wax for enhanced gloss and water repellency"], durationMinutes: 300, startingPriceCents: 26900 },
];
export const ADD_ONS = [
  { slug: "clay-bar", name: "Clay bar decontamination", description: "Lift bonded surface contaminants with clay-bar treatment for a smoother surface and a glossy finish.", priceCents: 8000, durationMinutes: 30, maxQuantity: 1 },
  { slug: "engine-bay", name: "Engine bay detailing", description: "Give the area under the hood focused cleaning and detailing for a more presentable engine bay.", priceCents: 5000, durationMinutes: 30, maxQuantity: 1 },
  { slug: "water-spots", name: "Hard water spot removal", description: "Treat mineral deposits left by hard water to restore a cleaner-looking finish.", priceCents: 15000, durationMinutes: 30, maxQuantity: 1 },
  { slug: "headlight", name: "Headlight restoration", description: "Refresh cloudy headlight lenses for a clearer appearance. Priced per headlight; select one or both.", priceCents: 5000, durationMinutes: 30, maxQuantity: 2 },
  { slug: "cabin-filter", name: "Cabin air filter replacement", description: "Replace the cabin air filter to help keep the air entering your interior fresh.", priceCents: 2000, durationMinutes: 30, maxQuantity: 1 },
];
export type AddOnSelection = { slug: string; quantity: number };
export function priceAddOns(input: unknown) {
  if (!Array.isArray(input) || input.length > ADD_ONS.length) throw new Error("Choose valid add-ons.");
  const seen = new Set<string>();
  const items = input.map((selection: AddOnSelection) => {
    const item = ADD_ONS.find((entry) => entry.slug === selection?.slug);
    if (!item || seen.has(item.slug) || !Number.isInteger(selection.quantity) || selection.quantity < 1 || selection.quantity > item.maxQuantity) throw new Error("Choose valid add-ons.");
    seen.add(item.slug);
    return { ...item, quantity: selection.quantity };
  });
  return {
    items,
    priceCents: items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    durationMinutes: items.reduce((sum, item) => sum + item.durationMinutes * item.quantity, 0),
    summary: items.map((item) => `${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`).join(", "),
  };
}
export function getService(slug: string) { return SERVICES.find((service) => service.slug === slug); }
export function formatPrice(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100); }
