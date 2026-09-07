export type ActiveTab = 
  | 'gis'
  | 'dashboard'
  | 'hazard'
  | 'vulnerability'
  | 'capacity'
  | 'relocation'
  | 'priority_directory'
  | 'hosts'
  | 'simulation'
  | 'actions'
  | 'data'
  | 'methodology'
  | 'village';



export interface HealthResponse {
  status: string;
  project: string;
  sih_problem: string;
  version: string;
  phase: string;
  pilot_state: string;
  timestamp: string;
}
