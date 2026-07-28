import { RoleSTS } from "./enum";

export interface User {
  id: string;
  email: string;
  password: string;
  role: RoleSTS;
  name: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  role: RoleSTS;
  name?: string;
  phone?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  role?: RoleSTS;
  name?: string;
  phone?: string;
  isActive?: boolean;
}
