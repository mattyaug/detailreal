export type Service = {
  slug: string; name: string; description: string; includes: string[];
  durationMinutes: number; startingPriceCents: number;
};
const exterior = [
  "2-bucket hand wash with a foam cannon",
  "Neutral foam wash",
  "Full exterior wax",
  "Full wheel and tire hand wash",
  "All-around sealant",
  "All exterior treatments use industrial-grade Koch-Chemie products",
];
const interior = [
  "Leather thoroughly cleaned and conditioned",
  "All carpets shampooed and vacuumed",
  "Hand-brushed cleaning",
  "Hard-to-reach areas cleaned, including door jambs",
  "Headliner cleaning",
  "UV protectant for the hot Texas sun",
];
export const SERVICES: Service[] = [
  { slug: "exterior-detail", name: "Exterior Detail", description: "A complete exterior wash, wax, and sealant treatment. Every item below is included.", includes: exterior, durationMinutes: 90, startingPriceCents: 9900 },
  { slug: "interior-detail", name: "Interior Full Reset", description: "A full interior reset, from leather and carpets to the areas quick cleans miss. Every item below is included.", includes: interior, durationMinutes: 120, startingPriceCents: 14900 },
  { slug: "full-detail", name: "Full Detail", description: "The complete Exterior Detail and Interior Full Reset together. All exterior and interior inclusions listed below are included.", includes: [...exterior, ...interior], durationMinutes: 240, startingPriceCents: 24900 },
  { slug: "maintenance-detail", name: "Maintenance Detail", description: "Recurring upkeep for vehicles that have already received a full detail. For the complete wash or interior reset described above, choose Exterior Detail, Interior Full Reset, or Full Detail.", includes: ["Maintenance care for previously detailed vehicles"], durationMinutes: 90, startingPriceCents: 8900 },
];
export const ADD_ONS = [
  { slug: "clay-bar", name: "Clay bar decontamination", description: "For a glossy, excellent finish.", priceCents: 8000, durationMinutes: 30, maxQuantity: 1 },
  { slug: "engine-bay", name: "Engine bay detailing", description: "Add engine bay detailing to your appointment.", priceCents: 5000, durationMinutes: 30, maxQuantity: 1 },
  { slug: "water-spots", name: "Hard water spot removal", description: "Target stubborn hard water spots.", priceCents: 15000, durationMinutes: 30, maxQuantity: 1 },
  { slug: "headlight", name: "Headlight restoration", description: "$50 per headlight. Choose one or two.", priceCents: 5000, durationMinutes: 30, maxQuantity: 2 },
  { slug: "cabin-filter", name: "Cabin air filter replacement", description: "Replace your cabin air filter.", priceCents: 2000, durationMinutes: 30, maxQuantity: 1 },
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
