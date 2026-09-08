/**
 * OpenStreetMap Overpass API Service - Comprehensive Category Coverage for Satellite & Standard Maps
 *
 * FULL LIST OF 9 CATEGORIES:
 * 1. 🏫 Education: school, college, university, tuition centers, libraries
 * 2. 🏥 Medical: hospital, clinic, pharmacy/medical shop, blood bank, ambulance services
 * 3. 🛒 Daily Needs: supermarkets, grocery stores, kirana shops, bakeries, malls
 * 4. 🏢 Government / Public: police station, fire station, government offices, municipal office, ration shops
 * 5. 🚰 Emergency / Safety: shelters, relief camps, safe buildings, evacuation centers, disaster management offices
 * 6. ⛽ Transport & Travel: bus stops, railway stations, airports, petrol pumps, parking
 * 7. 🍴 Food & Lifestyle: restaurants, hotels, cafes, hostels
 * 8. 🏦 Financial: banks, ATMs
 * 9. 🛕 Others: temples, mosques, churches, parks, playgrounds
 */

export type POIGroupKey =
  | 'education'
  | 'medical'
  | 'daily_needs'
  | 'government'
  | 'emergency'
  | 'transport'
  | 'food_lifestyle'
  | 'financial'
  | 'others';

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
  leisure?: string;
  tourism?: string;
  highway?: string;
  railway?: string;
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
    icon: '🏫',
    color: '#3b82f6',
    badgeBg: '#eff6ff',
    badgeText: '#1d4ed8',
    borderColor: '#2563eb',
    subTypes: ['Schools', 'Colleges', 'Universities', 'Tuition Centres', 'Libraries'],
  },
  medical: {
    key: 'medical',
    label: 'Medical & Health',
    icon: '🏥',
    color: '#ef4444',
    badgeBg: '#fef2f2',
    badgeText: '#b91c1c',
    borderColor: '#dc2626',
    subTypes: ['Hospitals', 'Clinics', 'Pharmacies', 'Blood Banks', 'Ambulance'],
  },
  emergency: {
    key: 'emergency',
    label: 'Emergency & Safety',
    icon: '🚰',
    color: '#ea580c',
    badgeBg: '#fff7ed',
    badgeText: '#9a3412',
    borderColor: '#c2410c',
    subTypes: ['Shelters', 'Relief Camps', 'Safe Buildings', 'Evacuation Centers', 'Disaster Hubs'],
  },
  government: {
    key: 'government',
    label: 'Government & Public',
    icon: '🏢',
    color: '#6366f1',
    badgeBg: '#eef2ff',
    badgeText: '#4338ca',
    borderColor: '#4f46e5',
    subTypes: ['Police Stations', 'Fire Stations', 'Govt Offices', 'Municipalities', 'Ration Shops'],
  },
  daily_needs: {
    key: 'daily_needs',
    label: 'Daily Needs & Markets',
    icon: '🛒',
    color: '#10b981',
    badgeBg: '#ecfdf5',
    badgeText: '#047857',
    borderColor: '#059669',
    subTypes: ['Supermarkets', 'Grocery Stores', 'Kirana Shops', 'Bakeries', 'Malls'],
  },
  transport: {
    key: 'transport',
    label: 'Transport & Travel',
    icon: '⛽',
    color: '#0284c7',
    badgeBg: '#f0f9ff',
    badgeText: '#0369a1',
    borderColor: '#0ea5e9',
    subTypes: ['Bus Stops', 'Railway Stations', 'Airports', 'Petrol Pumps', 'Parking'],
  },
  food_lifestyle: {
    key: 'food_lifestyle',
    label: 'Food & Lifestyle',
    icon: '🍴',
    color: '#d97706',
    badgeBg: '#fffbeb',
    badgeText: '#b45309',
    borderColor: '#f59e0b',
    subTypes: ['Restaurants', 'Hotels', 'Cafes', 'Hostels'],
  },
  financial: {
    key: 'financial',
    label: 'Financial & Banking',
    icon: '🏦',
    color: '#0d9488',
    badgeBg: '#f0fdfa',
    badgeText: '#0f766e',
    borderColor: '#14b8a6',
    subTypes: ['Banks', 'ATMs'],
  },
  others: {
    key: 'others',
    label: 'Religious & Public Parks',
    icon: '🛕',
    color: '#9333ea',
    badgeBg: '#faf5ff',
    badgeText: '#7e22ce',
    borderColor: '#a855f7',
    subTypes: ['Temples', 'Mosques', 'Churches', 'Parks', 'Playgrounds'],
  },
};

// In-memory cache keyed by spatial grid
const poiCache = new Map<string, { timestamp: number; data: OverpassPOI[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache validity

// Free High-Availability Overpass Endpoints
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

/**
 * Builds the comprehensive Overpass QL Query covering all full list requirements
 */
export function buildOverpassQueryForAllCategories(lat: number, lng: number, radiusMeters: number = 5000): string {
  return `[out:json][timeout:30];
(
  /* 1. Education */
  node["amenity"~"^(school|college|university|kindergarten|language_school|music_school|prep_school|library)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["cram_school"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 2. Medical */
  node["amenity"~"^(hospital|clinic|pharmacy|blood_bank|ambulance_station|doctors|dentist|health_centre|nursing_home)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["healthcare"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 3. Emergency / Safety */
  node["amenity"~"^(shelter|emergency_phone|assembly_point|social_facility)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["emergency"~"^(disaster_management|evacuation_centre|shelter|assembly_point|fire_hydrant|siren|defibrillator)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["building"="shelter"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 4. Government / Public */
  node["amenity"~"^(police|fire_station|post_office|townhall|courthouse|register_office|public_building|administrative)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["office"~"^(government|administrative|state|local|cooperative)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["shop"="ration"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 5. Daily Needs */
  node["shop"](around:${radiusMeters}, ${lat}, ${lng});
  node["amenity"="marketplace"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 6. Transport & Travel */
  node["amenity"~"^(bus_station|fuel|parking|parking_space|taxi|ferry_terminal)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["highway"~"^(bus_stop|platform)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["railway"~"^(station|halt|tram_stop)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["aeroway"~"^(aerodrome|terminal|helipad)$"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 7. Food & Lifestyle */
  node["amenity"~"^(restaurant|cafe|fast_food|food_court|bar|pub|ice_cream)$"](around:${radiusMeters}, ${lat}, ${lng});
  node["tourism"~"^(hotel|hostel|guest_house|motel|camp_site)$"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 8. Financial */
  node["amenity"~"^(bank|atm|bureau_de_change)$"](around:${radiusMeters}, ${lat}, ${lng});
  
  /* 9. Religious & Others */
  node["amenity"="place_of_worship"](around:${radiusMeters}, ${lat}, ${lng});
  node["amenity"="community_centre"](around:${radiusMeters}, ${lat}, ${lng});
  node["leisure"~"^(park|playground|pitch|garden|sports_centre|stadium|swimming_pool)$"](around:${radiusMeters}, ${lat}, ${lng});
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
  const highway = (tags.highway || '').toLowerCase();
  const tourism = (tags.tourism || '').toLowerCase();
  const leisure = (tags.leisure || '').toLowerCase();
  const healthcare = (tags.healthcare || '').toLowerCase();
  const religion = (tags.religion || '').toLowerCase();
  const aeroway = (tags.aeroway || '').toLowerCase();

  // 1. 🏫 Education
  if (
    ['school', 'college', 'university', 'kindergarten', 'library', 'language_school', 'music_school', 'prep_school'].includes(amenity) ||
    tags.cram_school ||
    tags.tuition
  ) {
    let type = 'Education';
    if (amenity === 'school') type = 'School';
    else if (amenity === 'college') type = 'College';
    else if (amenity === 'university') type = 'University';
    else if (amenity === 'library') type = 'Library';
    else if (tags.cram_school || tags.tuition) type = 'Tuition Centre';
    else type = amenity.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { group: 'education', subType: type };
  }

  // 2. 🏥 Medical
  if (
    ['hospital', 'clinic', 'pharmacy', 'blood_bank', 'ambulance_station', 'doctors', 'dentist', 'health_centre', 'nursing_home'].includes(amenity) ||
    healthcare
  ) {
    let type = 'Medical';
    if (amenity === 'hospital' || healthcare === 'hospital') type = 'Hospital';
    else if (amenity === 'clinic' || healthcare === 'clinic') type = 'Clinic';
    else if (amenity === 'pharmacy' || shop === 'chemist' || shop === 'medical') type = 'Pharmacy / Medical Shop';
    else if (amenity === 'blood_bank' || healthcare === 'blood_bank') type = 'Blood Bank';
    else if (amenity === 'ambulance_station') type = 'Ambulance Service';
    else type = (amenity || healthcare).replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { group: 'medical', subType: type };
  }

  // 5. 🚰 Emergency / Safety (Relief camps, shelters, evacuation centers)
  if (
    ['shelter', 'emergency_phone', 'assembly_point', 'social_facility'].includes(amenity) ||
    emergency ||
    tags.building === 'shelter'
  ) {
    let type = 'Emergency Facility';
    if (emergency === 'disaster_management') type = 'Disaster Management Office';
    else if (emergency === 'evacuation_centre' || amenity === 'shelter') type = 'Cyclone / Flood Shelter';
    else if (emergency === 'assembly_point' || amenity === 'assembly_point') type = 'Safe Evacuation Point';
    else if (emergency === 'relief_camp') type = 'Relief Camp';
    else type = (emergency || amenity).replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { group: 'emergency', subType: type };
  }

  // 4. 🏢 Government / Public
  if (
    ['police', 'fire_station', 'post_office', 'townhall', 'courthouse', 'register_office', 'public_building', 'administrative'].includes(amenity) ||
    office === 'government' ||
    office === 'administrative' ||
    shop === 'ration'
  ) {
    let type = 'Govt Office';
    if (amenity === 'police') type = 'Police Station';
    else if (amenity === 'fire_station') type = 'Fire Station';
    else if (amenity === 'townhall') type = 'Municipal Office';
    else if (amenity === 'post_office') type = 'Post Office';
    else if (shop === 'ration' || tags.fair_price_shop) type = 'Ration Shop (PDS)';
    else if (office === 'government') type = 'Government Office';
    else type = amenity.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { group: 'government', subType: type };
  }

  // 6. ⛽ Transport & Travel
  if (
    ['bus_station', 'fuel', 'parking', 'parking_space', 'taxi', 'ferry_terminal'].includes(amenity) ||
    highway === 'bus_stop' ||
    highway === 'platform' ||
    railway ||
    aeroway
  ) {
    let type = 'Transport';
    if (highway === 'bus_stop' || amenity === 'bus_station') type = amenity === 'bus_station' ? 'Bus Station' : 'Bus Stop';
    else if (railway === 'station' || railway === 'halt') type = 'Railway Station';
    else if (aeroway) type = 'Airport';
    else if (amenity === 'fuel') type = 'Petrol Pump';
    else if (amenity === 'parking') type = 'Parking Area';
    else type = amenity.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { group: 'transport', subType: type };
  }

  // 7. 🍴 Food & Lifestyle
  if (
    ['restaurant', 'cafe', 'fast_food', 'food_court', 'bar', 'pub', 'ice_cream'].includes(amenity) ||
    ['hotel', 'hostel', 'guest_house', 'motel'].includes(tourism)
  ) {
    let type = 'Restaurant';
    if (tourism === 'hotel') type = 'Hotel';
    else if (tourism === 'hostel') type = 'Hostel';
    else if (tourism === 'guest_house') type = 'Guest House';
    else if (amenity === 'cafe') type = 'Cafe';
    else if (amenity === 'fast_food') type = 'Fast Food';
    else type = (tourism || amenity).replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { group: 'food_lifestyle', subType: type };
  }

  // 8. 🏦 Financial
  if (['bank', 'atm', 'bureau_de_change'].includes(amenity)) {
    let type = 'Bank';
    if (amenity === 'atm') type = 'ATM';
    else if (amenity === 'bank') type = 'Bank Branch';
    return { group: 'financial', subType: type };
  }

  // 9. 🛕 Others (Religious, Parks, Playgrounds)
  if (
    amenity === 'place_of_worship' ||
    religion ||
    ['park', 'playground', 'pitch', 'garden', 'sports_centre', 'stadium'].includes(leisure) ||
    amenity === 'community_centre'
  ) {
    let type = 'Place of Worship';
    if (religion === 'hindu' || tags['name:te']?.includes('గుడి') || tags.name?.toLowerCase().includes('temple')) type = 'Temple';
    else if (religion === 'muslim' || tags.name?.toLowerCase().includes('masjid') || tags.name?.toLowerCase().includes('mosque')) type = 'Mosque';
    else if (religion === 'christian' || tags.name?.toLowerCase().includes('church')) type = 'Church';
    else if (leisure === 'park') type = 'Public Park';
    else if (leisure === 'playground' || leisure === 'pitch') type = 'Playground';
    else if (amenity === 'community_centre') type = 'Community Centre';
    return { group: 'others', subType: type };
  }

  // 3. 🛒 Daily Needs (Supermarkets, Groceries, Kirana, Bakeries, Malls)
  if (shop || amenity === 'marketplace') {
    let type = 'Shop';
    if (shop === 'supermarket') type = 'Supermarket';
    else if (shop === 'convenience' || shop === 'general' || shop === 'grocery') type = 'Grocery / Kirana Store';
    else if (shop === 'bakery') type = 'Bakery';
    else if (shop === 'mall' || shop === 'department_store') type = 'Shopping Mall';
    else if (amenity === 'marketplace') type = 'Marketplace';
    else type = `${shop.charAt(0).toUpperCase() + shop.slice(1)} Shop`;
    return { group: 'daily_needs', subType: type };
  }

  return { group: 'daily_needs', subType: 'Local Shop' };
}

function getCacheKey(lat: number, lng: number, radius: number): string {
  const quantLat = (Math.round(lat * 100) / 100).toFixed(2);
  const quantLng = (Math.round(lng * 100) / 100).toFixed(2);
  return `${quantLat}_${quantLng}_${radius}`;
}

/**
 * Fetches dynamic POIs across ALL categories from OpenStreetMap Overpass API
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radius Radius in meters (default 5000m)
 * @param signal Optional AbortSignal
 */
export async function fetchNearbyPOIs(
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

  const query = buildOverpassQueryForAllCategories(lat, lng, radius);
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
      if (!json || !json.elements || !Array.isArray(json.elements)) {
        return [];
      }
      const elements: any[] = json.elements;

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
            tags['name:ta'] ||
            tags['name:or'] ||
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
            leisure: tags.leisure,
            tourism: tags.tourism,
            highway: tags.highway,
            railway: tags.railway,
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
