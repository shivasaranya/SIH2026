import React, { createContext, useContext, useState, useEffect } from 'react';
import { setActiveStateId } from '../services/api';

export type StateId = 'andhra_pradesh' | 'tamil_nadu' | 'mizoram' | 'himachal_pradesh' | 'assam' | 'bihar' | 'west_bengal' | 'odisha' | 'uttar_pradesh' | 'uttarakhand' | 'sikkim' | 'arunachal_pradesh' | 'nagaland' | 'meghalaya' | 'gujarat' | 'kerala' | 'maharashtra' | 'haryana' | 'punjab' | 'chhattisgarh';

export interface StateConfig {
  id: StateId;
  name: string;
  code: string;
  adminUnitName: string; // 'Mandal' | 'Taluk' | 'R.D. Block'
  adminUnitPlural: string; // 'Mandals' | 'Taluks' | 'R.D. Blocks'
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
  // Read initial state from hash or default to andhra_pradesh
  const getInitialState = (): StateId => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('/mz') || hash.includes('/mizoram') || hash.includes('mizo')) {
        return 'mizoram';
      }
      if (hash.includes('/tn') || hash.includes('/tamil') || hash.includes('tamil_nadu')) {
        return 'tamil_nadu';
      }
      if (hash.includes('/hp') || hash.includes('/himachal')) {
        return 'himachal_pradesh';
      }
      if (hash.includes('/as') || hash.includes('/assam')) {
        return 'assam';
      }
      if (hash.includes('/br') || hash.includes('/bihar')) {
        return 'bihar';
      }
      if (hash.includes('/wb') || hash.includes('/west_bengal') || hash.includes('bengal')) {
        return 'west_bengal';
      }
      if (hash.includes('/od') || hash.includes('/odisha') || hash.includes('orissa')) {
        return 'odisha';
      }
      if (hash.includes('/uk') || hash.includes('/uttarakhand') || hash.includes('/uttaranchal')) {
        return 'uttarakhand';
      }
      if (hash.includes('/up') || hash.includes('/uttar') || hash.includes('uttar_pradesh')) {
        return 'uttar_pradesh';
      }
      if (hash.includes('/sk') || hash.includes('/sikkim')) {
        return 'sikkim';
      }
      if (hash.includes('/ar') || hash.includes('/arunachal')) {
        return 'arunachal_pradesh';
      }
      if (hash.includes('/nl') || hash.includes('/nagaland')) {
        return 'nagaland';
      }
      if (hash.includes('/ml') || hash.includes('/meghalaya')) {
        return 'meghalaya';
      }
      if (hash.includes('/gujarat') || hash.includes('/gj')) {
        return 'gujarat';
      }
      if (hash.includes('/kerala') || hash.includes('/kl') || hash.includes('/kerela')) {
        return 'kerala';
      }
      if (hash.includes('/maharashtra') || hash.includes('/mh') || hash.includes('/maharastra')) {
        return 'maharashtra';
      }
      if (hash.includes('/haryana') || hash.includes('/hr')) {
        return 'haryana';
      }
      if (hash.includes('/punjab') || hash.includes('/pb')) {
        return 'punjab';
      }
      if (hash.includes('/chhattisgarh') || hash.includes('/cg') || hash.includes('/ct')) {
        return 'chhattisgarh';
      }
    }
    return 'andhra_pradesh';
  };

  const [stateId, setStateIdState] = useState<StateId>(getInitialState);

  // Keep API client active state synchronized
  useEffect(() => {
    setActiveStateId(stateId);
  }, [stateId]);

  const setStateId = (newId: StateId) => {
    setActiveStateId(newId);
    setStateIdState(newId);
  };

  const selectStateByName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('mizo')) {
      setStateId('mizoram');
    } else if (lower.includes('tamil')) {
      setStateId('tamil_nadu');
    } else if (lower.includes('himachal') || lower.includes('hp')) {
      setStateId('himachal_pradesh');
    } else if (lower.includes('assam') || lower === 'as') {
      setStateId('assam');
    } else if (lower.includes('bihar') || lower === 'br') {
      setStateId('bihar');
    } else if (lower.includes('bengal') || lower.includes('wb')) {
      setStateId('west_bengal');
    } else if (lower.includes('odisha') || lower.includes('orissa') || lower === 'od') {
      setStateId('odisha');
    } else if (lower.includes('uttarakhand') || lower.includes('uttaranchal') || lower === 'uk') {
      setStateId('uttarakhand');
    } else if (lower.includes('uttar') || lower === 'up') {
      setStateId('uttar_pradesh');
    } else if (lower.includes('sikkim') || lower === 'sk') {
      setStateId('sikkim');
    } else if (lower.includes('arunachal') || lower === 'ar') {
      setStateId('arunachal_pradesh');
    } else if (lower.includes('nagaland') || lower === 'nl') {
      setStateId('nagaland');
    } else if (lower.includes('meghalaya') || lower === 'ml') {
      setStateId('meghalaya');
    } else if (lower.includes('gujarat') || lower === 'gj') {
      setStateId('gujarat');
    } else if (lower.includes('kerala') || lower.includes('kerela') || lower === 'kl') {
      setStateId('kerala');
    } else if (lower.includes('maharashtra') || lower.includes('maharastra') || lower === 'mh') {
      setStateId('maharashtra');
    } else if (lower.includes('haryana') || lower === 'hr') {
      setStateId('haryana');
    } else if (lower.includes('punjab') || lower === 'pb') {
      setStateId('punjab');
    } else if (lower.includes('chhattisgarh') || lower.includes('chhatisgarh') || lower === 'cg' || lower === 'ct') {
      setStateId('chhattisgarh');
    } else {
      setStateId('andhra_pradesh');
    }
  };

  // Listen to hash changes if needed
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('/mz') || hash.includes('/mizoram')) {
        setStateIdState('mizoram');
      } else if (hash.includes('/tn') || hash.includes('/tamil')) {
        setStateIdState('tamil_nadu');
      } else if (hash.includes('/hp') || hash.includes('/himachal')) {
        setStateIdState('himachal_pradesh');
      } else if (hash.includes('/as') || hash.includes('/assam')) {
        setStateIdState('assam');
      } else if (hash.includes('/br') || hash.includes('/bihar')) {
        setStateIdState('bihar');
      } else if (hash.includes('/wb') || hash.includes('/west_bengal') || hash.includes('bengal')) {
        setStateIdState('west_bengal');
      } else if (hash.includes('/od') || hash.includes('/odisha') || hash.includes('orissa')) {
        setStateIdState('odisha');
      } else if (hash.includes('/uk') || hash.includes('/uttarakhand') || hash.includes('/uttaranchal')) {
        setStateIdState('uttarakhand');
      } else if (hash.includes('/up') || hash.includes('/uttar') || hash.includes('uttar_pradesh')) {
        setStateIdState('uttar_pradesh');
      } else if (hash.includes('/sk') || hash.includes('/sikkim')) {
        setStateIdState('sikkim');
      } else if (hash.includes('/ar') || hash.includes('/arunachal')) {
        setStateIdState('arunachal_pradesh');
      } else if (hash.includes('/nl') || hash.includes('/nagaland')) {
        setStateIdState('nagaland');
      } else if (hash.includes('/ml') || hash.includes('/meghalaya')) {
        setStateIdState('meghalaya');
      } else if (hash.includes('/gujarat') || hash.includes('/gj')) {
        setStateIdState('gujarat');
      } else if (hash.includes('/kerala') || hash.includes('/kl') || hash.includes('/kerela')) {
        setStateIdState('kerala');
      } else if (hash.includes('/maharashtra') || hash.includes('/mh') || hash.includes('/maharastra')) {
        setStateIdState('maharashtra');
      } else if (hash.includes('/haryana') || hash.includes('/hr')) {
        setStateIdState('haryana');
      } else if (hash.includes('/punjab') || hash.includes('/pb')) {
        setStateIdState('punjab');
      } else if (hash.includes('/chhattisgarh') || hash.includes('/cg') || hash.includes('/ct')) {
        setStateIdState('chhattisgarh');
      } else if (hash.includes('/ap') || hash.includes('/andhra')) {
        setStateId('andhra_pradesh');
      }
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
