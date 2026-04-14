export type ColumnType = 'datetime' | 'number' | 'string' | 'boolean' | 'telecom_number' | 'currency' | 'duration' | 'pdd' | 'sip_code' | 'unknown';

export interface ColumnProfile {
  name: string;
  originalName: string;
  type: ColumnType;
  nullRate: number;
  uniqueValues: number;
  sampleValues: any[];
  semanticMatch: string | null;
}

export interface FileProfile {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  richnessScore: number;
  encoding: string;
  delimiter: string;
  timeRange: { start: string; end: string } | null;
  datasetType: 'attempts' | 'billed' | 'mixed';
  inconsistencies: string[];
}

export interface MetricFamily {
  name: string;
  baseWeight: number;
  appliedWeight: number;
  score: number;
  available: boolean;
}

export interface AdaptiveScore {
  finalScore: number;
  classification: 'EXCELENTE' | 'BOA' | 'REGULAR' | 'RUIM' | 'CRÍTICA' | 'INCONCLUSIVA';
  confidence: number;
  families: MetricFamily[];
  explanation: string;
}

export interface TopicDashboard {
  id: string;
  name: string;
  available: boolean;
  kpis: { label: string; value: string | number; subValue?: string; status?: 'success' | 'warning' | 'error' | 'info' }[];
  insights: string[];
}

export interface AnalysisResults {
  profile: FileProfile;
  topics: TopicDashboard[];
  score: AdaptiveScore;
  data: any[]; // Normalized data
  dictionary: Record<string, string>;
}
