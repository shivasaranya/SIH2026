import React, { createContext, useContext, useState, useEffect } from 'react';

export type StateId = 'andhra_pradesh' | 'tamil_nadu' | 'tripura' | 'telangana' | 'rajasthan' | 'madhya_pradesh' | 'karnataka' | 'goa' | 'manipur' | 'jharkhand';

export interface StateConfig {
  id: StateId;
  name: string;
  code: string;
  adminUnitName: string; // 'Mandal' | 'Taluk' | 'Sub-Division' | 'Tehsil' | 'Taluka'
  adminUnitPlural: string; // 'Mandals' | 'Taluks' | 'Sub-Divisions' | 'Tehsils' | 'Talukas'
  districtCount: number;
  adminUnitCount: number;
  rankedCount: number;
  hostCandidateCount: number;
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
    rankedCount: 680,
    hostCandidateCount: 51,
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
    rankedCount: 302,
    hostCandidateCount: 38,
    center: [11.1271, 78.6569],
    bounds: [
      [8.08, 76.24],
      [13.58, 80.35],
    ],
    isCoastal: true,
    sdmaName: 'Tamil Nadu SDMA (TNDMA)',
    tagline: 'Coromandel Coast & Delta Disaster Preparedness & Resettlement Platform',
  },
  tripura: {
    id: 'tripura',
    name: 'Tripura',
    code: 'TR',
    adminUnitName: 'Sub-Division',
    adminUnitPlural: 'Sub-Divisions',
    districtCount: 8,
    adminUnitCount: 26,
    rankedCount: 26,
    hostCandidateCount: 78,
    center: [23.8039, 91.6816],
    bounds: [
      [22.90, 91.10],
      [24.60, 92.40],
    ],
    isCoastal: false,
    sdmaName: 'Tripura SDMA (TDMA)',
    tagline: 'Northeastern Hills & River Valleys Multi-Hazard & Resettlement Platform',
  },
  telangana: {
    id: 'telangana',
    name: 'Telangana',
    code: 'TG',
    adminUnitName: 'Mandal',
    adminUnitPlural: 'Mandals',
    districtCount: 33,
    adminUnitCount: 109,
    rankedCount: 109,
    hostCandidateCount: 18,
    center: [17.8495, 79.1151],
    bounds: [
      [15.82, 77.23],
      [19.92, 81.80],
    ],
    isCoastal: false,
    sdmaName: 'Telangana SDMA (TGSDMA)',
    tagline: 'Deccan Plateau & Godavari-Krishna River Basins Multi-Hazard Platform',
  },
  rajasthan: {
    id: 'rajasthan',
    name: 'Rajasthan',
    code: 'RJ',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 33,
    adminUnitCount: 198,
    rankedCount: 198,
    hostCandidateCount: 34,
    center: [26.58, 73.85],
    bounds: [
      [23.06, 69.48],
      [30.20, 78.26],
    ],
    isCoastal: false,
    sdmaName: 'Rajasthan SDMA (RSDMA)',
    tagline: 'Arid & Semi-Arid Multi-Hazard Vulnerability & Relocation Decision System',
  },
  madhya_pradesh: {
    id: 'madhya_pradesh',
    name: 'Madhya Pradesh',
    code: 'MP',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 52,
    adminUnitCount: 273,
    rankedCount: 273,
    hostCandidateCount: 53,
    center: [23.47, 77.94],
    bounds: [
      [21.08, 74.03],
      [26.87, 82.81],
    ],
    isCoastal: false,
    sdmaName: 'Madhya Pradesh SDMA (MPSDMA)',
    tagline: 'Central Plateau & Narmada Basin Multi-Hazard Platform',
  },
  karnataka: {
    id: 'karnataka',
    name: 'Karnataka',
    code: 'KA',
    adminUnitName: 'Taluk',
    adminUnitPlural: 'Taluks',
    districtCount: 31,
    adminUnitCount: 230,
    rankedCount: 230,
    hostCandidateCount: 57,
    center: [14.705, 76.166],
    bounds: [
      [11.57, 74.05],
      [18.45, 78.58],
    ],
    isCoastal: true,
    sdmaName: 'Karnataka SDMA (KSDMA)',
    tagline: 'Deccan Plateau, Western Ghats & Coastal Multi-Hazard Vulnerability & Relocation Decision System',
  },
  goa: {
    id: 'goa',
    name: 'Goa',
    code: 'GA',
    adminUnitName: 'Taluka',
    adminUnitPlural: 'Talukas',
    districtCount: 2,
    adminUnitCount: 12,
    rankedCount: 12,
    hostCandidateCount: 1,
    center: [15.35, 74.01],
    bounds: [
      [14.89, 73.67],
      [15.80, 74.35],
    ],
    isCoastal: true,
    sdmaName: 'Goa SDMA (GSDMA)',
    tagline: 'Arabian Sea Coast, Mandovi-Zuari Estuaries & Western Ghats Multi-Hazard Platform',
  },
  manipur: {
    id: 'manipur',
    name: 'Manipur',
    code: 'MN',
    adminUnitName: 'Sub-Division',
    adminUnitPlural: 'Sub-Divisions',
    districtCount: 16,
    adminUnitCount: 51,
    rankedCount: 51,
    hostCandidateCount: 14,
    center: [24.80, 93.94],
    bounds: [
      [23.83, 92.95],
      [25.70, 94.78],
    ],
    isCoastal: false,
    sdmaName: 'Manipur SDMA (MSDMA)',
    tagline: 'Indo-Burma Ranges, Loktak Lake & River Basin Multi-Hazard Relocation Decision System',
  },
  jharkhand: {
    id: 'jharkhand',
    name: 'Jharkhand',
    code: 'JH',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 24,
    adminUnitCount: 260,
    rankedCount: 260,
    hostCandidateCount: 93,
    center: [23.65, 85.56],
    bounds: [
      [21.90, 83.25],
      [25.40, 88.05],
    ],
    isCoastal: false,
    sdmaName: 'Jharkhand SDMA (JSDMA)',
    tagline: 'Chota Nagpur Plateau, Damodar-Subarnarekha River Basins & Mineral Belt Multi-Hazard Relocation Decision System',
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
      if (hash.includes('/jh') || hash.includes('/jharkhand') || hash.includes('jharkhand')) {
        return 'jharkhand';
      }
      if (hash.includes('/mn') || hash.includes('/manipur') || hash.includes('manipur')) {
        return 'manipur';
      }
      if (hash.includes('/ga') || hash.includes('/goa') || hash.includes('goa')) {
        return 'goa';
      }
      if (hash.includes('/ka') || hash.includes('/karnataka') || hash.includes('karnataka')) {
        return 'karnataka';
      }
      if (hash.includes('/mp') || hash.includes('/madhya') || hash.includes('madhya')) {
        return 'madhya_pradesh';
      }
      if (hash.includes('/rj') || hash.includes('/rajasthan') || hash.includes('rajasthan')) {
        return 'rajasthan';
      }
      if (hash.includes('/tg') || hash.includes('/ts') || hash.includes('/telangana') || hash.includes('telangana')) {
        return 'telangana';
      }
      if (hash.includes('/tr') || hash.includes('/tripura') || hash.includes('tripura')) {
        return 'tripura';
      }
      if (hash.includes('/tn') || hash.includes('/tamil') || hash.includes('tamil_nadu') || hash.includes('tamil-nadu')) {
        return 'tamil_nadu';
      }
    }
    return 'andhra_pradesh';
  };

  const [stateId, setStateIdState] = useState<StateId>(getInitialState);

  // Keep API client active state synchronized
  const setStateId = (newId: StateId) => {
    setStateIdState(newId);
  };

  const selectStateByName = (name: string) => {
    const lower = name.toLowerCase().replace(/[-_]/g, ' ');
    if (lower.includes('jharkhand') || lower === 'jh') {
      setStateId('jharkhand');
    } else if (lower.includes('manipur') || lower === 'mn') {
      setStateId('manipur');
    } else if (lower.includes('goa') || lower === 'ga') {
      setStateId('goa');
    } else if (lower.includes('karnataka') || lower === 'ka') {
      setStateId('karnataka');
    } else if (lower.includes('madhya') || lower === 'mp') {
      setStateId('madhya_pradesh');
    } else if (lower.includes('rajasthan') || lower === 'rj') {
      setStateId('rajasthan');
    } else if (lower.includes('telangana') || lower === 'tg' || lower === 'ts') {
      setStateId('telangana');
    } else if (lower.includes('tripura') || lower === 'tr') {
      setStateId('tripura');
    } else if (lower.includes('tamil') || lower === 'tn') {
      setStateId('tamil_nadu');
    } else {
      setStateId('andhra_pradesh');
    }
  };

  // Listen to hash changes if needed
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('/jh') || hash.includes('/jharkhand') || hash.includes('jharkhand')) {
        setStateIdState('jharkhand');
      } else if (hash.includes('/mn') || hash.includes('/manipur') || hash.includes('manipur')) {
        setStateIdState('manipur');
      } else if (hash.includes('/ga') || hash.includes('/goa') || hash.includes('goa')) {
        setStateIdState('goa');
      } else if (hash.includes('/ka') || hash.includes('/karnataka') || hash.includes('karnataka')) {
        setStateIdState('karnataka');
      } else if (hash.includes('/mp') || hash.includes('/madhya') || hash.includes('madhya')) {
        setStateIdState('madhya_pradesh');
      } else if (hash.includes('/rj') || hash.includes('/rajasthan') || hash.includes('rajasthan')) {
        setStateIdState('rajasthan');
      } else if (hash.includes('/tg') || hash.includes('/ts') || hash.includes('/telangana') || hash.includes('telangana')) {
        setStateIdState('telangana');
      } else if (hash.includes('/tr') || hash.includes('/tripura') || hash.includes('tripura')) {
        setStateIdState('tripura');
      } else if (hash.includes('/tn') || hash.includes('/tamil') || hash.includes('tamil_nadu') || hash.includes('tamil-nadu')) {
        setStateIdState('tamil_nadu');
      } else if (hash.includes('/ap') || hash.includes('/andhra') || hash.includes('andhra_pradesh') || hash.includes('andhra-pradesh')) {
        setStateIdState('andhra_pradesh');
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
