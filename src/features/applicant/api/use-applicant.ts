import useSWR, { useSWRConfig } from "swr";

import { ApplyStatus } from "@/features/interface/enum";
import type { Applicant, UpdateApplicantDto } from "@/features/interface/applicant.type";
import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";

interface ApplicantsEnvelope {
  success?: boolean;
  message?: string;
  data: Applicant[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

type ApplicantsResponse = Applicant[] | ApplicantsEnvelope;
type ApplicantResponse = Applicant | { data: Applicant };

function extractApplicants(response?: ApplicantsResponse): Applicant[] {
  if (!response) return [];
  return Array.isArray(response) ? response : response.data;
}

function extractApplicant(response: ApplicantResponse): Applicant {
  return "data" in response ? response.data : response;
}

export function useApplicants() {
  const { data, error, mutate, isLoading } = useSWR<ApplicantsResponse>(
    apiEndpoints.applicants,
    apiRequest,
  );

  const envelope = data && !Array.isArray(data) ? data : null;

  return {
    applicants: extractApplicants(data),
    pagination: envelope
      ? {
          page: envelope.page ?? 1,
          limit: envelope.limit ?? envelope.data.length,
          total: envelope.total ?? envelope.data.length,
          totalPages: envelope.totalPages ?? 1,
        }
      : null,
    error,
    mutate,
    isLoading,
  };
}

export function useApplicant(id?: string) {
  const { data, error, mutate, isLoading } = useSWR<ApplicantResponse | null>(
    id ? apiEndpoints.applicantId(id) : null,
    apiRequest,
  );

  return {
    applicant: data ? extractApplicant(data) : null,
    error,
    mutate,
    isLoading,
  };
}

export function useApplicantActions() {
  const { mutate } = useSWRConfig();

  const refresh = (id?: string) =>
    Promise.all([
      mutate(apiEndpoints.applicants),
      id ? mutate(apiEndpoints.applicantId(id)) : Promise.resolve(),
      mutate(apiEndpoints.allUser),
    ]);

  return {
    validateApplicant: async (id: string, statut: ApplyStatus) => {
      await apiRequest(apiEndpoints.validateApplicant(id), {
        method: "PUT",
        body: { statut },
      });
      await refresh(id);
    },
    updateApplicant: async (id: string, patch: UpdateApplicantDto) => {
      const response = await apiRequest<ApplicantResponse>(apiEndpoints.updateApplicant(id), {
        method: "PUT",
        body: patch,
      });
      await refresh(id);
      return extractApplicant(response);
    },
    removeApplicant: async (id: string) => {
      await apiRequest<void>(apiEndpoints.deleteApplicant(id), { method: "DELETE" });
      await refresh();
    },
  };
}
