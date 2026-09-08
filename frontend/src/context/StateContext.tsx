import React, { createContext, useContext, useState, useEffect } from 'react';
import { setActiveStateId } from '../services/api';

export type StateId =
  | 'andhra_pradesh'
  | 'tamil_nadu'
  | 'mizoram'
  | 'himachal_pradesh'
  | 'jammu_kashmir'
  | 'madhya_pradesh'
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
  | 'chhattisgarh';

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
      if (hash.includes('/jk') || hash.includes('/kashmir') || hash.includes('jammu_kashmir') || hash.includes('jammu')) {
        return 'jammu_kashmir';
      }
      if (hash.includes('/mp') || hash.includes('/madhya') || hash.includes('madhya_pradesh')) {
        return 'madhya_pradesh';
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
      if (hash.includes('/od') || hash.includes('/odisha') || hash.includes('/orissa')) {
        return 'odisha';
      }
      if (hash.includes('/wb') || hash.includes('/west_bengal') || hash.includes('/bengal')) {
        return 'west_bengal';
      }
      if (hash.includes('/as') || hash.includes('/assam')) {
        return 'assam';
      }
      if (hash.includes('/br') || hash.includes('/bihar')) {
        return 'bihar';
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
    } else if (lower.includes('kashmir') || lower.includes('jammu') || lower.includes('jk')) {
      setStateId('jammu_kashmir');
    } else if (lower.includes('madhya') || lower.includes('mp')) {
      setStateId('madhya_pradesh');
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
    } else if (lower.includes('odisha') || lower.includes('orissa') || lower.includes('od')) {
      setStateId('odisha');
    } else if (lower.includes('west bengal') || lower.includes('bengal') || lower.includes('wb')) {
      setStateId('west_bengal');
    } else if (lower.includes('assam') || lower.includes('as')) {
      setStateId('assam');
    } else if (lower.includes('bihar') || lower.includes('br')) {
      setStateId('bihar');
    } else {
      setStateId('andhra_pradesh');
    }
  };

  // Listen to hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('/mz') || hash.includes('/mizoram')) {
        setStateId('mizoram');
      } else if (hash.includes('/tn') || hash.includes('/tamil')) {
        setStateId('tamil_nadu');
      } else if (hash.includes('/hp') || hash.includes('/himachal')) {
        setStateId('himachal_pradesh');
      } else if (hash.includes('/jk') || hash.includes('/kashmir') || hash.includes('jammu')) {
        setStateId('jammu_kashmir');
      } else if (hash.includes('/mp') || hash.includes('/madhya')) {
        setStateId('madhya_pradesh');
      } else if (hash.includes('/uk') || hash.includes('/uttarakhand') || hash.includes('/uttaranchal')) {
        setStateId('uttarakhand');
      } else if (hash.includes('/up') || hash.includes('/uttar') || hash.includes('uttar_pradesh')) {
        setStateId('uttar_pradesh');
      } else if (hash.includes('/sk') || hash.includes('/sikkim')) {
        setStateId('sikkim');
      } else if (hash.includes('/ar') || hash.includes('/arunachal')) {
        setStateId('arunachal_pradesh');
      } else if (hash.includes('/nl') || hash.includes('/nagaland')) {
        setStateId('nagaland');
      } else if (hash.includes('/ml') || hash.includes('/meghalaya')) {
        setStateId('meghalaya');
      } else if (hash.includes('/gujarat') || hash.includes('/gj')) {
        setStateId('gujarat');
      } else if (hash.includes('/kerala') || hash.includes('/kl') || hash.includes('/kerela')) {
        setStateId('kerala');
      } else if (hash.includes('/maharashtra') || hash.includes('/mh') || hash.includes('/maharastra')) {
        setStateId('maharashtra');
      } else if (hash.includes('/haryana') || hash.includes('/hr')) {
        setStateId('haryana');
      } else if (hash.includes('/punjab') || hash.includes('/pb')) {
        setStateId('punjab');
      } else if (hash.includes('/chhattisgarh') || hash.includes('/cg') || hash.includes('/ct')) {
        setStateId('chhattisgarh');
      } else if (hash.includes('/od') || hash.includes('/odisha') || hash.includes('/orissa')) {
        setStateId('odisha');
      } else if (hash.includes('/wb') || hash.includes('/west_bengal') || hash.includes('/bengal')) {
        setStateId('west_bengal');
      } else if (hash.includes('/as') || hash.includes('/assam')) {
        setStateId('assam');
      } else if (hash.includes('/br') || hash.includes('/bihar')) {
        setStateId('bihar');
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
