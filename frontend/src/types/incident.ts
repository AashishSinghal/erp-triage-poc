export const ErpModule = {
  AP: 'AP',
  AR: 'AR',
  GL: 'GL',
  INVENTORY: 'INVENTORY',
  HR: 'HR',
  PAYROLL: 'PAYROLL',
} as const
export type ErpModule = (typeof ErpModule)[keyof typeof ErpModule]

export const Environment = {
  PROD: 'PROD',
  TEST: 'TEST',
} as const
export type Environment = (typeof Environment)[keyof typeof Environment]

export const IncidentStatus = {
  PENDING: 'PENDING',
  ENRICHED: 'ENRICHED',
  FAILED: 'FAILED',
} as const
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus]

export const Severity = {
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
} as const
export type Severity = (typeof Severity)[keyof typeof Severity]

export const IncidentCategory = {
  CONFIGURATION: 'CONFIGURATION',
  DATA: 'DATA',
  INTEGRATION: 'INTEGRATION',
  SECURITY: 'SECURITY',
  UNKNOWN: 'UNKNOWN',
} as const
export type IncidentCategory = (typeof IncidentCategory)[keyof typeof IncidentCategory]

export type Incident = {
  id: string;
  title: string;
  description: string;
  erpModule: ErpModule;
  environment: Environment;
  businessUnit?: string;
  status: IncidentStatus;
  severity?: Severity;
  category?: IncidentCategory;
  summary?: string;
  suggestion?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateIncidentInput = {
  title: string;
  description: string;
  erpModule: ErpModule;
  environment: Environment;
  businessUnit?: string;
};

export type IncidentListResponse = {
  items: Incident[];
  nextToken?: string;
};
