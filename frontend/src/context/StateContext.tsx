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
