export type ActiveTab = 
  | 'gis'
  | 'dashboard'
  | 'hazard'
  | 'vulnerability'
  | 'capacity'
  | 'relocation'
  | 'hosts'
  | 'simulation'
  | 'actions'
  | 'data'
  | 'methodology';



export interface HealthResponse {
  status: string;
  project: string;
  sih_problem: string;
  version: string;
  phase: string;
  pilot_state: string;
  timestamp: string;
}
