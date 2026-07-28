import { TypeApplicant } from "./enum";

export interface ServiceProvider {
  id: string;
  companyName: string;
  name: string;
  emailCompany: string;
  serviceType: TypeApplicant;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
}
