/**
 * MBFD station identities + response territories.
 *
 * Territories are the chief's spoken boundaries (Government Cut → 14th St, etc.).
 * Coordinates are APPROXIMATE station-house locations and territory latitude bands
 * used only to lay out the spatial map relationally — they are not survey-grade and
 * are never presented as exact dispatch geometry.
 *
 * Miami Beach runs roughly south→north along the barrier island; `band` is the
 * south/north latitude pair, `centroid` is the approximate station house.
 */

export interface StationTerritory {
  /** Hub station id is matched at runtime by `number`; this is the well-known number. */
  number: string;
  name: string;
  territoryLabel: string;
  description: string;
  isMarine: boolean;
  /** Approximate station-house location. */
  centroid: { lat: number; lng: number };
  /** Territory south/north latitude band (approx). */
  band: { south: number; north: number };
  /** Accent used for nodes/bands on the map. */
  accent: string;
}

// Approximate Miami Beach landmarks (decimal degrees).
export const MIAMI_BEACH_BOUNDS = {
  south: 25.762, // Government Cut
  north: 25.864, // ~87th Ct / city north line
  east: -80.118, // Atlantic shoreline
  west: -80.16, // Intracoastal / Biscayne Bay
};

export const STATION_TERRITORIES: StationTerritory[] = [
  {
    number: '1',
    name: 'Station 1 — South Beach',
    territoryLabel: 'Government Cut → 14th St',
    description: 'Government Cut to 14th Street, ocean to Intracoastal. South Pointe, Ocean Drive, South Beach.',
    isMarine: false,
    centroid: { lat: 25.7796, lng: -80.134 },
    band: { south: 25.762, north: 25.787 },
    accent: '#FF6A3D',
  },
  {
    number: '2',
    name: 'Station 2 — Mid-Beach South',
    territoryLabel: '15th St → 41st St (incl. Julia Tuttle)',
    description:
      '15th Street to 41st Street, ocean to Intracoastal; includes Julia Tuttle Causeway. Lincoln Road, Collins, Convention Center.',
    isMarine: false,
    centroid: { lat: 25.795, lng: -80.137 },
    band: { south: 25.787, north: 25.812 },
    accent: '#FFC53D',
  },
  {
    number: '3',
    name: 'Station 3 — Mid-Beach',
    territoryLabel: '41st St → 64th St',
    description: '41st Street to 64th Street, ocean to Intracoastal. Eden Roc / Fontainebleau corridor.',
    isMarine: false,
    centroid: { lat: 25.823, lng: -80.122 },
    band: { south: 25.812, north: 25.836 },
    accent: '#4DA3FF',
  },
  {
    number: '4',
    name: 'Station 4 — North Beach',
    territoryLabel: '65th St → 87th Ct',
    description: '65th Street to 87th Court, ocean to Intracoastal. North Beach, Indian Creek.',
    isMarine: false,
    centroid: { lat: 25.843, lng: -80.121 },
    band: { south: 25.836, north: 25.864 },
    accent: '#21D07A',
  },
  {
    number: '6',
    name: 'Station 6 — Marine',
    territoryLabel: 'MacArthur · PortMiami · Gov Cut · Bay',
    description:
      'Marine station near the MacArthur Causeway. MacArthur Causeway, PortMiami, Government Cut, Biscayne Bay, offshore waters.',
    isMarine: true,
    centroid: { lat: 25.782, lng: -80.158 },
    band: { south: 25.762, north: 25.79 },
    accent: '#2FB6C9',
  },
];

export function territoryByNumber(num: string | number): StationTerritory | undefined {
  const key = String(num);
  return STATION_TERRITORIES.find((t) => t.number === key);
}

/** Project a lat/lng into a 0..1 map space (x = east-west, y = south-north flipped for screen). */
export function projectToMap(lat: number, lng: number): { x: number; y: number } {
  const { south, north, east, west } = MIAMI_BEACH_BOUNDS;
  const x = clamp01((lng - west) / (east - west));
  const y = clamp01(1 - (lat - south) / (north - south)); // screen y grows downward
  return { x, y };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
