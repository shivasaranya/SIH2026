import type { GeoJsonFeatureCollection, DistrictProperties, MandalProperties } from '../types/gis';
import type { StateDemographicSummary, DistrictDetailResponse } from '../types/demographics';

const API_BASE = '/api';

let activeStateId: string = 'andhra_pradesh';

export function setActiveStateId(stateId: string) {
  activeStateId = stateId;
}

export function getActiveStateId(): string {
  return activeStateId;
}

function resolveState(stateId?: string): string {
  return stateId || activeStateId || 'andhra_pradesh';
}

export async function fetchDistrictsGeoJson(stateId?: string): Promise<GeoJsonFeatureCollection<DistrictProperties>> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/gis/districts?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load district boundaries: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalsGeoJson(districtId?: string, stateId?: string): Promise<GeoJsonFeatureCollection<MandalProperties>> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  const url = `${API_BASE}/gis/mandals?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load sub-district boundaries: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchDemographicsSummary(stateId?: string): Promise<StateDemographicSummary> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/demographics/summary?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load demographic summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchDistrictDemographics(districtId: string, stateId?: string): Promise<DistrictDetailResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/demographics/district/${encodeURIComponent(districtId)}?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load demographics for district ${districtId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchVulnerabilitySummary(stateId?: string): Promise<import('../types/vulnerability').VulnerabilitySummaryResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/vulnerability/summary?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load vulnerability summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchVulnerabilityMandals(
  districtId?: string,
  priorityQuadrant?: string,
  stateId?: string
): Promise<import('../types/vulnerability').MandalVulnerabilityListResponse> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  if (priorityQuadrant) params.append('priority_quadrant', priorityQuadrant);
  const qs = params.toString();
  const url = `${API_BASE}/vulnerability/mandals?${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load sub-district vulnerability list: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalVulnerability(mandalId: string, stateId?: string): Promise<import('../types/vulnerability').MandalVulnerabilityItem> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/vulnerability/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load vulnerability for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalHazard(mandalId: string, stateId?: string): Promise<import('../types/hazard').MandalHazardItem | import('../types/hazard').MandalHazardExposureItem> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/hazard/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load hazard for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchVulnerabilityGeoJson(districtId?: string, stateId?: string): Promise<GeoJsonFeatureCollection<import('../types/vulnerability').MandalVulnerabilityItem>> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  const url = `${API_BASE}/vulnerability/geojson?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load vulnerability geojson: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacitySummary(stateId?: string): Promise<import('../types/capacity').CapacitySummaryResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/capacity/summary?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load capacity summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityMandals(
  districtId?: string,
  hasShelters?: boolean,
  stateId?: string
): Promise<import('../types/capacity').MandalCapacityListResponse> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  if (hasShelters !== undefined) params.append('has_shelters', String(hasShelters));
  const qs = params.toString();
  const url = `${API_BASE}/capacity/mandals?${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load sub-district capacity list: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalCapacity(mandalId: string, stateId?: string): Promise<import('../types/capacity').MandalCapacityItem> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/capacity/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load capacity for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityGeoJson(districtId?: string, stateId?: string): Promise<GeoJsonFeatureCollection<import('../types/capacity').MandalCapacityItem>> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  const url = `${API_BASE}/capacity/geojson?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load capacity geojson: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityAdequacySummary(stateId?: string): Promise<import('../types/capacity').CapacityAdequacySummaryResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/capacity/adequacy/summary?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load capacity adequacy summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityAdequacyMandals(
  districtId?: string,
  capacityCondition?: string,
  primaryBottleneck?: string,
  isHostCandidate?: boolean,
  stateId?: string
): Promise<import('../types/capacity').MandalCapacityAdequacyListResponse> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  if (capacityCondition) params.append('capacity_condition', capacityCondition);
  if (primaryBottleneck) params.append('primary_bottleneck', primaryBottleneck);
  if (isHostCandidate !== undefined) params.append('is_host_candidate', String(isHostCandidate));
  const qs = params.toString();
  const url = `${API_BASE}/capacity/adequacy/mandals?${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load capacity adequacy list: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalAdequacyDetail(mandalId: string, stateId?: string): Promise<import('../types/capacity').MandalCapacityAdequacyItem> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/capacity/adequacy/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load adequacy for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchHostZones(mandalId: string, stateId?: string): Promise<import('../types/capacity').HostZoneCandidateListResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/capacity/host-zones/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load host zones for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

// Phase 4 Relocation Prioritization API Fetchers

export async function fetchRelocationSummary(stateId?: string): Promise<import('../types/relocation').RelocationSummaryResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/relocation/summary?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load relocation summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchRelocationMandals(
  districtId?: string,
  priorityCategory?: string,
  rankingStatus?: string,
  primaryFactor?: string,
  stateId?: string
): Promise<import('../types/relocation').MandalRelocationListResponse> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  if (priorityCategory) params.append('priority_category', priorityCategory);
  if (rankingStatus) params.append('ranking_status', rankingStatus);
  if (primaryFactor) params.append('primary_factor', primaryFactor);
  const qs = params.toString();
  const url = `${API_BASE}/relocation/mandals?${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load relocation list: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchTopRelocationMandals(limit: number = 10, stateId?: string): Promise<import('../types/relocation').TopRelocationListResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/relocation/top?limit=${limit}&state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load top relocation records: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMandalRelocationDetail(mandalId: string, stateId?: string): Promise<import('../types/relocation').MandalRelocationItem> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/relocation/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load relocation detail for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAHPWeights(stateId?: string): Promise<import('../types/relocation').AHPWeightsResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/relocation/weights?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load AHP weights: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchRelocationFactors(
  districtId?: string,
  priorityCategory?: string,
  stateId?: string
): Promise<import('../types/relocation').RelocationFactorContributionsResponse> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  if (priorityCategory) params.append('priority_category', priorityCategory);
  const qs = params.toString();
  const url = `${API_BASE}/relocation/factors?${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load relocation factors: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchRelocationGeoJson(districtId?: string, stateId?: string): Promise<GeoJsonFeatureCollection<import('../types/relocation').MandalRelocationItem>> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  const url = `${API_BASE}/relocation/geojson?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load relocation geojson: HTTP ${res.status}`);
  }
  return res.json();
}

// ==========================================
// Phase 5: What-If Disaster Simulation APIs
// ==========================================

export async function fetchSimulationPresets(stateId?: string): Promise<import('../types/simulation').SimulationPresetsResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/simulation/presets?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load simulation presets: HTTP ${res.status}`);
  }
  return res.json();
}

export async function runWhatIfSimulation(
  params: import('../types/simulation').SimulationParameters,
  stateId?: string
): Promise<import('../types/simulation').SimulationRunResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/simulation/run?state_id=${encodeURIComponent(sid)}`, {
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
  params?: Partial<import('../types/simulation').SimulationParameters>,
  stateId?: string
): Promise<import('../types/simulation').MandalSimulationComparisonItem> {
  const sid = resolveState(stateId);
  const query = new URLSearchParams();
  query.append('state_id', sid);
  if (params?.hazard_change !== undefined) query.append('hazard_change', params.hazard_change.toString());
  if (params?.population_change !== undefined) query.append('population_change', params.population_change.toString());
  if (params?.capacity_change !== undefined) query.append('capacity_change', params.capacity_change.toString());
  if (params?.accessibility_change !== undefined) query.append('accessibility_change', params.accessibility_change.toString());

  const qs = query.toString();
  const url = `${API_BASE}/simulation/mandal/${encodeURIComponent(mandalId)}?${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load sub-district simulation for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

// ==========================================
// Phase 6: Decision & Action Planning APIs
// ==========================================

export async function fetchDecisionSummary(stateId?: string): Promise<import('../types/decision').ActionDashboardSummary> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/decision/summary?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load decision summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCapacityGap(mandalId: string, stateId?: string): Promise<import('../types/decision').CapacityGapAssessment> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/decision/mandal/${encodeURIComponent(mandalId)}/capacity-gap?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load capacity gap for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchActionPlan(mandalId: string, stateId?: string): Promise<import('../types/decision').ActionPlanResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(`${API_BASE}/decision/mandal/${encodeURIComponent(mandalId)}/action-plan?state_id=${encodeURIComponent(sid)}`);
  if (!res.ok) {
    throw new Error(`Failed to load action plan for ${mandalId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSourceHostComparison(
  sourceId: string,
  hostId: string,
  stateId?: string
): Promise<import('../types/decision').SourceHostComparisonResponse> {
  const sid = resolveState(stateId);
  const res = await fetch(
    `${API_BASE}/decision/mandal/${encodeURIComponent(sourceId)}/compare/${encodeURIComponent(hostId)}?state_id=${encodeURIComponent(sid)}`
  );
  if (!res.ok) {
    throw new Error(`Failed to load source-host comparison: HTTP ${res.status}`);
  }
  return res.json();
}
