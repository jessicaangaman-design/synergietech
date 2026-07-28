export interface Client {
  id: string;
  name: string;
  companyName: string | null;
  phone: string;
  email: string | null;
  address: string;
  prospectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  address: string;
  prospectId?: string;
}

export type UpdateClientDto = Partial<CreateClientDto>;
