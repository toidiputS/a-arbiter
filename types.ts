export interface ArbiterState {
  history: string;
  contractText: string;
  fileName: string | null;
}

export interface AnalysisResponse {
  text: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}