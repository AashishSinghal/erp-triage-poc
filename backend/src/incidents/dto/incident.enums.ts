export enum ErpModule {
  AP = 'AP',
  AR = 'AR',
  GL = 'GL',
  INVENTORY = 'INVENTORY',
  HR = 'HR',
  PAYROLL = 'PAYROLL',
}

export enum Environment {
  PROD = 'PROD',
  TEST = 'TEST',
}

export enum IncidentStatus {
  PENDING = 'PENDING',
  ENRICHED = 'ENRICHED',
  FAILED = 'FAILED',
}

export enum Severity {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

export enum IncidentCategory {
  CONFIGURATION = 'CONFIGURATION',
  DATA = 'DATA',
  INTEGRATION = 'INTEGRATION',
  SECURITY = 'SECURITY',
  UNKNOWN = 'UNKNOWN',
}
