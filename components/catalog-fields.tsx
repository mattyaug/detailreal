"use client";
type Row = { slug: string; name: string; durationMinutes: number; sizePrices?: number[]; enabled?: boolean };
export function CatalogFields<T extends Row>({ rows, onChange, disabled }: { rows: T[]; onChange: (rows: T[]) => void; disabled: boolean }) {
  const update = (slug: string, patch: Partial<T>) => onChange(rows.map(row => row.slug === slug ? { ...row, ...patch } : row));
  return <>{rows.map(row => <fieldset className="field full catalog-settings" key={row.slug} disabled={disabled}>
    <legend>{row.name}</legend>
    <label><input type="checkbox" checked={row.enabled !== false} onChange={e => update(row.slug, {enabled: e.target.checked} as Partial<T>)} /> Available for booking</label>
    {row.slug === "ceramic-coating" ? <p className="help">Complete package price includes two-step correction and clay bar. Vehicle drop-off: 1–2 days for application and curing. The schedule reserves two days automatically.</p> : <label>Reserved minutes<input className="input" type="number" min={0} max={720} step={15} required value={row.durationMinutes} onChange={e => update(row.slug, {durationMinutes: Number(e.target.value)} as Partial<T>)} /></label>}
    {['Cars & compact crossovers', 'Midsize SUVs & pickups', 'Full-size SUVs & trucks'].map((label, index) => <label key={label}>{label} ($)<input className="input" type="number" min={0} max={100000} step="0.01" required value={(row.sizePrices?.[index] ?? 0) / 100} onChange={e => {const prices = [...(row.sizePrices ?? [0,0,0])]; prices[index] = Math.round(Number(e.target.value) * 100); update(row.slug, {sizePrices: prices} as Partial<T>);}} /></label>)}
  </fieldset>)}</>;
}

