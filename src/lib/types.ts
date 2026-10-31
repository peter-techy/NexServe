export type AppRole = "super_admin" | "hr" | "sales";
export type Department = "HR" | "Sales" | "Administration";
export type WorkStatus = "Followup" | "Done" | "Cancelled";
export type DealOutcome = "won" | "lost";
export type InquiryStatus = "new" | "in_review" | "resolved" | "spam";

export const ROLES: AppRole[] = ["super_admin", "hr", "sales"];
export const DEPARTMENTS: Department[] = ["HR", "Sales", "Administration"];
export const WORK_STATUSES: WorkStatus[] = ["Followup", "Done", "Cancelled"];
export const CRITERIA = ["Digital Marketing", "Content Creation", "Special Demand"] as const;
export type Criterion = (typeof CRITERIA)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  hr: "HR",
  sales: "Sales",
};

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  Followup: "Followup",
  Done: "Done",
  Cancelled: "Cancelled",
};

export interface Profile {
  id: string;
  auth_user_id: string;
  employee_id: string;
  full_name: string;
  department: Department;
  role: AppRole;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  person_name: string;
  business_name: string;
  location: string;
  client_number: string | null;
  created_by: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface ClientActivity {
  id: string;
  client_id: string;
  employee_id: string;
  contact_date: string;
  contact_source: string;
  contact_source_other: string | null;
  client_review: string;
  notes: string | null;
  work_status: WorkStatus;
  criteria: Criterion[];
  criteria_description: string | null;
  special_demand_description: string | null;
  follow_up_required: boolean;
  follow_up_at: string | null;
  follow_up_notes: string | null;
  follow_up_completed_at: string | null;
  deal_outcome: DealOutcome | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface AttendanceSession {
  id: string;
  employee_id: string;
  check_in_at: string;
  check_out_at: string | null;
  duration_seconds: number | null;
  corrected: boolean;
  created_at: string;
  updated_at: string;
}

export interface Metrics {
  clients_contacted: number;
  activities_count: number;
  followups_pending: number;
  followups_overdue: number;
  deals_won: number;
  work_seconds: number;
  open_sessions: number;
}

export interface DailySummaryRow {
  employee_uuid: string;
  employee_code: string;
  employee_name: string;
  department: Department;
  work_date: string;
  clients_contacted: number;
  activities_count: number;
  followups_pending: number;
  deals_done: number;
  work_seconds: number;
}

export interface ServiceItem {
  title: string;
  description: string;
}

export interface AppSettings {
  company_name: string;
  company_tagline: string;
  business_timezone: string;
  deal_rule: "deal_outcome" | "status_done";
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  company_description: string;
  mission: string;
  vision: string;
  services: ServiceItem[];
  what_we_provide: string[];
}

export interface ContactSource {
  id: number;
  label: string;
  is_active: boolean;
  sort_order: number;
}

export const JOB_POSITIONS = ["Sales Executive", "Others"] as const;
export type JobPosition = (typeof JOB_POSITIONS)[number];

export type ApplicationStatus = "new" | "screening" | "interview" | "offered" | "rejected" | "hired";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "new",
  "screening",
  "interview",
  "offered",
  "rejected",
  "hired",
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  screening: "Screening",
  interview: "Interview",
  offered: "Offered",
  rejected: "Rejected",
  hired: "Hired",
};

export interface JobApplication {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  current_city: string;
  institution_or_employer: string;
  educational_qualification: string;
  relevant_experience: string;
  skills: string;
  resume_name?: string | null;
  resume_data?: string | null;
  position_applied: string;
  availability: string;
  linkedin_url?: string | null;
  why_join: string;
  status: ApplicationStatus;
  hr_notes?: string | null;
  created_at: string;
  updated_at: string;
}

/** Standard result shape for server actions used with useActionState. */
export interface ActionState {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string | string[]>;
}
