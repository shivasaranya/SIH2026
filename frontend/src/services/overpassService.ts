/**
 * OpenStreetMap Overpass API Service - Comprehensive Category Coverage
 * Fetches dynamic POIs across 9 essential categories:
 * 1. Education (school, college, university, library)
 * 2. Medical (hospital, clinic, pharmacy, blood_bank)
 * 3. Emergency & Safety (police, fire_station, shelter, disaster_management, evacuation_center)
 * 4. Government (government_office, post_office, townhall, register_office)
 * 5. Daily Needs (supermarket, grocery, bakery, mall, shop, marketplace)
 * 6. Transport (bus_station, railway_station, airport, fuel)
 * 7. Food & Stay (restaurant, cafe, hotel, hostel)
 * 8. Finance (bank, atm)
 * 9. Religion & Public (temple, mosque, church, park, community_centre)
 */

export type POIGroupKey =
  | 'education'
  | 'medical'
  | 'emergency'
  | 'government'
  | 'daily_needs'
  | 'transport'
  | 'food_stay'
  | 'finance'
  | 'religion_public';

export interface OverpassPOI {
  id: number;
  lat: number;
  lon: number;
  name: string;
  group: POIGroupKey;
  subType: string;
  amenity?: string;
  shop?: string;
  building?: string;
  office?: string;
  emergency?: string;
  religion?: string;
  rawTags: Record<string, string>;
}

export interface POIGroupConfig {
  key: POIGroupKey;
  label: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  subTypes: string[];
}

export const POI_GROUP_CONFIGS: Record<POIGroupKey, POIGroupConfig> = {
  education: {
    key: 'education',
    label: 'Education',
    icon: '🎓',
    color: '#3b82f6',
    badgeBg: '#eff6ff',
    badgeText: '#1d4ed8',
    borderColor: '#2563eb',
    subTypes: ['School', 'College', 'University', 'Library'],
  },
  medical: {
    key: 'medical',
    label: 'Medical & Health',
    icon: '🏥',
    color: '#ef4444',
    badgeBg: '#fef2f2',
    badgeText: '#b91c1c',
    borderColor: '#dc2626',
    subTypes: ['Hospital', 'Clinic', 'Pharmacy', 'Blood Bank'],
  },
  emergency: {
    key: 'emergency',
    label: 'Emergency & Safety',
    icon: '🚨',
    color: '#f97316',
    badgeBg: '#fff7ed',
    badgeText: '#c2410c',
    borderColor: '#ea580c',
    subTypes: ['Police', 'Fire Station', 'Shelter', 'Disaster Centre', 'Evacuation Hub'],
  },
  government: {
    key: 'government',
    label: 'Government & Public Admin',
    icon: '🏛️',
    color: '#6366f1',
    badgeBg: '#eef2ff',
    badgeText: '#4338ca',
    borderColor: '#4f46e5',
    subTypes: ['Govt Office', 'Post Office', 'Town Hall', 'Municipal'],
  },
  daily_needs: {
    key: 'daily_needs',
    label: 'Daily Needs & Markets',
    icon: '🛒',
    color: '#10b981',
    badgeBg: '#ecfdf5',
    badgeText: '#047857',
    borderColor: '#059669',
    subTypes: ['Supermarket', 'Grocery', 'Bakery', 'Mall', 'Shop', 'Marketplace'],
  },
  transport: {
    key: 'transport',
    label: 'Transport & Fuel',
    icon: '🚌',
    color: '#0ea5e9',
    badgeBg: '#f0f9ff',
    badgeText: '#0369a1',
    borderColor: '#0284c7',
    subTypes: ['Bus Station', 'Railway Station', 'Airport', 'Fuel Station'],
  },
  food_stay: {
    key: 'food_stay',
    label: 'Food & Hospitality',
    icon: '🍽️',
    color: '#d97706',
    badgeBg: '#fffbeb',
    badgeText: '#b45309',
    borderColor: '#d97706',
    subTypes: ['Restaurant', 'Café', 'Hotel', 'Hostel', 'Guest House'],
  },
  finance: {
    key: 'finance',
    label: 'Banking & Finance',
    icon: '🏦',
    color: '#14b8a6',
    badgeBg: '#f0fdfa',
    badgeText: '#0f766e',
    borderColor: '#0d9488',
    subTypes: ['Bank', 'ATM'],
  },
  religion_public: {
    key: 'religion_public',
    label: 'Religion & Community',
    icon: '🛕',
    color: '#a855f7',
    badgeBg: '#faf5ff',
    badgeText: '#7e22ce',
    borderColor: '#9333ea',
    subTypes: ['Temple', 'Mosque', 'Church', 'Park', 'Community Hall'],
  },
};

// In-memory cache keyed by spatial grid (lat/lon rounded to ~500m precision)
const poiCache = new Map<string, { timestamp: number; data: OverpassPOI[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache validity

// Primary Overpass endpoint with fallback
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

/**
 * Builds the comprehensive Overpass QL query covering all 9 categories
 */
export function buildComprehensiveOverpassQuery(lat: number, lng: number, radiusMeters: number = 5000): string {
  return `[out:json][timeout:30];
(
  /* 1. Education */
  node["amenity"~"^(school|college|university|library)$"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 2. Medical */
  node["amenity"~"^(hospital|clinic|pharmacy|blood_bank|doctors|dentist)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["healthcare"~"^(hospital|clinic|pharmacy|centre|blood_bank)$"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 3. Emergency & Safety */
  node["amenity"~"^(police|fire_station|shelter|emergency_phone)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["emergency"~"^(disaster_management|evacuation_centre|shelter|fire_hydrant|assembly_point)$"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 4. Government */
  node["amenity"~"^(post_office|townhall|courthouse|register_office|public_building)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["office"="government"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 5. Daily Needs */
  node["shop"](around:${radiusMeters}, ${lat}, ${lng});
  node["amenity"="marketplace"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 6. Transport */
  node["amenity"~"^(bus_station|fuel|ferry_terminal)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["railway"~"^(station|halt)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["aeroway"="aerodrome"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 7. Food & Stay */
  node["amenity"~"^(restaurant|cafe|fast_food|food_court)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["tourism"~"^(hotel|hostel|guest_house|motel)$"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 8. Finance */
  node["amenity"~"^(bank|atm)$"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 9. Religion & Public */
  node["amenity"="place_of_worship"](around:${radiusMeters}, ${lat}, ${lng});
  node["amenity"="community_centre"](around:${radiusMeters}, ${lat}, ${lng});
  node["leisure"~"^(park|garden|pitch)$"](around:${radiusMeters}, ${lat}, ${lng});
);
out body;
>;
out skel qt;`;
}

/**
 * Categorizes an OSM node into one of the 9 primary groups
 */
export function classifyOsmPOI(tags: Record<string, string>): { group: POIGroupKey; subType: string } {
  const amenity = (tags.amenity || '').toLowerCase();
  const shop = (tags.shop || '').toLowerCase();
  const office = (tags.office || '').toLowerCase();
  const emergency = (tags.emergency || '').toLowerCase();
  const railway = (tags.railway || '').toLowerCase();
  const tourism = (tags.tourism || '').toLowerCase();
  const leisure = (tags.leisure || '').toLowerCase();
  const healthcare = (tags.healthcare || '').toLowerCase();
  const religion = (tags.religion || '').toLowerCase();

  // 1. Education
  if (['school', 'college', 'university', 'library'].includes(amenity)) {
    return { group: 'education', subType: amenity.charAt(0).toUpperCase() + amenity.slice(1) };
  }

  // 2. Medical
  if (['hospital', 'clinic', 'pharmacy', 'blood_bank', 'doctors', 'dentist'].includes(amenity) || healthcare) {
    const type = amenity || healthcare || 'Medical';
    return { group: 'medical', subType: type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) };
  }

  // 3. Emergency & Safety
  if (['police', 'fire_station', 'shelter'].includes(amenity) || emergency) {
    const type = emergency || amenity || 'Emergency';
    return { group: 'emergency', subType: type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) };
  }

  // 4. Government
  if (['post_office', 'townhall', 'courthouse', 'register_office', 'public_building'].includes(amenity) || office === 'government') {
    const type = office === 'government' ? 'Government Office' : amenity.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { group: 'government', subType: type };
  }

  // 6. Transport
  if (['bus_station', 'fuel', 'ferry_terminal'].includes(amenity) || railway || tags.aeroway) {
    const type = tags.aeroway ? 'Airport' : railway ? 'Railway Station' : amenity.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { group: 'transport', subType: type };
  }

  // 7. Food & Stay
  if (['restaurant', 'cafe', 'fast_food', 'food_court'].includes(amenity) || tourism) {
    const type = tourism ? tourism.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : amenity.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { group: 'food_stay', subType: type };
  }

  // 8. Finance
  if (['bank', 'atm'].includes(amenity)) {
    return { group: 'finance', subType: amenity.toUpperCase() };
  }

  // 9. Religion & Public
  if (amenity === 'place_of_worship' || religion || ['park', 'garden', 'pitch'].includes(leisure) || amenity === 'community_centre') {
    let type = religion ? `${religion.charAt(0).toUpperCase() + religion.slice(1)} Place` : leisure ? leisure.charAt(0).toUpperCase() + leisure.slice(1) : 'Community Centre';
    if (amenity === 'place_of_worship' && !religion) type = 'Place of Worship';
    return { group: 'religion_public', subType: type };
  }

  // 5. Daily Needs (Default for shops or marketplace)
  if (shop || amenity === 'marketplace') {
    const type = shop ? `${shop.charAt(0).toUpperCase() + shop.slice(1)} Shop` : 'Marketplace';
    return { group: 'daily_needs', subType: type };
  }

  return { group: 'daily_needs', subType: 'General Place' };
}

function getCacheKey(lat: number, lng: number, radius: number): string {
  const quantLat = (Math.round(lat * 100) / 100).toFixed(2);
  const quantLng = (Math.round(lng * 100) / 100).toFixed(2);
  return `${quantLat}_${quantLng}_${radius}`;
}

/**
 * Fetches POIs across all 9 categories from OpenStreetMap Overpass API
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radius Radius in meters (default 5000m)
 * @param signal Optional AbortSignal
 */
export async function fetchComprehensivePOIs(
  lat: number,
  lng: number,
  radius: number = 5000,
  signal?: AbortSignal
): Promise<OverpassPOI[]> {
  const cacheKey = getCacheKey(lat, lng, radius);
  const cached = poiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const query = buildComprehensiveOverpassQuery(lat, lng, radius);
  let lastError: any = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      });

      if (!response.ok) {
        throw new Error(`Overpass HTTP ${response.status}`);
      }

      const json = await response.json();
      const elements: any[] = json.elements || [];

      const results: OverpassPOI[] = elements
        .filter((el) => el.type === 'node' && el.lat && el.lon && el.tags)
        .map((el) => {
          const tags = el.tags || {};
          const { group, subType } = classifyOsmPOI(tags);
          const name =
            tags.name ||
            tags['name:en'] ||
            tags['name:te'] ||
            tags['name:hi'] ||
            tags['operator'] ||
            tags['brand'] ||
            `Unnamed ${subType}`;

          return {
            id: el.id,
            lat: el.lat,
            lon: el.lon,
            name,
            group,
            subType,
            amenity: tags.amenity,
            shop: tags.shop,
            building: tags.building,
            office: tags.office,
            emergency: tags.emergency,
            religion: tags.religion,
            rawTags: tags,
          };
        });

      // Save to cache
      poiCache.set(cacheKey, {
        timestamp: Date.now(),
        data: results,
      });

      return results;
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
    }
  }

  console.warn('[Overpass] POI retrieval failed from all mirrors:', lastError);
  return [];
}
