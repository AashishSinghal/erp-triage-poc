import {
  Environment,
  ErpModule,
  IncidentCategory,
  IncidentStatus,
  Severity,
} from '../dto/incident.enums';

export class IncidentEntity {
  id: string;
  title: string;
  description: string;
  erpModule: ErpModule;
  environment: Environment;
  businessUnit?: string;
  status: IncidentStatus;
  severity?: Severity;
  category?: IncidentCategory;
  createdAt: string;
  updatedAt: string;
}
