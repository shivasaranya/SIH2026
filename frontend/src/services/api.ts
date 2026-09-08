import type { GeoJsonFeatureCollection, DistrictProperties, MandalProperties } from '../types/gis';
import type { StateDemographicSummary, DistrictDetailResponse, MandalVillageListResponse } from '../types/demographics';

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

/**
 * Centralized API request wrapper with robust network and server error handling.
 * Catches connection drops, server offline, and proxy 503 issues,
 * presenting clear actionable messages rather than cryptic 'Failed to fetch'.
 */
export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit,
  contextMsg: string = 'data'
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    // Network failure / connection refused / backend offline
    throw new Error(
      'Unable to connect to backend server. Please verify that the RakshaSethu backend is running on http://127.0.0.1:8000.'
    );
  }

  if (!res.ok) {
    let errorDetail = '';
    try {
      const data = await res.json();
      errorDetail = data.detail || data.error || '';
    } catch {
      // response not JSON
    }

    if (res.status === 503) {
      throw new Error(
        `Unable to connect to backend server (HTTP 503 Service Unavailable). ${errorDetail || 'The backend service may be starting up or restarting.'}`
      );
    }
    if (res.status === 404) {
      throw new Error(errorDetail || `Resource not found (HTTP 404) while loading ${contextMsg}.`);
    }
    throw new Error(
      errorDetail ? `${errorDetail} (HTTP ${res.status})` : `Failed to load ${contextMsg}: HTTP ${res.status}`
    );
  }

  return res.json();
}

// ==========================================
// Phase 1: GIS & Demographics APIs
// ==========================================

export async function fetchDistrictsGeoJson(stateId?: string): Promise<GeoJsonFeatureCollection<DistrictProperties>> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/gis/districts?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'district boundaries'
  );
}

export async function fetchMandalsGeoJson(districtId?: string, stateId?: string): Promise<GeoJsonFeatureCollection<MandalProperties>> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  return apiRequest(
    `${API_BASE}/gis/mandals?${params.toString()}`,
    undefined,
    'sub-district boundaries'
  );
}

export async function fetchDemographicsSummary(stateId?: string): Promise<StateDemographicSummary> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/demographics/summary?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'demographic summary'
  );
}

export async function fetchDistrictDemographics(districtId: string, stateId?: string): Promise<DistrictDetailResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/demographics/district/${encodeURIComponent(districtId)}?state_id=${encodeURIComponent(sid)}`,
    undefined,
    `demographics for district ${districtId}`
  );
}

export async function fetchMandalVillages(
  mandalId: string,
  districtId?: string,
  stateId?: string
): Promise<MandalVillageListResponse> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  return apiRequest(
    `${API_BASE}/demographics/mandal/${encodeURIComponent(mandalId)}/villages?${params.toString()}`,
    undefined,
    `villages for mandal ${mandalId}`
  );
}

// ==========================================
// Phase 2: Hazard & Vulnerability APIs
// ==========================================

export async function fetchVulnerabilitySummary(stateId?: string): Promise<import('../types/vulnerability').VulnerabilitySummaryResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/vulnerability/summary?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'vulnerability summary'
  );
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
  return apiRequest(
    `${API_BASE}/vulnerability/mandals?${params.toString()}`,
    undefined,
    'sub-district vulnerability list'
  );
}

export async function fetchMandalVulnerability(mandalId: string, stateId?: string): Promise<import('../types/vulnerability').MandalVulnerabilityItem> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/vulnerability/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`,
    undefined,
    `vulnerability for ${mandalId}`
  );
}

export async function fetchMandalHazard(mandalId: string, stateId?: string): Promise<import('../types/hazard').MandalHazardItem | import('../types/hazard').MandalHazardExposureItem> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/hazard/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`,
    undefined,
    `hazard for ${mandalId}`
  );
}

export async function fetchVulnerabilityGeoJson(districtId?: string, stateId?: string): Promise<GeoJsonFeatureCollection<import('../types/vulnerability').MandalVulnerabilityItem>> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  return apiRequest(
    `${API_BASE}/vulnerability/geojson?${params.toString()}`,
    undefined,
    'vulnerability geojson'
  );
}

// ==========================================
// Phase 3: Capacity & Host Zone APIs
// ==========================================

export async function fetchCapacitySummary(stateId?: string): Promise<import('../types/capacity').CapacitySummaryResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/capacity/summary?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'capacity summary'
  );
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
  return apiRequest(
    `${API_BASE}/capacity/mandals?${params.toString()}`,
    undefined,
    'sub-district capacity list'
  );
}

export async function fetchMandalCapacity(mandalId: string, stateId?: string): Promise<import('../types/capacity').MandalCapacityItem> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/capacity/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`,
    undefined,
    `capacity for ${mandalId}`
  );
}

export async function fetchCapacityGeoJson(districtId?: string, stateId?: string): Promise<GeoJsonFeatureCollection<import('../types/capacity').MandalCapacityItem>> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  return apiRequest(
    `${API_BASE}/capacity/geojson?${params.toString()}`,
    undefined,
    'capacity geojson'
  );
}

export async function fetchCapacityAdequacySummary(stateId?: string): Promise<import('../types/capacity').CapacityAdequacySummaryResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/capacity/adequacy/summary?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'capacity adequacy summary'
  );
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
  return apiRequest(
    `${API_BASE}/capacity/adequacy/mandals?${params.toString()}`,
    undefined,
    'capacity adequacy list'
  );
}

export async function fetchMandalAdequacyDetail(mandalId: string, stateId?: string): Promise<import('../types/capacity').MandalCapacityAdequacyItem> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/capacity/adequacy/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`,
    undefined,
    `adequacy for ${mandalId}`
  );
}

export async function fetchHostZones(mandalId: string, stateId?: string): Promise<import('../types/capacity').HostZoneCandidateListResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/capacity/host-zones/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`,
    undefined,
    `host zones for ${mandalId}`
  );
}

// ==========================================
// Phase 4: Relocation Prioritization APIs
// ==========================================

export async function fetchRelocationSummary(stateId?: string): Promise<import('../types/relocation').RelocationSummaryResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/relocation/summary?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'relocation summary'
  );
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
  return apiRequest(
    `${API_BASE}/relocation/mandals?${params.toString()}`,
    undefined,
    'relocation list'
  );
}

export async function fetchTopRelocationMandals(limit: number = 10, stateId?: string): Promise<import('../types/relocation').TopRelocationListResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/relocation/top?limit=${limit}&state_id=${encodeURIComponent(sid)}`,
    undefined,
    'top relocation records'
  );
}

export async function fetchMandalRelocationDetail(mandalId: string, stateId?: string): Promise<import('../types/relocation').MandalRelocationItem> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/relocation/mandal/${encodeURIComponent(mandalId)}?state_id=${encodeURIComponent(sid)}`,
    undefined,
    `relocation detail for ${mandalId}`
  );
}

export async function fetchAHPWeights(stateId?: string): Promise<import('../types/relocation').AHPWeightsResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/relocation/weights?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'AHP weights'
  );
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
  return apiRequest(
    `${API_BASE}/relocation/factors?${params.toString()}`,
    undefined,
    'relocation factors'
  );
}

export async function fetchRelocationGeoJson(districtId?: string, stateId?: string): Promise<GeoJsonFeatureCollection<import('../types/relocation').MandalRelocationItem>> {
  const sid = resolveState(stateId);
  const params = new URLSearchParams();
  params.append('state_id', sid);
  if (districtId) params.append('district_id', districtId);
  return apiRequest(
    `${API_BASE}/relocation/geojson?${params.toString()}`,
    undefined,
    'relocation geojson'
  );
}

// ==========================================
// Phase 5: What-If Disaster Simulation APIs
// ==========================================

export async function fetchSimulationPresets(stateId?: string): Promise<import('../types/simulation').SimulationPresetsResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/simulation/presets?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'simulation presets'
  );
}

export async function runWhatIfSimulation(
  params: import('../types/simulation').SimulationParameters,
  stateId?: string
): Promise<import('../types/simulation').SimulationRunResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/simulation/run?state_id=${encodeURIComponent(sid)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'What-If simulation'
  );
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

  return apiRequest(
    `${API_BASE}/simulation/mandal/${encodeURIComponent(mandalId)}?${query.toString()}`,
    undefined,
    `sub-district simulation for ${mandalId}`
  );
}

// ==========================================
// Phase 6: Decision & Action Planning APIs
// ==========================================

export async function fetchDecisionSummary(stateId?: string): Promise<import('../types/decision').ActionDashboardSummary> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/decision/summary?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'decision summary'
  );
}

export async function fetchCapacityGap(mandalId: string, stateId?: string): Promise<import('../types/decision').CapacityGapAssessment> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/decision/mandal/${encodeURIComponent(mandalId)}/capacity-gap?state_id=${encodeURIComponent(sid)}`,
    undefined,
    `capacity gap for ${mandalId}`
  );
}

export async function fetchActionPlan(mandalId: string, stateId?: string): Promise<import('../types/decision').ActionPlanResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/decision/mandal/${encodeURIComponent(mandalId)}/action-plan?state_id=${encodeURIComponent(sid)}`,
    undefined,
    `action plan for ${mandalId}`
  );
}

export async function fetchSourceHostComparison(
  sourceId: string,
  hostId: string,
  stateId?: string
): Promise<import('../types/decision').SourceHostComparisonResponse> {
  const sid = resolveState(stateId);
  return apiRequest(
    `${API_BASE}/decision/mandal/${encodeURIComponent(sourceId)}/compare/${encodeURIComponent(hostId)}?state_id=${encodeURIComponent(sid)}`,
    undefined,
    'source-host comparison'
  );
}

// ==========================================
// Village-Level Spatial Hazard APIs
// ==========================================

export async function fetchVillageSummary(
  villageCode: number,
  disasterType: string = 'all',
  signal?: AbortSignal
): Promise<import('../types/village').VillageHazardResponse> {
  return apiRequest(
    `${API_BASE}/village/${encodeURIComponent(villageCode)}?disaster_type=${encodeURIComponent(disasterType)}`,
    { signal },
    `village summary for code ${villageCode}`
  );
}

export async function fetchVillageGeometry(
  villageCode: number,
  signal?: AbortSignal
): Promise<import('../types/village').VillageGeometryResponse> {
  return apiRequest(
    `${API_BASE}/village/${encodeURIComponent(villageCode)}/geometry`,
    { signal },
    `village geometry for code ${villageCode}`
  );
}

export async function fetchVillageHazards(
  villageCode: number,
  disasterType: string = 'all',
  signal?: AbortSignal
): Promise<import('../types/village').VillageHazardResponse> {
  return apiRequest(
    `${API_BASE}/village/${encodeURIComponent(villageCode)}/hazards?disaster_type=${encodeURIComponent(disasterType)}`,
    { signal },
    `village hazards for code ${villageCode}`
  );
}

export async function fetchVillageScenario(
  villageCode: number,
  increase: number = 0.0
): Promise<import('../types/village').VillageScenarioResponse> {
  return apiRequest(
    `${API_BASE}/village/${encodeURIComponent(villageCode)}/scenario?increase=${encodeURIComponent(increase)}`,
    undefined,
    `village scenario for code ${villageCode}`
  );
}

export async function fetchVillageRelocationCenters(
  villageCode: number,
  limit: number = 5,
  intensity: 'low' | 'high' | 'very_high' = 'high',
  sector?: string | null,
  disasterType: string = 'all',
  signal?: AbortSignal
): Promise<import('../types/village').VillageRelocationResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    intensity,
    disaster_type: disasterType,
  });
  if (sector) {
    params.set('sector', sector);
  }
  return apiRequest(
    `${API_BASE}/village/${encodeURIComponent(villageCode)}/relocation-centers?${params.toString()}`,
    { signal },
    `relocation centers for village ${villageCode}`
  );
}

export async function checkBackendHealth(): Promise<{ status: string; healthy: boolean; supported_states?: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      return { status: data.status || 'healthy', healthy: true, supported_states: data.supported_states };
    }
  } catch {
    // offline
  }
  return { status: 'unreachable', healthy: false };
}

export async function fetchVillagePois(
  villageCode: number,
  radiusKm: number = 3.0,
  disasterType: string = 'all',
  signal?: AbortSignal
): Promise<import('../types/village').VillagePoiResponse> {
  const params = new URLSearchParams({
    radius_km: String(radiusKm),
    disaster_type: disasterType,
  });
  return apiRequest(
    `${API_BASE}/village/${encodeURIComponent(villageCode)}/pois?${params.toString()}`,
    { signal },
    `POIs for village ${villageCode}`
  );
}

