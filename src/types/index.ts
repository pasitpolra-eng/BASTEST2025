/**
 * Global type definitions
 */

export type RepairStatus = "pending" | "in-progress" | "completed" | "rejected";

export interface RepairRequest {
  id: string;
  job_id: string;
  full_name: string;
  dept_name?: string;
  dept_building?: string;
  dept_floor?: string;
  device: string;
  device_id: string;
  issue: string;
  phone?: string;
  notes?: string;
  // IP address of the machine submitting the request (may be unknown)
  request_ip?: string | null;
  status: RepairStatus;
  receipt_no?: string | null;
  reject_reason?: string | null;
  handler_id?: string;
  handler_tag?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = unknown> {
  ok?: boolean;
  error?: string;
  data?: T;
  message?: string;
}

export interface UpdateReportRequest {
  jobId: string;
  status?: RepairStatus;
  receiptNo?: string | null;
  reason?: string | null;
  name?: string;
  phone?: string;
  device?: string;
  notes?: string;
}

export interface CreateReportRequest {
  fullName: string;
  deptName?: string;
  deptBuilding?: string;
  deptFloor?: string;
  device: string;
  deviceId: string;
  issue: string;
  phone?: string;
  notes?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  error?: string;
}

export interface ExportFormat {
  format: "csv" | "json";
  status?: RepairStatus | "all";
}

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}
