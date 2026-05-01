export type ApplicationStatus =
  | "APPLIED"
  | "ASSESSMENT"
  | "INTERVIEW"
  | "REJECTED"
  | "OFFERED"
  | "GHOSTED";

export type JobType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP";

export interface CompanyDto {
  id: number;
  name: string;
  website: string;
  industry: string;
}

export interface JobDto {
  id: number;
  title: string;
  description: string;
  location: string;
  jobType: JobType;
  externalUrl: string;
  salaryMin: number | null;
  salaryMax: number | null;
  company: CompanyDto;
}

export interface ApplicationDto {
  id: number;
  source: string;
  coverLetter: string;
  userId: number;
  job: JobDto;
  status: ApplicationStatus;
  notes: string;
  lastUpdated: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface CompanyCreateRequest {
  name: string;
  website?: string;
  industry?: string;
}

export interface JobCreateRequest {
  title: string;
  description: string;
  location?: string;
  jobType: JobType;
  externalUrl: string;
  salaryMin?: number;
  salaryMax?: number;
}

export interface ApplicationCreateRequest {
  source: string;
  coverLetter?: string;
  company: CompanyCreateRequest;
  job: JobCreateRequest;
  notes?: string;
}

export interface ApiKeyResponse {
  id: number;
  name: string;
  rawKey: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}
