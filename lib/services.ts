export type Service = {
  slug: string; name: string; description: string; includes: string[];
  durationMinutes: number; startingPriceCents: number;
};
const exterior = [
  "A foam-cannon pre-wash followed by a careful two-bucket hand wash",
  "A pH-neutral foam wash for gentle, thorough cleaning",
  "A complete exterior wax application to enhance shine",
  "Wheels and tires cleaned thoroughly by hand",
  "An all-around sealant application for lasting exterior protection",
  "Industrial-grade Koch-Chemie products used throughout the exterior service",
];
const interior = [
  "Thorough leather cleaning and conditioning",
  "Complete carpet shampooing and vacuuming",
  "Detailed brushwork to lift dirt from interior surfaces and seams",
  "Careful cleaning of door jambs and other hard-to-reach areas",
  "Headliner cleaning as part of a complete cabin refresh",
  "UV protection to help interior surfaces stand up to the Texas sun",
];
export const SERVICES: Service[] = [
  { slug: "exterior-detail", name: "Exterior Detail", description: "A thorough hand wash with professional Koch-Chemie products, finished with wax and sealant for a clean, glossy, protected exterior. Includes every treatment listed below.", includes: exterior, durationMinutes: 90, startingPriceCents: 9900 },
  { slug: "interior-detail", name: "Interior Full Reset", description: "Refresh the entire cabin with deep carpet care, cleaned and conditioned leather, detailed brushwork, and UV protection. Includes every treatment listed below.", includes: interior, durationMinutes: 120, startingPriceCents: 14900 },
  { slug: "full-detail", name: "Full Detail", description: "Bring the whole vehicle back to its best with our Exterior Detail and Interior Full Reset in one appointment. Includes the complete wash, wax, sealant, and cabin-care treatments listed below.", includes: [...exterior, ...interior], durationMinutes: 240, startingPriceCents: 24900 },
  { slug: "maintenance-detail", name: "Maintenance Detail", description: "Keep a previously detailed vehicle looking cared for with regular maintenance. For deep cleaning and the complete treatments listed in our other packages, choose an Exterior Detail, Interior Full Reset, or Full Detail.", includes: ["Ongoing upkeep for vehicles that have already received a full detail"], durationMinutes: 90, startingPriceCents: 8900 },
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
