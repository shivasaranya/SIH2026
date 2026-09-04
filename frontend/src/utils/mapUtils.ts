import type { DemographicMetricKey } from '../types/gis';
import type { DistrictDemographicSummary } from '../types/demographics';

export interface MetricColorScale {
  thresholds: number[];
  colors: string[];
  formatter: (val: number) => string;
}

export const METRIC_CONFIGS: Record<DemographicMetricKey, {
  label: string;
  unit: string;
  colorScale: MetricColorScale;
}> = {
  topsis_score: {
    label: 'Relocation Priority (TOPSIS Score)',
    unit: 'Score [0–1]',
    colorScale: {
      thresholds: [0.3429, 0.5259, 0.5962],
      colors: ['#10b981', '#38bdf8', '#f59e0b', '#dc2626'],
      formatter: (val) => val.toFixed(3),
    },
  },
  scenario_topsis_score: {
    label: 'Simulated Scenario Priority (TOPSIS)',
    unit: 'Score [0–1]',
    colorScale: {
      thresholds: [0.3429, 0.5259, 0.5962],
      colors: ['#10b981', '#38bdf8', '#f59e0b', '#dc2626'],
      formatter: (val) => val.toFixed(3),
    },
  },
  priority_change: {
    label: 'What-If Priority Change (Δ Score)',
    unit: 'Δ Score',
    colorScale: {
      thresholds: [-0.02, 0.02],
      colors: ['#10b981', '#64748b', '#ef4444'], // Green: Decreased, Slate: Stable, Red: Increased
      formatter: (val) => (val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3)),
    },
  },

  vulnerability: {
    label: 'Population Vulnerability Index (Vi)',

    unit: 'Index [0–1]',
    colorScale: {
      thresholds: [0.25, 0.50, 0.75],
      colors: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
      formatter: (val) => val.toFixed(3),
    },
  },
  hazard_exposure: {
    label: 'Multi-Hazard Exposure (Hi)',
    unit: 'Index [0–1]',
    colorScale: {
      thresholds: [0.25, 0.50, 0.75],
      colors: ['#38bdf8', '#eab308', '#ea580c', '#dc2626'],
      formatter: (val) => val.toFixed(3),
    },
  },
  demographic_sensitivity: {
    label: 'Demographic Sensitivity (Di)',
    unit: 'Index [0–1]',
    colorScale: {
      thresholds: [0.25, 0.50, 0.75],
      colors: ['#6ee7b7', '#a78bfa', '#ec4899', '#be123c'],
      formatter: (val) => val.toFixed(3),
    },
  },
  population: {
    label: 'Total Population',
    unit: 'persons',
    colorScale: {
      thresholds: [500000, 1000000, 1500000, 2000000, 2500000],
      colors: ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1'].reverse(),
      formatter: (val) => `${(val / 1000000).toFixed(2)}M`,
    },
  },
  children_pct: {
    label: 'Children (0–6) %',
    unit: '%',
    colorScale: {
      thresholds: [8.5, 9.5, 10.5, 11.5, 12.5],
      colors: ['#3f007d', '#54278f', '#6a51a3', '#807dba', '#9e9ac8', '#bcbddc'].reverse(),
      formatter: (val) => `${val.toFixed(1)}%`,
    },
  },
  adult_male_pct: {
    label: 'Adult Male (7+) %',
    unit: '%',
    colorScale: {
      thresholds: [40.0, 43.0, 46.0, 49.0, 52.0],
      colors: ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1'].reverse(),
      formatter: (val) => `${val.toFixed(1)}%`,
    },
  },
  adult_female_pct: {
    label: 'Adult Female (7+) %',
    unit: '%',
    colorScale: {
      thresholds: [40.0, 43.0, 46.0, 49.0, 52.0],
      colors: ['#49006a', '#7a0177', '#ae017e', '#dd3497', '#f768a1', '#fa9fb5'].reverse(),
      formatter: (val) => `${val.toFixed(1)}%`,
    },
  },
  non_workers_pct: {
    label: 'Non-Workers (Mobilization Proxy) %',
    unit: '%',
    colorScale: {
      thresholds: [45.0, 50.0, 55.0, 60.0, 65.0],
      colors: ['#7f2704', '#a63603', '#d94801', '#f16913', '#fd8d3c', '#fdae6b'].reverse(),
      formatter: (val) => `${val.toFixed(1)}%`,
    },
  },
  avg_hh_size: {
    label: 'Avg Household Size (Congestion)',
    unit: 'persons/HH',
    colorScale: {
      thresholds: [3.4, 3.8, 4.2, 4.6, 5.0],
      colors: ['#00441b', '#006d2c', '#238b45', '#41ab5d', '#74c476', '#a1d99b'].reverse(),
      formatter: (val) => `${val.toFixed(2)}`,
    },
  },
  sc_pct: {
    label: 'Scheduled Caste (SC) %',
    unit: '%',
    colorScale: {
      thresholds: [12.0, 16.0, 20.0, 24.0, 28.0],
      colors: ['#7f2704', '#a63603', '#d94801', '#f16913', '#fd8d3c', '#fdae6b'].reverse(),
      formatter: (val) => `${val.toFixed(1)}%`,
    },
  },
  st_pct: {
    label: 'Scheduled Tribe (ST) %',
    unit: '%',
    colorScale: {
      thresholds: [2.0, 5.0, 10.0, 20.0, 40.0],
      colors: ['#00441b', '#006d2c', '#238b45', '#41ab5d', '#74c476', '#a1d99b'].reverse(),
      formatter: (val) => `${val.toFixed(1)}%`,
    },
  },
  shelter_capacity: {
    label: 'Designated Shelter Capacity (Direct)',
    unit: 'persons / 1k pop',
    colorScale: {
      thresholds: [10, 50, 100, 200],
      colors: ['#1e293b', '#38bdf8', '#0284c7', '#0369a1', '#075985'],
      formatter: (val) => `${val.toFixed(1)}/1k`,
    },
  },
  road_density: {
    label: 'Evacuation Road Density (Proxy)',
    unit: 'km / km²',
    colorScale: {
      thresholds: [0.8, 1.2, 1.6, 2.0],
      colors: ['#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'],
      formatter: (val) => `${val.toFixed(2)} km/km²`,
    },
  },
  safe_area_fraction: {
    label: 'Safe Habitable Area (Constraint)',
    unit: 'fraction [0–1]',
    colorScale: {
      thresholds: [0.70, 0.85, 0.95],
      colors: ['#ef4444', '#f59e0b', '#10b981', '#059669'],
      formatter: (val) => `${(val * 100).toFixed(1)}%`,
    },
  },
  water_sanitation: {
    label: 'Water & Sanitation (Adequacy)',
    unit: 'score [0–1]',
    colorScale: {
      thresholds: [0.65, 0.75, 0.85],
      colors: ['#f87171', '#fbbf24', '#34d399', '#10b981'],
      formatter: (val) => `${(val * 100).toFixed(1)}%`,
    },
  },
  health_beds: {
    label: 'Health Beds (Normative Baseline)',
    unit: 'beds / 1k pop',
    colorScale: {
      thresholds: [0.5, 1.0, 1.5, 2.0],
      colors: ['#475569', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8'],
      formatter: (val) => `${val.toFixed(2)} beds/1k`,
    },
  },
};

export function getMetricValue(metric: DemographicMetricKey, summary?: DistrictDemographicSummary): number {
  if (!summary) return 0;
  switch (metric) {
    case 'population':
      return summary.total_population;
    case 'children_pct':
      return summary.children_0_6_pct;
    case 'non_workers_pct':
      return summary.total_population > 0 ? ((summary.total_population - summary.workers) / summary.total_population) * 100 : 0;
    case 'avg_hh_size':
      return summary.total_households > 0 ? summary.total_population / summary.total_households : 0;
    case 'sc_pct':
      return summary.sc_pct;
    case 'st_pct':
      return summary.st_pct;
    default:
      return 0;
  }
}

export function getMandalMetricValue(metric: DemographicMetricKey, props?: any): number {
  if (!props) return 0;
  switch (metric) {
    case 'topsis_score':
      return Number(props.topsis_score ?? 0);
    case 'scenario_topsis_score':
      return Number(props.scenario_topsis_score ?? props.topsis_score ?? 0);
    case 'priority_change':
      return Number(props.score_change ?? 0);
    case 'vulnerability':
      return Number(props.vulnerability_index ?? 0);
    case 'hazard_exposure':
      return Number(props.hazard_exposure_index ?? props.multi_hazard_exposure_index ?? 0);
    case 'demographic_sensitivity':
      return Number(props.demographic_sensitivity_index ?? 0);
    case 'shelter_capacity':
      return Number(props.shelter_capacity_per_1000 ?? 0);
    case 'road_density':
      return Number(props.road_density_km_per_km2 ?? 0);
    case 'safe_area_fraction':
      return Number(props.safe_area_fraction ?? 0);
    case 'water_sanitation':
      return Number(props.water_sanitation_adequacy ?? props.water_sanitation_score ?? 0);
    case 'health_beds':
      return Number(props.normative_beds_per_1000 ?? 0);
    case 'population':
      return Number(props.population_total ?? 0);
    case 'children_pct':
      return Number(props.child_share_0_6 ? props.child_share_0_6 * 100 : 0);
    case 'adult_male_pct':
      return Number(props.adult_male_share ? props.adult_male_share * 100 : 0);
    case 'adult_female_pct':
      return Number(props.adult_female_share ? props.adult_female_share * 100 : 0);
    case 'non_workers_pct':
      return Number(props.non_worker_share ? props.non_worker_share * 100 : (props.population_total && props.workers ? ((props.population_total - props.workers) / props.population_total) * 100 : 0));
    case 'avg_hh_size':
      return Number(props.avg_household_size ?? (props.population_total && props.households ? props.population_total / props.households : 0));
    case 'sc_pct':
      return Number(props.sc_share ? props.sc_share * 100 : 0);
    case 'st_pct':
      return Number(props.st_share ? props.st_share * 100 : 0);
    default:
      return 0;
  }
}

export function getColorForValue(val: number, metric: DemographicMetricKey): string {
  const { thresholds, colors } = METRIC_CONFIGS[metric].colorScale;
  for (let i = 0; i < thresholds.length; i++) {
    if (val < thresholds[i]) {
      return colors[i];
    }
  }
  return colors[colors.length - 1];
}


