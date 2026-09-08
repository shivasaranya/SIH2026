import React, { createContext, useContext, useState, useEffect } from 'react';
import { setActiveStateId } from '../services/api';

// All known state IDs — operational + any non-operational slug passed from the map
export type StateId = string;

export interface StateConfig {
  id: StateId;
  name: string;
  code: string;
  adminUnitName: string;
  adminUnitPlural: string;
  districtCount: number;
  adminUnitCount: number;
  candidateHostsCount: number;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  isCoastal: boolean;
  sdmaName: string;
  tagline: string;
}

// ─── Operational state configs ────────────────────────────────────────────────
export const STATE_CONFIGS: Record<string, StateConfig> = {
  andhra_pradesh: {
    id: 'andhra_pradesh',
    name: 'Andhra Pradesh',
    code: 'AP',
    adminUnitName: 'Mandal',
    adminUnitPlural: 'Mandals',
    districtCount: 26,
    adminUnitCount: 696,
    candidateHostsCount: 51,
    center: [15.90, 80.76],
    bounds: [[12.60, 76.75], [19.18, 84.78]],
    isCoastal: true,
    sdmaName: 'Andhra Pradesh SDMA (APSDMA)',
    tagline: 'Bay of Bengal Multi-Hazard Vulnerability & Relocation Decision System',
  },
  tamil_nadu: {
    id: 'tamil_nadu',
    name: 'Tamil Nadu',
    code: 'TN',
    adminUnitName: 'Taluk',
    adminUnitPlural: 'Taluks',
    districtCount: 38,
    adminUnitCount: 302,
    candidateHostsCount: 38,
    center: [11.1271, 78.6569],
    bounds: [[8.08, 76.24], [13.58, 80.35]],
    isCoastal: true,
    sdmaName: 'Tamil Nadu SDMA (TNDMA)',
    tagline: 'Coromandel Coast & Delta Disaster Preparedness & Resettlement Platform',
  },
  mizoram: {
    id: 'mizoram',
    name: 'Mizoram',
    code: 'MZ',
    adminUnitName: 'R.D. Block',
    adminUnitPlural: 'R.D. Blocks',
    districtCount: 11,
    adminUnitCount: 26,
    candidateHostsCount: 5,
    center: [23.1645, 92.9376],
    bounds: [[21.95, 92.25], [24.55, 93.45]],
    isCoastal: false,
    sdmaName: 'Mizoram Disaster Management Authority (DM&R)',
    tagline: 'Hilly Terrain Landslide & Multi-Hazard Resettlement Decision Platform',
  },
  himachal_pradesh: {
    id: 'himachal_pradesh',
    name: 'Himachal Pradesh',
    code: 'HP',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 12,
    adminUnitCount: 172,
    candidateHostsCount: 15,
    center: [31.9, 77.1],
    bounds: [[30.38, 75.56], [33.25, 79.00]],
    isCoastal: false,
    sdmaName: 'Himachal Pradesh State Disaster Management Authority (HPSDMA)',
    tagline: 'Himalayan Landslide, Earthquake & Multi-Hazard Resettlement Decision Platform',
  },
  assam: {
    id: 'assam',
    name: 'Assam',
    code: 'AS',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 35,
    adminUnitCount: 219,
    candidateHostsCount: 18,
    center: [26.2006, 92.9376],
    bounds: [[24.10, 89.70], [27.97, 96.02]],
    isCoastal: false,
    sdmaName: 'Assam State Disaster Management Authority (ASDMA)',
    tagline: 'Brahmaputra Flood & Erosion Vulnerability Resettlement Decision Platform',
  },
  bihar: {
    id: 'bihar',
    name: 'Bihar',
    code: 'BR',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 38,
    adminUnitCount: 534,
    candidateHostsCount: 40,
    center: [25.6, 85.13],
    bounds: [[24.29, 83.32], [27.52, 88.30]],
    isCoastal: false,
    sdmaName: 'Bihar State Disaster Management Authority (BSDMA)',
    tagline: 'Ganga Plain Flood & Multi-Hazard Vulnerability Resettlement Decision Platform',
  },
  west_bengal: {
    id: 'west_bengal',
    name: 'West Bengal',
    code: 'WB',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 23,
    adminUnitCount: 341,
    candidateHostsCount: 28,
    center: [22.99, 87.85],
    bounds: [[21.50, 85.82], [27.22, 89.88]],
    isCoastal: true,
    sdmaName: 'West Bengal State Disaster Management Authority (WBSDMA)',
    tagline: 'Cyclone, Flood & Sundarban Coastal Vulnerability Resettlement Platform',
  },
  odisha: {
    id: 'odisha',
    name: 'Odisha',
    code: 'OD',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 30,
    adminUnitCount: 314,
    candidateHostsCount: 32,
    center: [20.52, 84.66],
    bounds: [[17.78, 81.38], [22.57, 87.50]],
    isCoastal: true,
    sdmaName: 'Odisha State Disaster Management Authority (OSDMA)',
    tagline: 'Bay of Bengal Cyclone & Flood Multi-Hazard Resettlement Decision Platform',
  },
  uttar_pradesh: {
    id: 'uttar_pradesh',
    name: 'Uttar Pradesh',
    code: 'UP',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 75,
    adminUnitCount: 351,
    candidateHostsCount: 60,
    center: [26.85, 80.91],
    bounds: [[23.87, 77.08], [30.41, 84.66]],
    isCoastal: false,
    sdmaName: 'Uttar Pradesh State Disaster Management Authority (UPSDMA)',
    tagline: 'Ganga–Yamuna Doab Flood & Multi-Hazard Vulnerability Resettlement Platform',
  },
  uttarakhand: {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    code: 'UK',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 13,
    adminUnitCount: 95,
    candidateHostsCount: 14,
    center: [30.07, 79.0],
    bounds: [[28.70, 77.57], [31.42, 81.02]],
    isCoastal: false,
    sdmaName: 'Uttarakhand State Disaster Management Authority (UKSDMA)',
    tagline: 'Himalayan Flood, Landslide & Earthquake Resettlement Decision Platform',
  },
  sikkim: {
    id: 'sikkim',
    name: 'Sikkim',
    code: 'SK',
    adminUnitName: 'Subdivision',
    adminUnitPlural: 'Subdivisions',
    districtCount: 6,
    adminUnitCount: 9,
    candidateHostsCount: 5,
    center: [27.53, 88.51],
    bounds: [[27.08, 88.01], [28.13, 88.92]],
    isCoastal: false,
    sdmaName: 'Sikkim State Disaster Management Authority (SSDMA)',
    tagline: 'Himalayan Landslide, GLOFs & Earthquake Resettlement Decision Platform',
  },
  arunachal_pradesh: {
    id: 'arunachal_pradesh',
    name: 'Arunachal Pradesh',
    code: 'AR',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 25,
    adminUnitCount: 247,
    candidateHostsCount: 20,
    center: [28.22, 94.73],
    bounds: [[26.65, 91.59], [29.47, 97.41]],
    isCoastal: false,
    sdmaName: 'Arunachal Pradesh State Disaster Management Authority (APSDMA)',
    tagline: 'Eastern Himalaya Flood, Landslide & Multi-Hazard Resettlement Platform',
  },
  nagaland: {
    id: 'nagaland',
    name: 'Nagaland',
    code: 'NL',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 16,
    adminUnitCount: 68,
    candidateHostsCount: 8,
    center: [26.16, 94.56],
    bounds: [[25.16, 93.33], [27.06, 95.26]],
    isCoastal: false,
    sdmaName: 'Nagaland State Disaster Management Authority (NSDMA)',
    tagline: 'Hill District Landslide & Multi-Hazard Vulnerability Resettlement Platform',
  },
  meghalaya: {
    id: 'meghalaya',
    name: 'Meghalaya',
    code: 'ML',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 12,
    adminUnitCount: 40,
    candidateHostsCount: 7,
    center: [25.47, 91.37],
    bounds: [[24.92, 89.83], [26.11, 92.79]],
    isCoastal: false,
    sdmaName: 'Meghalaya State Disaster Management Authority (MeSDMA)',
    tagline: 'Hill State Flood, Landslide & Earthquake Resettlement Decision Platform',
  },
};

// ─── Generic config for any non-operational state ────────────────────────────
const buildGenericConfig = (stateId: string): StateConfig => {
  const name = stateId
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    id: stateId,
    name,
    code: stateId.slice(0, 2).toUpperCase(),
    adminUnitName: 'Unit',
    adminUnitPlural: 'Units',
    districtCount: 0,
    adminUnitCount: 0,
    candidateHostsCount: 0,
    center: [22.5, 82.0],
    bounds: [[8.0, 68.0], [37.0, 97.5]],
    isCoastal: false,
    sdmaName: `${name} State Disaster Management Authority`,
    tagline: `${name} — Disaster Risk Reduction & Resettlement Decision Platform`,
  };
};

// ─── Name → stateId resolver (matches App.tsx resolveStateFromName) ───────────
const stateIdFromName = (name: string): string => {
  const n = name.trim().toLowerCase();
  if (n.includes('andhra'))       return 'andhra_pradesh';
  if (n.includes('mizo'))         return 'mizoram';
  if (n.includes('himachal'))     return 'himachal_pradesh';
  if (n.includes('tamil'))        return 'tamil_nadu';
  if (n.includes('assam'))        return 'assam';
  if (n.includes('bihar'))        return 'bihar';
  if (n.includes('west bengal') || n.includes('westbengal')) return 'west_bengal';
  if (n.includes('odisha') || n.includes('orissa'))          return 'odisha';
  if (n.includes('uttar pradesh') || n.includes('uttarpradesh')) return 'uttar_pradesh';
  if (n.includes('uttarakhand') || n.includes('uttaranchal'))    return 'uttarakhand';
  if (n.includes('sikkim'))       return 'sikkim';
  if (n.includes('arunachal'))    return 'arunachal_pradesh';
  if (n.includes('nagaland'))     return 'nagaland';
  if (n.includes('meghalaya'))    return 'meghalaya';
  // Non-operational: build a clean slug
  return n.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

// ─── Hash → stateId resolver ─────────────────────────────────────────────────
const stateIdFromHash = (hash: string): string => {
  const slugSegment = hash.replace('#government/', '').split('/')[0];
  const slug = slugSegment || 'ap';
  if (slug === 'ap' || slug.includes('andhra'))           return 'andhra_pradesh';
  if (slug === 'mz' || slug.includes('mizoram'))          return 'mizoram';
  if (slug === 'hp' || slug.includes('himachal'))         return 'himachal_pradesh';
  if (slug === 'tn' || slug.includes('tamil'))            return 'tamil_nadu';
  if (slug === 'as' || slug.includes('assam'))            return 'assam';
  if (slug === 'br' || slug.includes('bihar'))            return 'bihar';
  if (slug === 'wb' || slug.includes('west-bengal') || slug.includes('bengal')) return 'west_bengal';
  if (slug === 'od' || slug.includes('odisha') || slug.includes('orissa'))      return 'odisha';
  if (slug === 'up' || slug.includes('uttar-pradesh'))    return 'uttar_pradesh';
  if (slug === 'uk' || slug.includes('uttarakhand'))      return 'uttarakhand';
  if (slug === 'sk' || slug.includes('sikkim'))           return 'sikkim';
  if (slug === 'ar' || slug.includes('arunachal'))        return 'arunachal_pradesh';
  if (slug === 'nl' || slug.includes('nagaland'))         return 'nagaland';
  if (slug === 'ml' || slug.includes('meghalaya'))        return 'meghalaya';
  return slug; // non-operational: preserve slug
};

interface StateContextType {
  currentState: StateConfig;
  stateId: StateId;
  setStateId: (id: StateId) => void;
  selectStateByName: (name: string) => void;
  availableStates: StateConfig[];
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialState = (): string => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith('#government') && !hash.includes('select-state') && !hash.includes('/states')) {
        return stateIdFromHash(hash);
      }
    }
    return 'andhra_pradesh';
  };

  const [stateId, setStateIdState] = useState<string>(getInitialState);

  useEffect(() => {
    setActiveStateId(stateId);
  }, [stateId]);

  const setStateId = (newId: string) => {
    setActiveStateId(newId);
    setStateIdState(newId);
  };

  // Resolves any display name → correct stateId and sets it
  const selectStateByName = (name: string) => {
    setStateId(stateIdFromName(name));
  };

  // Keep StateContext in sync when App.tsx changes the hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith('#government') && !hash.includes('select-state') && !hash.includes('/states')) {
        setStateIdState(stateIdFromHash(hash));
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const currentState = STATE_CONFIGS[stateId] ?? buildGenericConfig(stateId);
  const availableStates = Object.values(STATE_CONFIGS);

  return (
    <StateContext.Provider
      value={{
        currentState,
        stateId,
        setStateId,
        selectStateByName,
        availableStates,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useActiveState = (): StateContextType => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useActiveState must be used within a StateProvider');
  }
  return context;
};
