import React, { createContext, useContext, useState, useEffect } from 'react';
import { setActiveStateId } from '../services/api';

export type StateId = 
  | 'andhra_pradesh' 
  | 'tamil_nadu' 
  | 'mizoram' 
  | 'himachal_pradesh' 
  | 'assam' 
  | 'bihar' 
  | 'west_bengal' 
  | 'odisha' 
  | 'uttar_pradesh' 
  | 'uttarakhand' 
  | 'sikkim' 
  | 'arunachal_pradesh' 
  | 'nagaland' 
  | 'meghalaya' 
  | 'gujarat' 
  | 'kerala' 
  | 'maharashtra' 
  | 'haryana' 
  | 'punjab' 
  | 'chhattisgarh'
  | 'rajasthan'
  | 'karnataka'
  | 'telangana'
  | 'madhya_pradesh'
  | 'jharkhand'
  | 'goa'
  | 'jammu_and_kashmir';

export interface StateConfig {
  id: StateId;
  name: string;
  code: string;
  adminUnitName: string; // 'Mandal' | 'Taluk' | 'Tehsil' | 'Block'
  adminUnitPlural: string; // 'Mandals' | 'Taluks' | 'Tehsils' | 'Blocks'
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
  assam: {
    id: 'assam',
    name: 'Assam',
    code: 'AS',
    adminUnitName: 'Revenue Circle',
    adminUnitPlural: 'Revenue Circles',
    districtCount: 33,
    adminUnitCount: 153,
    candidateHostsCount: 15,
    center: [26.2006, 92.9376],
    bounds: [
      [24.15, 89.70],
      [27.95, 96.00],
    ],
    isCoastal: false,
    sdmaName: 'Assam State Disaster Management Authority (ASDMA)',
    tagline: 'Brahmaputra Valley Flood, Erosion & Relocation Decision System',
  },
  bihar: {
    id: 'bihar',
    name: 'Bihar',
    code: 'BR',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 38,
    adminUnitCount: 534,
    candidateHostsCount: 50,
    center: [25.0961, 85.3131],
    bounds: [
      [24.28, 83.32],
      [27.52, 88.29],
    ],
    isCoastal: false,
    sdmaName: 'Bihar State Disaster Management Authority (BSDMA)',
    tagline: 'North Bihar Kosi-Gandak Flood & Relocation Decision System',
  },
  west_bengal: {
    id: 'west_bengal',
    name: 'West Bengal',
    code: 'WB',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 23,
    adminUnitCount: 346,
    candidateHostsCount: 40,
    center: [22.9868, 87.8550],
    bounds: [
      [21.50, 85.80],
      [27.20, 89.90],
    ],
    isCoastal: true,
    sdmaName: 'West Bengal Disaster Management Department (WBDMD)',
    tagline: 'Sundarbans Coastal Surge, Delta Flood & Relocation Decision System',
  },
  odisha: {
    id: 'odisha',
    name: 'Odisha',
    code: 'OD',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 30,
    adminUnitCount: 475,
    candidateHostsCount: 45,
    center: [20.9517, 85.0985],
    bounds: [
      [17.80, 81.38],
      [22.57, 87.50],
    ],
    isCoastal: true,
    sdmaName: 'Odisha State Disaster Management Authority (OSDMA)',
    tagline: 'Bay of Bengal Super Cyclone, Coastal Inundation & Relocation Decision System',
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
    center: [26.8467, 80.9462],
    bounds: [
      [23.87, 77.08],
      [30.40, 84.63],
    ],
    isCoastal: false,
    sdmaName: 'Uttar Pradesh State Disaster Management Authority (UPSDMA)',
    tagline: 'Gangetic Plains Inundation & Multi-Hazard Relocation Decision System',
  },
  uttarakhand: {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    code: 'UK',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 13,
    adminUnitCount: 127,
    candidateHostsCount: 20,
    center: [30.0668, 79.0193],
    bounds: [
      [28.72, 77.58],
      [31.46, 81.05],
    ],
    isCoastal: false,
    sdmaName: 'Uttarakhand State Disaster Management Authority (USDMA)',
    tagline: 'Garhwal-Kumaon Himalayan Flash Flood & Landslide Decision Platform',
  },
  sikkim: {
    id: 'sikkim',
    name: 'Sikkim',
    code: 'SK',
    adminUnitName: 'Sub-division',
    adminUnitPlural: 'Sub-divisions',
    districtCount: 6,
    adminUnitCount: 16,
    candidateHostsCount: 5,
    center: [27.5330, 88.5122],
    bounds: [
      [27.08, 88.01],
      [28.13, 88.92],
    ],
    isCoastal: false,
    sdmaName: 'Sikkim State Disaster Management Authority (SSDMA)',
    tagline: 'Teesta Basin GLOF, Landslide & Himalayan Resettlement Platform',
  },
  arunachal_pradesh: {
    id: 'arunachal_pradesh',
    name: 'Arunachal Pradesh',
    code: 'AR',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 25,
    adminUnitCount: 208,
    candidateHostsCount: 25,
    center: [28.2180, 94.7278],
    bounds: [
      [26.65, 91.50],
      [29.50, 97.40],
    ],
    isCoastal: false,
    sdmaName: 'Arunachal Pradesh Disaster Management (APSDMA)',
    tagline: 'Eastern Himalayan Landslide & Flash Flood Relocation Decision Platform',
  },
  nagaland: {
    id: 'nagaland',
    name: 'Nagaland',
    code: 'NL',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 11,
    adminUnitCount: 120,
    candidateHostsCount: 12,
    center: [26.1584, 94.5624],
    bounds: [
      [25.10, 93.30],
      [27.05, 95.25],
    ],
    isCoastal: false,
    sdmaName: 'Nagaland State Disaster Management Authority (NSDMA)',
    tagline: 'Naga Hills Landslide & Seismic Relocation Decision Platform',
  },
  meghalaya: {
    id: 'meghalaya',
    name: 'Meghalaya',
    code: 'ML',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 11,
    adminUnitCount: 46,
    candidateHostsCount: 10,
    center: [25.4670, 91.3662],
    bounds: [
      [25.02, 89.82],
      [26.12, 92.80],
    ],
    isCoastal: false,
    sdmaName: 'Meghalaya State Disaster Management Authority (MSDMA)',
    tagline: 'Shillong Plateau Flash Flood & Landslide Resettlement Platform',
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
  rajasthan: {
    id: 'rajasthan',
    name: 'Rajasthan',
    code: 'RJ',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 33,
    adminUnitCount: 247,
    candidateHostsCount: 45,
    center: [27.0238, 74.2179],
    bounds: [
      [23.3, 69.5],
      [30.2, 78.3],
    ],
    isCoastal: false,
    sdmaName: 'Rajasthan State Disaster Management Authority (RSDMA)',
    tagline: 'Thar Desert Drought, Heatwave & Flash Flood Decision Platform',
  },
  karnataka: {
    id: 'karnataka',
    name: 'Karnataka',
    code: 'KA',
    adminUnitName: 'Taluk',
    adminUnitPlural: 'Taluks',
    districtCount: 31,
    adminUnitCount: 240,
    candidateHostsCount: 35,
    center: [15.3173, 75.7139],
    bounds: [
      [11.5, 74.0],
      [18.5, 78.6],
    ],
    isCoastal: true,
    sdmaName: 'Karnataka State Disaster Management Authority (KSDMA)',
    tagline: 'Western Ghats Inundation & Coastal Disaster Preparedness Platform',
  },
  telangana: {
    id: 'telangana',
    name: 'Telangana',
    code: 'TS',
    adminUnitName: 'Mandal',
    adminUnitPlural: 'Mandals',
    districtCount: 33,
    adminUnitCount: 594,
    candidateHostsCount: 40,
    center: [17.8749, 78.1008],
    bounds: [
      [15.8, 77.2],
      [19.9, 81.8],
    ],
    isCoastal: false,
    sdmaName: 'Telangana State Disaster Management Authority (TGSDMA)',
    tagline: 'Godavari-Krishna River Basin Flash Flood & Climate Relocation Platform',
  },
  madhya_pradesh: {
    id: 'madhya_pradesh',
    name: 'Madhya Pradesh',
    code: 'MP',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 52,
    adminUnitCount: 428,
    candidateHostsCount: 55,
    center: [22.9734, 78.6569],
    bounds: [
      [21.0, 74.0],
      [26.9, 82.8],
    ],
    isCoastal: false,
    sdmaName: 'Madhya Pradesh State Disaster Management Authority (MPSDMA)',
    tagline: 'Central Highlands Riverine Flood & Relocation Decision System',
  },
  jharkhand: {
    id: 'jharkhand',
    name: 'Jharkhand',
    code: 'JH',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 24,
    adminUnitCount: 260,
    candidateHostsCount: 30,
    center: [23.6102, 85.2799],
    bounds: [
      [21.9, 83.3],
      [25.3, 87.9],
    ],
    isCoastal: false,
    sdmaName: 'Jharkhand State Disaster Management Authority (JSDMA)',
    tagline: 'Chota Nagpur Plateau Flash Flood & Multi-Hazard Relocation Platform',
  },
  goa: {
    id: 'goa',
    name: 'Goa',
    code: 'GA',
    adminUnitName: 'Taluka',
    adminUnitPlural: 'Talukas',
    districtCount: 2,
    adminUnitCount: 12,
    candidateHostsCount: 4,
    center: [15.2993, 74.1240],
    bounds: [
      [14.9, 73.6],
      [15.8, 74.4],
    ],
    isCoastal: true,
    sdmaName: 'Goa State Disaster Management Authority (GSDMA)',
    tagline: 'Konkan Coastal Inundation & Relocation Decision System',
  },
  jammu_and_kashmir: {
    id: 'jammu_and_kashmir',
    name: 'Jammu and Kashmir',
    code: 'JK',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 20,
    adminUnitCount: 207,
    candidateHostsCount: 18,
    center: [33.7782, 76.5762],
    bounds: [
      [32.2, 73.5],
      [36.0, 80.0],
    ],
    isCoastal: false,
    sdmaName: 'J&K Disaster Management Authority (JKDMA)',
    tagline: 'Himalayan Seismic, Landslide & Flash Flood Resettlement Platform',
  },
};

interface StateContextType {
  currentState: StateConfig;
  stateId: StateId;
  setStateId: (id: StateId) => void;
  selectStateByName: (name: string) => void;
  availableStates: StateConfig[];
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function parseStateIdFromHash(hash: string): StateId {
  const h = hash.toLowerCase();
  if (h.includes('/mz') || h.includes('/mizoram')) return 'mizoram';
  if (h.includes('/tn') || h.includes('/tamil') || h.includes('tamil_nadu')) return 'tamil_nadu';
  if (h.includes('/hp') || h.includes('/himachal')) return 'himachal_pradesh';
  if (h.includes('/as') || h.includes('/assam')) return 'assam';
  if (h.includes('/br') || h.includes('/bihar')) return 'bihar';
  if (h.includes('/wb') || h.includes('/west_bengal') || h.includes('/bengal')) return 'west_bengal';
  if (h.includes('/od') || h.includes('/odisha') || h.includes('/orissa')) return 'odisha';
  if (h.includes('/uk') || h.includes('/uttarakhand') || h.includes('/uttaranchal')) return 'uttarakhand';
  if (h.includes('/up') || h.includes('/uttar') || h.includes('uttar_pradesh')) return 'uttar_pradesh';
  if (h.includes('/sk') || h.includes('/sikkim')) return 'sikkim';
  if (h.includes('/ar') || h.includes('/arunachal')) return 'arunachal_pradesh';
  if (h.includes('/nl') || h.includes('/nagaland')) return 'nagaland';
  if (h.includes('/ml') || h.includes('/meghalaya')) return 'meghalaya';
  if (h.includes('/gujarat') || h.includes('/gj')) return 'gujarat';
  if (h.includes('/kerala') || h.includes('/kl') || h.includes('/kerela')) return 'kerala';
  if (h.includes('/maharashtra') || h.includes('/mh') || h.includes('/maharastra')) return 'maharashtra';
  if (h.includes('/haryana') || h.includes('/hr')) return 'haryana';
  if (h.includes('/punjab') || h.includes('/pb')) return 'punjab';
  if (h.includes('/chhattisgarh') || h.includes('/cg') || h.includes('/ct')) return 'chhattisgarh';
  if (h.includes('/rajasthan') || h.includes('/rj')) return 'rajasthan';
  if (h.includes('/karnataka') || h.includes('/ka')) return 'karnataka';
  if (h.includes('/telangana') || h.includes('/ts') || h.includes('/tg')) return 'telangana';
  if (h.includes('/madhya_pradesh') || h.includes('/madhya') || h.includes('/mp')) return 'madhya_pradesh';
  if (h.includes('/jharkhand') || h.includes('/jh')) return 'jharkhand';
  if (h.includes('/goa') || h.includes('/ga')) return 'goa';
  if (h.includes('/jammu') || h.includes('/kashmir') || h.includes('/jk')) return 'jammu_and_kashmir';
  if (h.includes('/ap') || h.includes('/andhra')) return 'andhra_pradesh';
  return 'andhra_pradesh';
}

export function parseStateIdFromName(name: string): StateId {
  const lower = name.toLowerCase().trim();
  if (lower.includes('mizo')) return 'mizoram';
  if (lower.includes('tamil')) return 'tamil_nadu';
  if (lower.includes('himachal') || lower === 'hp') return 'himachal_pradesh';
  if (lower.includes('assam') || lower === 'as') return 'assam';
  if (lower.includes('bihar') || lower === 'br') return 'bihar';
  if (lower.includes('bengal') || lower === 'wb') return 'west_bengal';
  if (lower.includes('odisha') || lower.includes('orissa') || lower === 'od') return 'odisha';
  if (lower.includes('uttarakhand') || lower.includes('uttaranchal') || lower === 'uk') return 'uttarakhand';
  if (lower.includes('uttar') || lower === 'up') return 'uttar_pradesh';
  if (lower.includes('sikkim') || lower === 'sk') return 'sikkim';
  if (lower.includes('arunachal') || lower === 'ar') return 'arunachal_pradesh';
  if (lower.includes('nagaland') || lower === 'nl') return 'nagaland';
  if (lower.includes('meghalaya') || lower === 'ml') return 'meghalaya';
  if (lower.includes('gujarat') || lower === 'gj') return 'gujarat';
  if (lower.includes('kerala') || lower.includes('kerela') || lower === 'kl') return 'kerala';
  if (lower.includes('maharashtra') || lower.includes('maharastra') || lower === 'mh') return 'maharashtra';
  if (lower.includes('haryana') || lower === 'hr') return 'haryana';
  if (lower.includes('punjab') || lower === 'pb') return 'punjab';
  if (lower.includes('chhattisgarh') || lower.includes('chhatisgarh') || lower === 'cg' || lower === 'ct') return 'chhattisgarh';
  if (lower.includes('rajasthan') || lower === 'rj') return 'rajasthan';
  if (lower.includes('karnataka') || lower === 'ka') return 'karnataka';
  if (lower.includes('telangana') || lower === 'ts' || lower === 'tg') return 'telangana';
  if (lower.includes('madhya') || lower === 'mp') return 'madhya_pradesh';
  if (lower.includes('jharkhand') || lower === 'jh') return 'jharkhand';
  if (lower.includes('goa') || lower === 'ga') return 'goa';
  if (lower.includes('jammu') || lower.includes('kashmir') || lower === 'jk') return 'jammu_and_kashmir';
  return 'andhra_pradesh';
}

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stateId, setStateIdInternal] = useState<StateId>(() => {
    if (typeof window !== 'undefined') {
      return parseStateIdFromHash(window.location.hash);
    }
    return 'andhra_pradesh';
  });

  const setStateId = (newId: StateId) => {
    setActiveStateId(newId);
    setStateIdInternal(newId);
  };

  const selectStateByName = (name: string) => {
    const matched = parseStateIdFromName(name);
    setStateId(matched);
  };

  // Keep API client active state synchronized whenever stateId changes
  useEffect(() => {
    setActiveStateId(stateId);
  }, [stateId]);

  // Synchronize state when URL hash changes
  useEffect(() => {
    const handleHash = () => {
      const parsed = parseStateIdFromHash(window.location.hash);
      setStateId(parsed);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const currentState = STATE_CONFIGS[stateId] || STATE_CONFIGS.andhra_pradesh;
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
