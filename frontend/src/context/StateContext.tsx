import React, { createContext, useContext, useState, useEffect } from 'react';
import { setActiveStateId } from '../services/api';

export type StateId = 'andhra_pradesh' | 'tamil_nadu' | 'mizoram' | 'himachal_pradesh' | 'jammu_kashmir' | 'madhya_pradesh';

export interface StateConfig {
  id: StateId;
  name: string;
  code: string;
  adminUnitName: string; // 'Mandal' | 'Taluk' | 'Tehsil' | 'R.D. Block'
  adminUnitPlural: string; // 'Mandals' | 'Taluks' | 'Tehsils' | 'R.D. Blocks'
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
    }
    return 'andhra_pradesh';
  };

  const [stateId, setStateIdState] = useState<StateId>(() => {
    const init = getInitialState();
    setActiveStateId(init);
    return init;
  });

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
    } else {
      setStateId('andhra_pradesh');
    }
  };

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
