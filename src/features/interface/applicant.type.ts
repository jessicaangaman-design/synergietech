import { ApplyStatus, TypeApplicant } from "./enum";

export interface Applicant {
  id: string;
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  type: TypeApplicant;
  statut: ApplyStatus;
  yearsOfExist: string;
  description: string;
  resumeUrl: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type UpdateApplicantDto = Partial<
  Pick<
    Applicant,
    | "companyName"
    | "fullName"
    | "email"
    | "phone"
    | "type"
    | "statut"
    | "yearsOfExist"
    | "description"
    | "resumeUrl"
  >
>;
