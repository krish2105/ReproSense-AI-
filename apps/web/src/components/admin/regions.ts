// Follow-ups by region, shared by the 3D columns, the flat chart and their text summary.
export interface RegionCounts {
  region: string;
  open: number;
  in_progress: number;
  closed: number;
}

/** Tallest column in scene units (mockup initMap3D: height = count / max × 5). */
export const COLUMN_MAX = 5;

// Schematic positions, west to east like the emirate (mockup RG: x, z, slab width, slab depth). Not a map.
const PLACES: Record<string, { x: number; z: number; w: number; d: number }> = {
  "Al Dhafra": { x: -5.2, z: 0, w: 4.4, d: 3.6 },
  "Abu Dhabi City": { x: 0, z: -0.6, w: 3.4, d: 3 },
  "Al Ain": { x: 4.8, z: 0.4, w: 3.4, d: 3.2 },
};

export function regionLayout(regions: RegionCounts[]) {
  let extra = 0;
  return regions.map((r) => {
    const p = PLACES[r.region] ?? { x: -5.2 + 5 * extra++, z: 4.5, w: 3.4, d: 3 }; // any new region gets a back row
    return { r, ...p };
  });
}

/** West-to-east order for the flat chart, so it reads like the 3D view. */
export function westToEast(regions: RegionCounts[]): RegionCounts[] {
  return regionLayout(regions)
    .sort((a, b) => Number(a.z > 4) - Number(b.z > 4) || a.x - b.x)
    .map((p) => p.r);
}
