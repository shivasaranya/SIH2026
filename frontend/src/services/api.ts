import type { GeoJsonFeatureCollection, DistrictProperties, MandalProperties } from '../types/gis';
import type { StateDemographicSummary, DistrictDetailResponse } from '../types/demographics';

const API_BASE = '/api';

export async function fetchDistrictsGeoJson(): Promise<GeoJsonFeatureCollection<DistrictProperties>> {
  const res = await fetch(`${API_BASE}/gis/districts`);
  if (!res.ok) {
    throw new Error(`Failed to load district boundaries: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalsGeoJson(districtId?: string): Promise<GeoJsonFeatureCollection<MandalProperties>> {
  const url = districtId
    ? `${API_BASE}/gis/mandals?district_id=${encodeURIComponent(districtId)}`
    : `${API_BASE}/gis/mandals`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load mandal boundaries: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchDemographicsSummary(): Promise<StateDemographicSummary> {
  const res = await fetch(`${API_BASE}/demographics/summary`);
  if (!res.ok) {
    throw new Error(`Failed to load demographic summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchDistrictDemographics(districtId: string): Promise<DistrictDetailResponse> {
  const res = await fetch(`${API_BASE}/demographics/district/${encodeURIComponent(districtId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load demographics for district ${districtId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchVulnerabilitySummary(): Promise<import('../types/vulnerability').VulnerabilitySummaryResponse> {
  const res = await fetch(`${API_BASE}/vulnerability/summary`);
  if (!res.ok) {
    throw new Error(`Failed to load vulnerability summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchVulnerabilityMandals(
  districtId?: string,
  priorityQuadrant?: string
): Promise<import('../types/vulnerability').MandalVulnerabilityListResponse> {
  const params = new URLSearchParams();
  if (districtId) params.append('district_id', districtId);
  if (priorityQuadrant) params.append('priority_quadrant', priorityQuadrant);
  const qs = params.toString();
  const url = qs ? `${API_BASE}/vulnerability/mandals?${qs}` : `${API_BASE}/vulnerability/mandals`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load mandal vulnerability list: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalVulnerability(mandalId: string): Promise<import('../types/vulnerability').MandalVulnerabilityItem> {
  const res = await fetch(`${API_BASE}/vulnerability/mandal/${encodeURIComponent(mandalId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load vulnerability for mandal ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalHazard(mandalId: string): Promise<import('../types/hazard').MandalHazardItem | import('../types/hazard').MandalHazardExposureItem> {
  const res = await fetch(`${API_BASE}/hazard/mandal/${encodeURIComponent(mandalId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load hazard for mandal ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchVulnerabilityGeoJson(districtId?: string): Promise<GeoJsonFeatureCollection<import('../types/vulnerability').MandalVulnerabilityItem>> {
  const url = districtId
    ? `${API_BASE}/vulnerability/geojson?district_id=${encodeURIComponent(districtId)}`
    : `${API_BASE}/vulnerability/geojson`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load vulnerability geojson: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacitySummary(): Promise<import('../types/capacity').CapacitySummaryResponse> {
  const res = await fetch(`${API_BASE}/capacity/summary`);
  if (!res.ok) {
    throw new Error(`Failed to load capacity summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityMandals(
  districtId?: string,
  hasShelters?: boolean
): Promise<import('../types/capacity').MandalCapacityListResponse> {
  const params = new URLSearchParams();
  if (districtId) params.append('district_id', districtId);
  if (hasShelters !== undefined) params.append('has_shelters', String(hasShelters));
  const qs = params.toString();
  const url = qs ? `${API_BASE}/capacity/mandals?${qs}` : `${API_BASE}/capacity/mandals`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load mandal capacity list: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalCapacity(mandalId: string): Promise<import('../types/capacity').MandalCapacityItem> {
  const res = await fetch(`${API_BASE}/capacity/mandal/${encodeURIComponent(mandalId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load capacity for mandal ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityGeoJson(districtId?: string): Promise<GeoJsonFeatureCollection<import('../types/capacity').MandalCapacityItem>> {
  const url = districtId
    ? `${API_BASE}/capacity/geojson?district_id=${encodeURIComponent(districtId)}`
    : `${API_BASE}/capacity/geojson`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load capacity geojson: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityAdequacySummary(): Promise<import('../types/capacity').CapacityAdequacySummaryResponse> {
  const res = await fetch(`${API_BASE}/capacity/adequacy/summary`);
  if (!res.ok) {
    throw new Error(`Failed to load capacity adequacy summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityAdequacyMandals(
  districtId?: string,
  capacityCondition?: string,
  primaryBottleneck?: string,
  isHostCandidate?: boolean
): Promise<import('../types/capacity').MandalCapacityAdequacyListResponse> {
  const params = new URLSearchParams();
  if (districtId) params.append('district_id', districtId);
  if (capacityCondition) params.append('capacity_condition', capacityCondition);
  if (primaryBottleneck) params.append('primary_bottleneck', primaryBottleneck);
  if (isHostCandidate !== undefined) params.append('is_host_candidate', String(isHostCandidate));
  const qs = params.toString();
  const url = qs ? `${API_BASE}/capacity/adequacy/mandals?${qs}` : `${API_BASE}/capacity/adequacy/mandals`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load mandal capacity adequacy list: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalAdequacyDetail(mandalId: string): Promise<import('../types/capacity').MandalCapacityAdequacyItem> {
  const res = await fetch(`${API_BASE}/capacity/adequacy/mandal/${encodeURIComponent(mandalId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load adequacy for mandal ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchHostZones(mandalId: string): Promise<import('../types/capacity').HostZoneCandidateListResponse> {
  const res = await fetch(`${API_BASE}/capacity/host-zones/${encodeURIComponent(mandalId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load host zones for mandal ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

// Phase 4 Relocation Prioritization API Fetchers

export async function fetchRelocationSummary(): Promise<import('../types/relocation').RelocationSummaryResponse> {
  const res = await fetch(`${API_BASE}/relocation/summary`);
  if (!res.ok) {
    throw new Error(`Failed to load relocation summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchRelocationMandals(
  districtId?: string,
  priorityCategory?: string,
  rankingStatus?: string,
  primaryFactor?: string
): Promise<import('../types/relocation').MandalRelocationListResponse> {
  const params = new URLSearchParams();
  if (districtId) params.append('district_id', districtId);
  if (priorityCategory) params.append('priority_category', priorityCategory);
  if (rankingStatus) params.append('ranking_status', rankingStatus);
  if (primaryFactor) params.append('primary_factor', primaryFactor);
  const qs = params.toString();
  const url = qs ? `${API_BASE}/relocation/mandals?${qs}` : `${API_BASE}/relocation/mandals`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load relocation mandals list: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchTopRelocationMandals(limit: number = 10): Promise<import('../types/relocation').TopRelocationListResponse> {
  const res = await fetch(`${API_BASE}/relocation/top?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to load top relocation mandals: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalRelocationDetail(mandalId: string): Promise<import('../types/relocation').MandalRelocationItem> {
  const res = await fetch(`${API_BASE}/relocation/mandal/${encodeURIComponent(mandalId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load relocation detail for mandal ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAHPWeights(): Promise<import('../types/relocation').AHPWeightsResponse> {
  const res = await fetch(`${API_BASE}/relocation/weights`);
  if (!res.ok) {
    throw new Error(`Failed to load AHP weights: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchRelocationFactors(
  districtId?: string,
  priorityCategory?: string
): Promise<import('../types/relocation').RelocationFactorContributionsResponse> {
  const params = new URLSearchParams();
  if (districtId) params.append('district_id', districtId);
  if (priorityCategory) params.append('priority_category', priorityCategory);
  const qs = params.toString();
  const url = qs ? `${API_BASE}/relocation/factors?${qs}` : `${API_BASE}/relocation/factors`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load relocation factors: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchRelocationGeoJson(districtId?: string): Promise<GeoJsonFeatureCollection<import('../types/relocation').MandalRelocationItem>> {
  const url = districtId
    ? `${API_BASE}/relocation/geojson?district_id=${encodeURIComponent(districtId)}`
    : `${API_BASE}/relocation/geojson`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load relocation geojson: HTTP ${res.status}`);
  }
  return res.json();
}

// ==========================================
// Phase 5: What-If Disaster Simulation APIs
// ==========================================

export async function fetchSimulationPresets(): Promise<import('../types/simulation').SimulationPresetsResponse> {
  const res = await fetch(`${API_BASE}/simulation/presets`);
  if (!res.ok) {
    throw new Error(`Failed to load simulation presets: HTTP ${res.status}`);
  }
  return res.json();
}

export async function runWhatIfSimulation(
  params: import('../types/simulation').SimulationParameters
): Promise<import('../types/simulation').SimulationRunResponse> {
  const res = await fetch(`${API_BASE}/simulation/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Failed to execute What-If simulation: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalSimulation(
  mandalId: string,
  params?: Partial<import('../types/simulation').SimulationParameters>
): Promise<import('../types/simulation').MandalSimulationComparisonItem> {
  const query = new URLSearchParams();
  if (params?.hazard_change !== undefined) query.append('hazard_change', params.hazard_change.toString());
  if (params?.population_change !== undefined) query.append('population_change', params.population_change.toString());
  if (params?.capacity_change !== undefined) query.append('capacity_change', params.capacity_change.toString());
  if (params?.accessibility_change !== undefined) query.append('accessibility_change', params.accessibility_change.toString());

  const qs = query.toString();
  const url = qs
    ? `${API_BASE}/simulation/mandal/${encodeURIComponent(mandalId)}?${qs}`
    : `${API_BASE}/simulation/mandal/${encodeURIComponent(mandalId)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load mandal simulation for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

// ==========================================
// Phase 6: Decision & Action Planning APIs
// ==========================================


export async function fetchDecisionSummary(): Promise<import('../types/decision').ActionDashboardSummary> {
  const res = await fetch(`${API_BASE}/decision/summary`);
  if (!res.ok) {
    throw new Error(`Failed to load decision summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityGap(mandalId: string): Promise<import('../types/decision').CapacityGapAssessment> {
  const res = await fetch(`${API_BASE}/decision/mandal/${encodeURIComponent(mandalId)}/capacity-gap`);
  if (!res.ok) {
    throw new Error(`Failed to load capacity gap for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchActionPlan(mandalId: string): Promise<import('../types/decision').ActionPlanResponse> {
  const res = await fetch(`${API_BASE}/decision/mandal/${encodeURIComponent(mandalId)}/action-plan`);
  if (!res.ok) {
    throw new Error(`Failed to load action plan for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSourceHostComparison(
  sourceId: string,
  hostId: string
): Promise<import('../types/decision').SourceHostComparisonResponse> {
  const res = await fetch(
    `${API_BASE}/decision/mandal/${encodeURIComponent(sourceId)}/compare/${encodeURIComponent(hostId)}`
  );
  if (!res.ok) {
    throw new Error(`Failed to load source-host comparison: HTTP ${res.status}`);
  }
  return res.json();
}







