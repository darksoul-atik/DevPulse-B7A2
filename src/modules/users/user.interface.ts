import type { ROLES } from "../../types/index.js";

export interface IUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: ROLES;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: ROLES;
}

export interface TSafeUser {
  id: number;
  name: string;
  email: string;
  role: ROLES;
  created_at: Date;
  updated_at: Date;
}

export interface IReporter {
  id: number;
  name: string;
  role: ROLES;
}