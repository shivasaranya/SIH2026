import React, { createContext, useContext, useState, useEffect } from 'react';
import { setActiveStateId } from '../services/api';

export type StateId = 'andhra_pradesh' | 'tamil_nadu' | 'assam' | 'bihar' | 'west_bengal' | 'odisha' | 'uttar_pradesh' | 'uttarakhand' | 'sikkim' | 'arunachal_pradesh' | 'nagaland' | 'meghalaya';

export interface StateConfig {
  id: StateId;
  name: string;
  code: string;
  adminUnitName: string; // 'Mandal' | 'Taluk' | 'Revenue Circle' | 'Block' | 'Tehsil'
  adminUnitPlural: string; // 'Mandals' | 'Taluks' | 'Revenue Circles' | 'Blocks' | 'Tehsils'
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
  assam: {
    id: 'assam',
    name: 'Assam',
    code: 'AS',
    adminUnitName: 'Revenue Circle',
    adminUnitPlural: 'Revenue Circles',
    districtCount: 33,
    adminUnitCount: 153,
    candidateHostsCount: 42,
    center: [26.2006, 92.9376],
    bounds: [
      [24.08, 89.69],
      [27.97, 96.02],
    ],
    isCoastal: false,
    sdmaName: 'Assam State Disaster Management Authority (ASDMA)',
    tagline: 'Brahmaputra & Barak Valley Flood, Wind & Relocation Decision System',
  },
  bihar: {
    id: 'bihar',
    name: 'Bihar',
    code: 'BR',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 38,
    adminUnitCount: 534,
    candidateHostsCount: 54,
    center: [25.60, 85.14],
    bounds: [
      [24.28, 83.31],
      [27.52, 88.29],
    ],
    isCoastal: false,
    sdmaName: 'Bihar State Disaster Management Authority (BSDMA)',
    tagline: 'Kosi-Gandak-Ganga Riverine Flood, Wind & Relocation Decision System',
  },
  west_bengal: {
    id: 'west_bengal',
    name: 'West Bengal',
    code: 'WB',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 23,
    adminUnitCount: 346,
    candidateHostsCount: 23,
    center: [22.9868, 87.8550],
    bounds: [
      [21.50, 85.80],
      [27.35, 89.90],
    ],
    isCoastal: true,
    sdmaName: 'West Bengal Disaster Management Dept (WBDMD)',
    tagline: 'Sundarbans Coastal Surge & Gangetic Basin Multi-Hazard Relocation Platform',
  },
  odisha: {
    id: 'odisha',
    name: 'Odisha',
    code: 'OD',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 30,
    adminUnitCount: 475,
    candidateHostsCount: 153,
    center: [20.9517, 85.0985],
    bounds: [
      [17.78, 81.37],
      [22.57, 87.50],
    ],
    isCoastal: true,
    sdmaName: 'Odisha State Disaster Management Authority (OSDMA)',
    tagline: 'Coastal Cyclone Surge, Mahanadi Basin Flood & Vulnerability Decision System',
  },
  uttar_pradesh: {
    id: 'uttar_pradesh',
    name: 'Uttar Pradesh',
    code: 'UP',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 75,
    adminUnitCount: 351,
    candidateHostsCount: 43,
    center: [26.8467, 80.9462],
    bounds: [
      [23.87, 77.08],
      [31.47, 84.63],
    ],
    isCoastal: false,
    sdmaName: 'Uttar Pradesh SDMA (UPSDMA)',
    tagline: 'Indo-Gangetic Basin Riverine Flood, Storm Wind & Relocation Decision System',
  },
  uttarakhand: {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    code: 'UK',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 13,
    adminUnitCount: 127,
    candidateHostsCount: 29,
    center: [30.0668, 79.0193],
    bounds: [
      [28.71, 77.57],
      [31.46, 81.04],
    ],
    isCoastal: false,
    sdmaName: 'Uttarakhand SDMA (USDMA)',
    tagline: 'Himalayan Trans-Valley Flash Flood, GLOF & Slope Relocation Decision System',
  },
  sikkim: {
    id: 'sikkim',
    name: 'Sikkim',
    code: 'SK',
    adminUnitName: 'Sub-division',
    adminUnitPlural: 'Sub-divisions',
    districtCount: 6,
    adminUnitCount: 16,
    candidateHostsCount: 4,
    center: [27.5330, 88.5122],
    bounds: [
      [27.05, 88.00],
      [28.15, 88.95],
    ],
    isCoastal: false,
    sdmaName: 'Sikkim SDMA (SSDMA)',
    tagline: 'Eastern Himalayan Teesta Basin GLOF, Landslide & Relocation Decision System',
  },
  arunachal_pradesh: {
    id: 'arunachal_pradesh',
    name: 'Arunachal Pradesh',
    code: 'AR',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 25,
    adminUnitCount: 208,
    candidateHostsCount: 47,
    center: [28.0387, 94.6752],
    bounds: [
      [26.65, 91.50],
      [29.50, 97.45],
    ],
    isCoastal: false,
    sdmaName: 'Arunachal Pradesh SDMA (APSDMA)',
    tagline: 'Eastern Himalayan Upper River Basin Flash Flood, Landslide & Resettlement Decision Platform',
  },
  nagaland: {
    id: 'nagaland',
    name: 'Nagaland',
    code: 'NL',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 11,
    adminUnitCount: 120,
    candidateHostsCount: 15,
    center: [26.1584, 94.5624],
    bounds: [
      [25.18, 93.30],
      [27.05, 95.25],
    ],
    isCoastal: false,
    sdmaName: 'Nagaland SDMA (NSDMA)',
    tagline: 'Naga Hills Landslide, Earthquake, Flash Flood & Vulnerability Decision Platform',
  },
  meghalaya: {
    id: 'meghalaya',
    name: 'Meghalaya',
    code: 'ML',
    adminUnitName: 'C.D. Block',
    adminUnitPlural: 'C.D. Blocks',
    districtCount: 11,
    adminUnitCount: 46,
    candidateHostsCount: 11,
    center: [25.5788, 91.8933],
    bounds: [
      [25.02, 89.80],
      [26.12, 92.85],
    ],
    isCoastal: false,
    sdmaName: 'Meghalaya SDMA (MSDMA)',
    tagline: 'Shillong Plateau Flash Flood, Landslide & Resettlement Decision Platform',
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
      if (hash.includes('/od') || hash.includes('/odisha') || hash.includes('/orissa')) {
        return 'odisha';
      }
      if (hash.includes('/wb') || hash.includes('/west_bengal') || hash.includes('/bengal')) {
        return 'west_bengal';
      }
      if (hash.includes('/br') || hash.includes('/bihar')) {
        return 'bihar';
      }
      if (hash.includes('/as') || hash.includes('/assam')) {
        return 'assam';
      }
      if (hash.includes('/tn') || hash.includes('/tamil') || hash.includes('tamil_nadu')) {
        return 'tamil_nadu';
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
    if (lower.includes('odisha') || lower.includes('orissa') || lower === 'od') {
      setStateId('odisha');
    } else if (lower.includes('bengal') || lower.includes('west bengal') || lower.includes('wb')) {
      setStateId('west_bengal');
    } else if (lower.includes('bihar')) {
      setStateId('bihar');
    } else if (lower.includes('assam')) {
      setStateId('assam');
    } else if (lower.includes('tamil')) {
      setStateId('tamil_nadu');
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
    } else {
      setStateId('andhra_pradesh');
    }
  };

  // Listen to hash changes if needed
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('/od') || hash.includes('/odisha') || hash.includes('/orissa')) {
        setStateId('odisha');
      } else if (hash.includes('/wb') || hash.includes('/west_bengal') || hash.includes('/bengal')) {
        setStateId('west_bengal');
      } else if (hash.includes('/br') || hash.includes('/bihar')) {
        setStateId('bihar');
      } else if (hash.includes('/as') || hash.includes('/assam')) {
        setStateId('assam');
      } else if (hash.includes('/tn') || hash.includes('/tamil')) {
        setStateId('tamil_nadu');
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
