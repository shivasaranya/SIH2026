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
  | 'telangana'
  | 'madhya_pradesh'
  | 'tripura'
  | 'karnataka'
  | 'goa'
  | 'jharkhand'
  | 'delhi'
  | 'jammu_and_kashmir'
  | 'ladakh'
  | 'manipur';

export interface StateConfig {
  id: StateId;
  name: string;
  code: string;
  adminUnitName: string; // 'Mandal' | 'Taluk' | 'Tehsil' | 'R.D. Block'
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
  rajasthan: {
    id: 'rajasthan',
    name: 'Rajasthan',
    code: 'RJ',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 33,
    adminUnitCount: 244,
    candidateHostsCount: 42,
    center: [26.58, 73.84],
    bounds: [
      [23.05, 69.50],
      [30.20, 78.28],
    ],
    isCoastal: false,
    sdmaName: 'Rajasthan State Disaster Management Authority (RSDMA)',
    tagline: 'Thar Desert Arid Drought, Extreme Heatwave & Relocation Decision System',
  },
  telangana: {
    id: 'telangana',
    name: 'Telangana',
    code: 'TG',
    adminUnitName: 'Mandal',
    adminUnitPlural: 'Mandals',
    districtCount: 33,
    adminUnitCount: 594,
    candidateHostsCount: 36,
    center: [17.87, 78.96],
    bounds: [
      [15.84, 77.24],
      [19.92, 81.32],
    ],
    isCoastal: false,
    sdmaName: 'Telangana State Disaster Management Authority (TGSDMA)',
    tagline: 'Godavari-Krishna Basin Urban Inundation & Heatwave Decision System',
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
  madhya_pradesh: {
    id: 'madhya_pradesh',
    name: 'Madhya Pradesh',
    code: 'MP',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 52,
    adminUnitCount: 428,
    candidateHostsCount: 65,
    center: [23.47, 77.94],
    bounds: [
      [21.08, 74.04],
      [26.87, 82.81],
    ],
    isCoastal: false,
    sdmaName: 'Madhya Pradesh State Disaster Management Authority (MPSDMA)',
    tagline: 'Central River Basins Multi-Hazard & Resettlement Platform',
  },
  tripura: {
    id: 'tripura',
    name: 'Tripura',
    code: 'TR',
    adminUnitName: 'R.D. Block',
    adminUnitPlural: 'R.D. Blocks',
    districtCount: 8,
    adminUnitCount: 58,
    candidateHostsCount: 14,
    center: [23.74, 91.74],
    bounds: [
      [22.94, 91.15],
      [24.53, 92.34],
    ],
    isCoastal: false,
    sdmaName: 'Tripura State Disaster Management Authority (TDMA)',
    tagline: 'North Eastern Hilly Terrain Flash Flood & Landslide Decision System',
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
  odisha: {
    id: 'odisha',
    name: 'Odisha',
    code: 'OD',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 30,
    adminUnitCount: 314,
    candidateHostsCount: 48,
    center: [20.9517, 85.0985],
    bounds: [
      [17.78, 81.37],
      [22.57, 87.50],
    ],
    isCoastal: true,
    sdmaName: 'Odisha State Disaster Management Authority (OSDMA)',
    tagline: 'Bay of Bengal Cyclone, Storm Surge & Resettlement Decision System',
  },
  west_bengal: {
    id: 'west_bengal',
    name: 'West Bengal',
    code: 'WB',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 23,
    adminUnitCount: 342,
    candidateHostsCount: 52,
    center: [22.9868, 87.8550],
    bounds: [
      [21.50, 85.80],
      [27.20, 89.90],
    ],
    isCoastal: true,
    sdmaName: 'West Bengal Disaster Management Department (WBDMD)',
    tagline: 'Sundarbans Delta Inundation & Cyclone Relocation Platform',
  },
  bihar: {
    id: 'bihar',
    name: 'Bihar',
    code: 'BR',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 38,
    adminUnitCount: 534,
    candidateHostsCount: 62,
    center: [25.0961, 85.3131],
    bounds: [
      [24.28, 83.32],
      [27.52, 88.30],
    ],
    isCoastal: false,
    sdmaName: 'Bihar State Disaster Management Authority (BSDMA)',
    tagline: 'Gangetic Basin Multi-River Inundation & Relocation System',
  },
  assam: {
    id: 'assam',
    name: 'Assam',
    code: 'AS',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 33,
    adminUnitCount: 154,
    candidateHostsCount: 34,
    center: [26.2006, 92.9376],
    bounds: [
      [24.15, 89.70],
      [28.00, 96.02],
    ],
    isCoastal: false,
    sdmaName: 'Assam State Disaster Management Authority (ASDMA)',
    tagline: 'Brahmaputra Basin Flood & Riverbank Erosion Resettlement Platform',
  },
  uttar_pradesh: {
    id: 'uttar_pradesh',
    name: 'Uttar Pradesh',
    code: 'UP',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 75,
    adminUnitCount: 350,
    candidateHostsCount: 88,
    center: [26.8467, 80.9462],
    bounds: [
      [23.86, 77.08],
      [30.41, 84.64],
    ],
    isCoastal: false,
    sdmaName: 'Uttar Pradesh State Disaster Management Authority (UPSDMA)',
    tagline: 'Gangetic Plains Multi-Hazard & Flood Resettlement Decision Platform',
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
    center: [30.0668, 79.0193],
    bounds: [
      [28.71, 77.57],
      [31.46, 81.05],
    ],
    isCoastal: false,
    sdmaName: 'Uttarakhand State Disaster Management Authority (USDMA)',
    tagline: 'Central Himalaya Flash Flood, Landslide & Resettlement Platform',
  },
  sikkim: {
    id: 'sikkim',
    name: 'Sikkim',
    code: 'SK',
    adminUnitName: 'Sub-Division',
    adminUnitPlural: 'Sub-Divisions',
    districtCount: 6,
    adminUnitCount: 16,
    candidateHostsCount: 8,
    center: [27.5330, 88.5122],
    bounds: [
      [27.08, 88.01],
      [28.13, 88.92],
    ],
    isCoastal: false,
    sdmaName: 'Sikkim State Disaster Management Authority (SSDMA)',
    tagline: 'Eastern Himalaya GLOF & Landslide Relocation Decision System',
  },
  arunachal_pradesh: {
    id: 'arunachal_pradesh',
    name: 'Arunachal Pradesh',
    code: 'AR',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 25,
    adminUnitCount: 180,
    candidateHostsCount: 22,
    center: [28.2180, 94.7278],
    bounds: [
      [26.65, 91.50],
      [29.47, 97.42],
    ],
    isCoastal: false,
    sdmaName: 'Arunachal Pradesh Disaster Management Authority (APSDMA)',
    tagline: 'Eastern Himalayan Terrain Landslide & Flood Resettlement System',
  },
  nagaland: {
    id: 'nagaland',
    name: 'Nagaland',
    code: 'NL',
    adminUnitName: 'Circle',
    adminUnitPlural: 'Circles',
    districtCount: 16,
    adminUnitCount: 93,
    candidateHostsCount: 12,
    center: [26.1584, 94.5624],
    bounds: [
      [25.10, 93.33],
      [27.04, 95.25],
    ],
    isCoastal: false,
    sdmaName: 'Nagaland State Disaster Management Authority (NSDMA)',
    tagline: 'Naga Hills Earthquake & Multi-Hazard Decision Platform',
  },
  meghalaya: {
    id: 'meghalaya',
    name: 'Meghalaya',
    code: 'ML',
    adminUnitName: 'C&RD Block',
    adminUnitPlural: 'C&RD Blocks',
    districtCount: 12,
    adminUnitCount: 46,
    candidateHostsCount: 14,
    center: [25.4670, 91.3662],
    bounds: [
      [25.03, 89.81],
      [26.12, 92.80],
    ],
    isCoastal: false,
    sdmaName: 'Meghalaya State Disaster Management Authority (MSDMA)',
    tagline: 'Shillong Plateau Flash Flood & Landslide Resettlement System',
  },
  karnataka: {
    id: 'karnataka',
    name: 'Karnataka',
    code: 'KA',
    adminUnitName: 'Taluk',
    adminUnitPlural: 'Taluks',
    districtCount: 31,
    adminUnitCount: 240,
    candidateHostsCount: 45,
    center: [15.3173, 75.7139],
    bounds: [
      [11.59, 74.05],
      [18.45, 78.58],
    ],
    isCoastal: true,
    sdmaName: 'Karnataka State Disaster Management Authority (KSDMA)',
    tagline: 'Western Ghats & Deccan Plateau Multi-Hazard Relocation Platform',
  },
  goa: {
    id: 'goa',
    name: 'Goa',
    code: 'GA',
    adminUnitName: 'Taluka',
    adminUnitPlural: 'Talukas',
    districtCount: 2,
    adminUnitCount: 12,
    candidateHostsCount: 6,
    center: [15.2993, 74.1240],
    bounds: [
      [14.89, 73.68],
      [15.80, 74.34],
    ],
    isCoastal: true,
    sdmaName: 'Goa State Disaster Management Authority (GSDMA)',
    tagline: 'Konkan Coast Inundation & Multi-Hazard Management Platform',
  },
  jharkhand: {
    id: 'jharkhand',
    name: 'Jharkhand',
    code: 'JH',
    adminUnitName: 'Block',
    adminUnitPlural: 'Blocks',
    districtCount: 24,
    adminUnitCount: 260,
    candidateHostsCount: 32,
    center: [23.6102, 85.2799],
    bounds: [
      [21.97, 83.33],
      [25.35, 87.95],
    ],
    isCoastal: false,
    sdmaName: 'Jharkhand State Disaster Management Authority (JSDMA)',
    tagline: 'Chota Nagpur Plateau Mining & Flood Hazard Resettlement Platform',
  },
  delhi: {
    id: 'delhi',
    name: 'Delhi',
    code: 'DL',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 11,
    adminUnitCount: 33,
    candidateHostsCount: 10,
    center: [28.7041, 77.1025],
    bounds: [
      [28.40, 76.84],
      [28.88, 77.34],
    ],
    isCoastal: false,
    sdmaName: 'Delhi Disaster Management Authority (DDMA)',
    tagline: 'National Capital Territory Urban Flood & Seismic Hazard Platform',
  },
  jammu_and_kashmir: {
    id: 'jammu_and_kashmir',
    name: 'Jammu and Kashmir',
    code: 'JK',
    adminUnitName: 'Tehsil',
    adminUnitPlural: 'Tehsils',
    districtCount: 20,
    adminUnitCount: 140,
    candidateHostsCount: 20,
    center: [33.7782, 76.5762],
    bounds: [
      [32.28, 73.75],
      [35.15, 77.80],
    ],
    isCoastal: false,
    sdmaName: 'Jammu & Kashmir Disaster Management Authority (JKDMA)',
    tagline: 'Pir Panjal & Kashmir Valley Avalanche, Seismic & Flood Platform',
  },
  ladakh: {
    id: 'ladakh',
    name: 'Ladakh',
    code: 'LA',
    adminUnitName: 'Sub-Division',
    adminUnitPlural: 'Sub-Divisions',
    districtCount: 2,
    adminUnitCount: 14,
    candidateHostsCount: 6,
    center: [34.1526, 77.5771],
    bounds: [
      [32.20, 75.80],
      [36.00, 80.50],
    ],
    isCoastal: false,
    sdmaName: 'Ladakh Disaster Management Authority (LDMA)',
    tagline: 'Trans-Himalayan Cold Desert Flash Flood & Glacial Lake Outburst Platform',
  },
  manipur: {
    id: 'manipur',
    name: 'Manipur',
    code: 'MN',
    adminUnitName: 'Sub-Division',
    adminUnitPlural: 'Sub-Divisions',
    districtCount: 16,
    adminUnitCount: 68,
    candidateHostsCount: 12,
    center: [24.6637, 93.9063],
    bounds: [
      [23.83, 92.98],
      [25.68, 94.78],
    ],
    isCoastal: false,
    sdmaName: 'Manipur State Disaster Management Authority (MSDMA)',
    tagline: 'Loktak Lake & Manipur River Basin Flood & Landslide Platform',
  },
};

/**
 * Maps any state name, code, slug, or search term into a valid StateId
 */
export function resolveStateId(input: string): StateId {
  if (!input) return 'andhra_pradesh';
  const clean = input.trim().toLowerCase().replace(/[-_]/g, ' ');

  // Direct exact matches first
  if (clean === 'rajasthan' || clean === 'rj') return 'rajasthan';
  if (clean === 'andhra pradesh' || clean === 'andhra' || clean === 'ap') return 'andhra_pradesh';
  if (clean === 'telangana' || clean === 'tg' || clean === 'ts') return 'telangana';
  if (clean === 'tamil nadu' || clean === 'tamil' || clean === 'tn') return 'tamil_nadu';
  if (clean === 'madhya pradesh' || clean === 'madhya' || clean === 'mp') return 'madhya_pradesh';
  if (clean === 'tripura' || clean === 'tr') return 'tripura';
  if (clean === 'mizoram' || clean === 'mizo' || clean === 'mz') return 'mizoram';
  if (clean === 'himachal pradesh' || clean === 'himachal' || clean === 'hp') return 'himachal_pradesh';
  if (clean === 'kerala' || clean === 'kerela' || clean === 'kl') return 'kerala';
  if (clean === 'gujarat' || clean === 'gj') return 'gujarat';
  if (clean === 'maharashtra' || clean === 'maharastra' || clean === 'mh') return 'maharashtra';
  if (clean === 'haryana' || clean === 'hr') return 'haryana';
  if (clean === 'punjab' || clean === 'pb') return 'punjab';
  if (clean === 'chhattisgarh' || clean === 'chhatisgarh' || clean === 'cg' || clean === 'ct') return 'chhattisgarh';
  if (clean === 'odisha' || clean === 'orissa' || clean === 'od') return 'odisha';
  if (clean === 'west bengal' || clean === 'bengal' || clean === 'wb') return 'west_bengal';
  if (clean === 'bihar' || clean === 'br') return 'bihar';
  if (clean === 'assam' || clean === 'as') return 'assam';
  if (clean === 'uttarakhand' || clean === 'uttaranchal' || clean === 'uk') return 'uttarakhand';
  if (clean === 'uttar pradesh' || clean === 'uttar' || clean === 'up') return 'uttar_pradesh';
  if (clean === 'sikkim' || clean === 'sk') return 'sikkim';
  if (clean === 'arunachal pradesh' || clean === 'arunachal' || clean === 'ar') return 'arunachal_pradesh';
  if (clean === 'nagaland' || clean === 'nl') return 'nagaland';
  if (clean === 'meghalaya' || clean === 'ml') return 'meghalaya';
  if (clean === 'karnataka' || clean === 'ka') return 'karnataka';
  if (clean === 'goa' || clean === 'ga') return 'goa';
  if (clean === 'jharkhand' || clean === 'jh') return 'jharkhand';
  if (clean === 'delhi' || clean === 'dl') return 'delhi';
  if (clean.includes('kashmir') || clean === 'jk') return 'jammu_and_kashmir';
  if (clean === 'ladakh' || clean === 'la') return 'ladakh';
  if (clean === 'manipur' || clean === 'mn') return 'manipur';

  // Substring inclusion checks
  if (clean.includes('rajasthan')) return 'rajasthan';
  if (clean.includes('telangana')) return 'telangana';
  if (clean.includes('madhya')) return 'madhya_pradesh';
  if (clean.includes('tripura')) return 'tripura';
  if (clean.includes('tamil')) return 'tamil_nadu';
  if (clean.includes('mizo')) return 'mizoram';
  if (clean.includes('himachal')) return 'himachal_pradesh';
  if (clean.includes('gujarat')) return 'gujarat';
  if (clean.includes('kerala')) return 'kerala';
  if (clean.includes('maharashtra')) return 'maharashtra';
  if (clean.includes('haryana')) return 'haryana';
  if (clean.includes('punjab')) return 'punjab';
  if (clean.includes('chhattisgarh') || clean.includes('chhatisgarh')) return 'chhattisgarh';
  if (clean.includes('odisha') || clean.includes('orissa')) return 'odisha';
  if (clean.includes('bengal')) return 'west_bengal';
  if (clean.includes('bihar')) return 'bihar';
  if (clean.includes('assam')) return 'assam';
  if (clean.includes('uttarakhand') || clean.includes('uttaranchal')) return 'uttarakhand';
  if (clean.includes('uttar')) return 'uttar_pradesh';
  if (clean.includes('sikkim')) return 'sikkim';
  if (clean.includes('arunachal')) return 'arunachal_pradesh';
  if (clean.includes('nagaland')) return 'nagaland';
  if (clean.includes('meghalaya')) return 'meghalaya';
  if (clean.includes('karnataka')) return 'karnataka';
  if (clean.includes('goa')) return 'goa';
  if (clean.includes('jharkhand')) return 'jharkhand';
  if (clean.includes('delhi')) return 'delhi';
  if (clean.includes('manipur')) return 'manipur';
  if (clean.includes('andhra')) return 'andhra_pradesh';

  return 'andhra_pradesh';
}

/**
 * Returns the URL slug for a given state ID (e.g. 'rajasthan', 'andhra-pradesh', 'telangana')
 */
export function getStateSlug(id: StateId): string {
  return id.replace(/_/g, '-');
}

interface StateContextType {
  currentState: StateConfig;
  stateId: StateId;
  setStateId: (id: StateId) => void;
  selectStateByName: (name: string) => void;
  availableStates: StateConfig[];
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read initial state from hash or path, defaulting to andhra_pradesh
  const getInitialState = (): StateId => {
    if (typeof window !== 'undefined') {
      const fullUrl = (window.location.pathname + window.location.hash).toLowerCase();
      // Look for government/(slug) pattern
      const match = fullUrl.match(/government\/([a-z0-9_-]+)/i);
      if (match && match[1] && match[1] !== 'select-state' && match[1] !== 'states') {
        return resolveStateId(match[1]);
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
    const targetId = resolveStateId(name);
    setStateId(targetId);
  };

  // Listen to hash and popstate changes
  useEffect(() => {
    const handleUrlChange = () => {
      const fullUrl = (window.location.pathname + window.location.hash).toLowerCase();
      const match = fullUrl.match(/government\/([a-z0-9_-]+)/i);
      if (match && match[1] && match[1] !== 'select-state' && match[1] !== 'states') {
        const resolved = resolveStateId(match[1]);
        setStateIdState(resolved);
        setActiveStateId(resolved);
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
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
