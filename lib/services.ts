export type Service = {
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  startingPriceCents: number;
};

export const SERVICES: Service[] = [
  {
    slug: "exterior-detail",
    name: "Exterior Detail",
    description: "Hand wash, wheels, tires, exterior glass, and a protected finish.",
    durationMinutes: 90,
    startingPriceCents: 9900,
  },
  {
    slug: "interior-detail",
    name: "Interior Detail",
    description: "Vacuum, wipe-down, plastics, glass, mats, and focused interior cleanup.",
    durationMinutes: 120,
    startingPriceCents: 14900,
  },
  {
    slug: "full-detail",
    name: "Full Detail",
    description: "Complete interior and exterior service for a full vehicle reset.",
    durationMinutes: 240,
    startingPriceCents: 24900,
  },
  {
    slug: "maintenance-detail",
    name: "Maintenance Detail",
    description: "Recurring upkeep for vehicles that have already received a full detail.",
    durationMinutes: 90,
    startingPriceCents: 8900,
  },
];

export function getService(slug: string) {
  return SERVICES.find((service) => service.slug === slug);
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
