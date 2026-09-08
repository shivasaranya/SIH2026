import React, { createContext, useContext, useState, useEffect } from 'react';

export type StateId = 'andhra_pradesh' | 'tamil_nadu' | 'jammu_kashmir' | 'madhya_pradesh';

export interface StateConfig {
  id: StateId;
  name: string;
  code: string;
  adminUnitName: string; // 'Mandal' | 'Taluk' | 'Tehsil'
  adminUnitPlural: string; // 'Mandals' | 'Taluks' | 'Tehsils'
  districtCount: number;
  adminUnitCount: number;
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
    center: [11.1271, 78.6569],
    bounds: [
      [8.08, 76.24],
      [13.58, 80.35],
    ],
    isCoastal: true,
    sdmaName: 'Tamil Nadu SDMA (TNDMA)',
    tagline: 'Coromandel Coast & Delta Disaster Preparedness & Resettlement Platform',
  },
  jammu_kashmir: {
    id: 'jammu_kashmir',
    name: 'Jammu and Kashmir',
    code: 'JK',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 20,
    adminUnitCount: 197,
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

import { setActiveStateId } from '../services/api';

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read initial state from hash or default to andhra_pradesh
  const getInitialState = (): StateId => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('/tn') || hash.includes('/tamil') || hash.includes('tamil_nadu')) {
        return 'tamil_nadu';
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
  const setStateId = (newId: StateId) => {
    setActiveStateId(newId);
    setStateIdState(newId);
  };

  const selectStateByName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('tamil')) {
      setStateId('tamil_nadu');
    } else if (lower.includes('kashmir') || lower.includes('jammu') || lower.includes('jk')) {
      setStateId('jammu_kashmir');
    } else if (lower.includes('madhya') || lower.includes('mp')) {
      setStateId('madhya_pradesh');
    } else {
      setStateId('andhra_pradesh');
    }
  };

  // Listen to hash changes if needed
  useEffect(() => {
    setActiveStateId(stateId);
  }, [stateId]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('/tn') || hash.includes('/tamil')) {
        setStateId('tamil_nadu');
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
