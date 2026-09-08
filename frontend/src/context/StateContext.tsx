import React, { createContext, useContext, useState, useEffect } from 'react';
import { setActiveStateId } from '../services/api';

export type StateId = string;

export interface StateConfig {
  id: StateId;
  name: string;
  code: string;
  adminUnitName: string; // 'Mandal' | 'Taluk' | 'Tehsil' | 'Taluka' | 'R.D. Block' | 'Circle' | 'Subdivision'
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

export const STATE_CONFIGS: Record<StateId, StateConfig> = {
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
    bounds: [
      [12.60, 76.75],
      [19.18, 84.78],
    ],
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
    bounds: [
      [8.08, 76.24],
      [13.58, 80.35],
    ],
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
    candidateHostsCount: 6,
    center: [23.1645, 92.9376],
    bounds: [
      [21.95, 92.25],
      [24.55, 93.45],
    ],
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
    bounds: [
      [30.38, 75.56],
      [33.25, 79.00],
    ],
    isCoastal: false,
    sdmaName: 'Himachal Pradesh State Disaster Management Authority (HPSDMA)',
    tagline: 'Himalayan Landslide, Earthquake & Multi-Hazard Resettlement Decision Platform',
  },
  jammu_kashmir: {
    id: 'jammu_kashmir',
    name: 'Jammu and Kashmir',
    code: 'JK',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 20,
    adminUnitCount: 197,
    candidateHostsCount: 18,
    center: [33.7782, 75.0],
    bounds: [
      [32.2751, 73.7676],
      [34.7878, 76.7811],
    ],
    isCoastal: false,
    sdmaName: 'Jammu & Kashmir SDMA (JKDMA)',
    tagline: 'Himalayan River Basin Multi-Hazard Resilience & Resettlement Platform',
  },
  madhya_pradesh: {
    id: 'madhya_pradesh',
    name: 'Madhya Pradesh',
    code: 'MP',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 52,
    adminUnitCount: 422,
    candidateHostsCount: 25,
    center: [23.97, 78.42],
    bounds: [
      [21.07, 74.03],
      [26.87, 82.81],
    ],
    isCoastal: false,
    sdmaName: 'Madhya Pradesh SDMA (MPSDMA)',
    tagline: 'Central River Basin Multi-Hazard Resilience & Resettlement Platform',
  },
  gujarat: {
    id: 'gujarat',
    name: 'Gujarat',
    code: 'GJ',
    adminUnitName: 'Taluka',
    adminUnitPlural: 'Talukas',
    districtCount: 33,
    adminUnitCount: 252,
    candidateHostsCount: 115,
    center: [22.2587, 71.1924],
    bounds: [
      [20.0, 68.0],
      [24.8, 74.6],
    ],
    isCoastal: true,
    sdmaName: 'Gujarat State Disaster Management Authority (GSDMA)',
    tagline: 'Arabian Sea Cyclone, Surge, Earthquake & Relocation Decision System',
  },
  kerala: {
    id: 'kerala',
    name: 'Kerala',
    code: 'KL',
    adminUnitName: 'Taluk',
    adminUnitPlural: 'Taluks',
    districtCount: 14,
    adminUnitCount: 61,
    candidateHostsCount: 11,
    center: [10.45, 76.35],
    bounds: [
      [8.25, 74.85],
      [12.85, 77.45],
    ],
    isCoastal: true,
    sdmaName: 'Kerala State Disaster Management Authority (KSDMA)',
    tagline: 'Western Ghats Inundation, Landslide & Resettlement Platform',
  },
  maharashtra: {
    id: 'maharashtra',
    name: 'Maharashtra',
    code: 'MH',
    adminUnitName: 'Taluka',
    adminUnitPlural: 'Talukas',
    districtCount: 35,
    adminUnitCount: 317,
    candidateHostsCount: 109,
    center: [19.75, 75.71],
    bounds: [
      [15.60, 72.60],
      [22.05, 80.95],
    ],
    isCoastal: true,
    sdmaName: 'Maharashtra State Disaster Management Authority (MSDMA)',
    tagline: 'Konkan Coastal Surge, Flood & Relocation Decision System',
  },
  haryana: {
    id: 'haryana',
    name: 'Haryana',
    code: 'HR',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 22,
    adminUnitCount: 45,
    candidateHostsCount: 19,
    center: [29.0588, 76.0856],
    bounds: [
      [27.65, 74.47],
      [30.93, 77.60],
    ],
    isCoastal: false,
    sdmaName: 'Haryana State Disaster Management Authority (HSDMA)',
    tagline: 'Yamuna-Ghaggar Basin Flood & Disaster Preparedness Platform',
  },
  punjab: {
    id: 'punjab',
    name: 'Punjab',
    code: 'PB',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 23,
    adminUnitCount: 45,
    candidateHostsCount: 180,
    center: [31.1471, 75.3412],
    bounds: [
      [29.54, 73.88],
      [32.66, 76.95],
    ],
    isCoastal: false,
    sdmaName: 'Punjab State Disaster Management Authority (PSDMA)',
    tagline: 'Indus Basin Sutlej-Beas-Ravi Flood & Relocation Decision System',
  },
  chhattisgarh: {
    id: 'chhattisgarh',
    name: 'Chhattisgarh',
    code: 'CG',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 33,
    adminUnitCount: 58,
    candidateHostsCount: 44,
    center: [21.2787, 81.8661],
    bounds: [
      [17.78, 80.24],
      [24.10, 84.40],
    ],
    isCoastal: false,
    sdmaName: 'Chhattisgarh State Disaster Management Authority (CGSDMA)',
    tagline: 'Mahanadi Basin Riverine Flood & Relocation Decision System',
  },
  odisha: {
    id: 'odisha',
    name: 'Odisha',
    code: 'OD',
    adminUnitName: 'Taluk',
    adminUnitPlural: 'Taluks',
    districtCount: 30,
    adminUnitCount: 317,
    candidateHostsCount: 42,
    center: [20.95, 85.09],
    bounds: [
      [17.8, 81.3],
      [22.6, 87.5],
    ],
    isCoastal: true,
    sdmaName: 'Odisha State Disaster Management Authority (OSDMA)',
    tagline: 'East Coast Super Cyclone, Storm Surge & Relocation Platform',
  },
  assam: {
    id: 'assam',
    name: 'Assam',
    code: 'AS',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 35,
    adminUnitCount: 154,
    candidateHostsCount: 38,
    center: [26.20, 92.93],
    bounds: [
      [24.1, 89.7],
      [28.0, 96.0],
    ],
    isCoastal: false,
    sdmaName: 'Assam State Disaster Management Authority (ASDMA)',
    tagline: 'Brahmaputra Flood & Multi-Hazard Resettlement Platform',
  },
  bihar: {
    id: 'bihar',
    name: 'Bihar',
    code: 'BR',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 38,
    adminUnitCount: 534,
    candidateHostsCount: 48,
    center: [25.09, 85.31],
    bounds: [
      [24.3, 83.3],
      [27.5, 88.3],
    ],
    isCoastal: false,
    sdmaName: 'Bihar State Disaster Management Authority (BSDMA)',
    tagline: 'Kosi-Ganga Basin Riverine Flood & Resettlement Platform',
  },
  west_bengal: {
    id: 'west_bengal',
    name: 'West Bengal',
    code: 'WB',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 23,
    adminUnitCount: 345,
    candidateHostsCount: 45,
    center: [22.98, 87.85],
    bounds: [
      [21.5, 85.8],
      [27.2, 89.9],
    ],
    isCoastal: true,
    sdmaName: 'West Bengal Disaster Management Authority (WBDMA)',
    tagline: 'Sundarbans Coastal & Deltaic Multi-Hazard Platform',
  },
  uttar_pradesh: {
    id: 'uttar_pradesh',
    name: 'Uttar Pradesh',
    code: 'UP',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 75,
    adminUnitCount: 351,
    candidateHostsCount: 65,
    center: [26.84, 80.94],
    bounds: [
      [23.8, 77.1],
      [30.4, 84.6],
    ],
    isCoastal: false,
    sdmaName: 'Uttar Pradesh State Disaster Management Authority (UPSDMA)',
    tagline: 'Gangetic Plain Flood & Multi-Hazard Decision Platform',
  },
  uttarakhand: {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    code: 'UK',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 13,
    adminUnitCount: 110,
    candidateHostsCount: 18,
    center: [30.06, 79.01],
    bounds: [
      [28.7, 77.5],
      [31.5, 81.0],
    ],
    isCoastal: false,
    sdmaName: 'Uttarakhand State Disaster Management Authority (USDMA)',
    tagline: 'High Himalayan Flash Flood, Cloudburst & Landslide Resettlement System',
  },
  sikkim: {
    id: 'sikkim',
    name: 'Sikkim',
    code: 'SK',
    adminUnitName: 'Subdivision',
    adminUnitPlural: 'Subdivisions',
    districtCount: 6,
    adminUnitCount: 34,
    candidateHostsCount: 12,
    center: [27.53, 88.51],
    bounds: [
      [27.0, 88.0],
      [28.1, 88.9],
    ],
    isCoastal: false,
    sdmaName: 'Sikkim State Disaster Management Authority (SSDMA)',
    tagline: 'Eastern Himalayan GLOF & Flash Flood Resettlement Decision System',
  },
  arunachal_pradesh: {
    id: 'arunachal_pradesh',
    name: 'Arunachal Pradesh',
    code: 'AR',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 26,
    adminUnitCount: 188,
    candidateHostsCount: 22,
    center: [28.21, 94.72],
    bounds: [
      [26.4, 91.5],
      [29.5, 97.4],
    ],
    isCoastal: false,
    sdmaName: 'Arunachal Pradesh State Disaster Management Authority (APSDMA)',
    tagline: 'Eastern Himalayan Seismic & Landslide Multi-Hazard Decision System',
  },
  nagaland: {
    id: 'nagaland',
    name: 'Nagaland',
    code: 'NL',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 16,
    adminUnitCount: 114,
    candidateHostsCount: 16,
    center: [26.15, 94.56],
    bounds: [
      [25.1, 93.3],
      [27.0, 95.2],
    ],
    isCoastal: false,
    sdmaName: 'Nagaland State Disaster Management Authority (NSDMA)',
    tagline: 'Naga Hills Earthquake & Landslide Resettlement Decision System',
  },
  meghalaya: {
    id: 'meghalaya',
    name: 'Meghalaya',
    code: 'ML',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 12,
    adminUnitCount: 46,
    candidateHostsCount: 14,
    center: [25.46, 91.36],
    bounds: [
      [25.0, 89.8],
      [26.1, 92.8],
    ],
    isCoastal: false,
    sdmaName: 'Meghalaya State Disaster Management Authority (MSDMA)',
    tagline: 'Meghalaya Plateau Extreme Precipitation & Flood Decision System',
  },
};

// ─── Generic config for any non-operational state ────────────────────────────
export const buildGenericConfig = (stateId: string): StateConfig => {
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

// ─── Name → stateId resolver ─────────────────────────────────────────────────
export const stateIdFromName = (name: string): string => {
  const n = name.trim().toLowerCase();
  if (n.includes('mizo'))                                      return 'mizoram';
  if (n.includes('tamil'))                                     return 'tamil_nadu';
  if (n.includes('himachal') || n === 'hp')                    return 'himachal_pradesh';
  if (n.includes('kashmir') || n.includes('jammu') || n === 'jk') return 'jammu_kashmir';
  if (n.includes('madhya') || n === 'mp')                      return 'madhya_pradesh';
  if (n.includes('uttarakhand') || n.includes('uttaranchal') || n === 'uk') return 'uttarakhand';
  if (n.includes('uttar') || n === 'up')                       return 'uttar_pradesh';
  if (n.includes('sikkim') || n === 'sk')                      return 'sikkim';
  if (n.includes('arunachal') || n === 'ar')                   return 'arunachal_pradesh';
  if (n.includes('nagaland') || n === 'nl')                    return 'nagaland';
  if (n.includes('meghalaya') || n === 'ml')                   return 'meghalaya';
  if (n.includes('gujarat') || n === 'gj')                     return 'gujarat';
  if (n.includes('kerala') || n.includes('kerela') || n === 'kl') return 'kerala';
  if (n.includes('maharashtra') || n.includes('maharastra') || n === 'mh') return 'maharashtra';
  if (n.includes('haryana') || n === 'hr')                     return 'haryana';
  if (n.includes('punjab') || n === 'pb')                      return 'punjab';
  if (n.includes('chhattisgarh') || n.includes('chhatisgarh') || n === 'cg' || n === 'ct') return 'chhattisgarh';
  if (n.includes('odisha') || n.includes('orissa') || n === 'od') return 'odisha';
  if (n.includes('west bengal') || n.includes('westbengal') || n.includes('bengal') || n === 'wb') return 'west_bengal';
  if (n.includes('assam') || n === 'as')                       return 'assam';
  if (n.includes('bihar') || n === 'br')                       return 'bihar';
  if (n.includes('andhra') || n === 'ap')                      return 'andhra_pradesh';
  return n.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

// ─── Hash → stateId resolver ─────────────────────────────────────────────────
export const stateIdFromHash = (hash: string): string => {
  const h = hash.toLowerCase();
  const slugSegment = h.replace('#government/', '').split('/')[0];
  const slug = slugSegment || 'ap';

  if (slug === 'mz' || slug.includes('mizoram') || slug.includes('mizo')) return 'mizoram';
  if (slug === 'tn' || slug.includes('tamil'))                          return 'tamil_nadu';
  if (slug === 'hp' || slug.includes('himachal'))                       return 'himachal_pradesh';
  if (slug === 'jk' || slug.includes('jammu') || slug.includes('kashmir')) return 'jammu_kashmir';
  if (slug === 'mp' || slug.includes('madhya'))                         return 'madhya_pradesh';
  if (slug === 'uk' || slug.includes('uttarakhand') || slug.includes('uttaranchal')) return 'uttarakhand';
  if (slug === 'up' || slug.includes('uttar'))                          return 'uttar_pradesh';
  if (slug === 'sk' || slug.includes('sikkim'))                         return 'sikkim';
  if (slug === 'ar' || slug.includes('arunachal'))                      return 'arunachal_pradesh';
  if (slug === 'nl' || slug.includes('nagaland'))                       return 'nagaland';
  if (slug === 'ml' || slug.includes('meghalaya'))                      return 'meghalaya';
  if (slug === 'gj' || slug.includes('gujarat'))                        return 'gujarat';
  if (slug === 'kl' || slug.includes('kerala') || slug.includes('kerela')) return 'kerala';
  if (slug === 'mh' || slug.includes('maharashtra') || slug.includes('maharastra')) return 'maharashtra';
  if (slug === 'hr' || slug.includes('haryana'))                        return 'haryana';
  if (slug === 'pb' || slug.includes('punjab'))                         return 'punjab';
  if (slug === 'cg' || slug === 'ct' || slug.includes('chhattisgarh') || slug.includes('chhatisgarh')) return 'chhattisgarh';
  if (slug === 'od' || slug.includes('odisha') || slug.includes('orissa')) return 'odisha';
  if (slug === 'wb' || slug.includes('west-bengal') || slug.includes('bengal')) return 'west_bengal';
  if (slug === 'as' || slug.includes('assam'))                          return 'assam';
  if (slug === 'br' || slug.includes('bihar'))                          return 'bihar';
  if (slug === 'ap' || slug.includes('andhra'))                         return 'andhra_pradesh';

  return slug;
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

  const selectStateByName = (name: string) => {
    setStateId(stateIdFromName(name));
  };

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
