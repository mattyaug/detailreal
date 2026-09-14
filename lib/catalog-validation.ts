export function validCatalogRows(rows: unknown, slugs: string[], minimumMinutes: number) {
  return Array.isArray(rows) && rows.length === slugs.length && new Set(rows.map(row => row?.slug)).size === slugs.length && rows.every(row =>
    row && slugs.includes(row.slug) && typeof row.enabled === "boolean" &&
    Number.isInteger(row.durationMinutes) && row.durationMinutes >= (row.enabled ? minimumMinutes : 0) && row.durationMinutes <= (row.slug === "ceramic-coating" ? 2880 : 720) && row.durationMinutes % 15 === 0 &&
    Array.isArray(row.sizePrices) && row.sizePrices.length === 3 && row.sizePrices.every((price: unknown) => Number.isInteger(price) && Number(price) >= 0 && Number(price) <= 10000000));
}

