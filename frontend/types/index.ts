// TypeScript types — mirror Spring Boot DTOs

export type RoleType = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

export interface AuthResponse {
  email: string;
  role: RoleType;
  employeeId?: string;
  profileCompleted?: boolean;
}

export interface UserSession {
  email: string;
  role: RoleType;
  employeeId?: string;
  profileCompleted?: boolean;
}

export type AttendanceStatus = 'PENDING' | 'ON_TIME' | 'LATE' | 'INSUFFICIENT' | 'ABSENT' | 'APPROVED' | 'DAY_OFF';
export type ApologyStatus   = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EmpStatus       = 'ACTIVE' | 'INACTIVE' | 'CONTRACT' | 'PROBATION' | 'COLLABORATOR';
export type ContractType    = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'PROBATION' | 'COLLABORATOR';
export type LeaveType       = 'ANNUAL' | 'OT_LEAVE' | 'SICK' | 'UNPAID' | 'HALF_DAY_AM' | 'HALF_DAY_PM';
export type OTStatus        = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Department {
  id: string;
  name: string;
}

export interface Position {
  id: string;
  name: string;
  description?: string;
  isLocked: boolean;
  multiPerDept?: boolean;
  standalone?: boolean;
}

export interface Employee {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  bio?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate?: string;
  status: EmpStatus;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  departmentId?: string;
  departmentName?: string;
  positionId?: string;
  positionName?: string;
  managerId?: string;
  managerName?: string;
  baseSalary?: number | null;
  taxDependents?: number | null;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  status: AttendanceStatus;
  note?: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName?: string;
  month: number;
  year: number;
  baseSalary: number;
  standardDays: number;
  actualDays: number;
  otHours: number;
  otAmount: number;
  allowance: number;
  grossSalary: number;
  bhxh?: number;
  bhyt?: number;
  bhtn?: number;
  taxableIncome: number;
  incomeTax: number;
  netSalary: number;
  note?: string;
}

export interface CompanyConfig {
  id: string;
  workStartTime: string;
  workEndTime: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  earlyCheckinMinutes: number;
  standardHours: number;
  standardDaysPerMonth: number;
  cutoffDay: number;
  otRateWeekday: number;
  otRateWeekend: number;
  otRateHoliday: number;
  otRateHolidayComp: number;
  halfDayMorningRate: number;
  halfDayAfternoonRate: number;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface Apology {
  id: string;
  employeeId: string;
  employeeName?: string;
  attendanceId: string;
  attendanceDate: string;
  type: 'LATE' | 'FORGOT_CHECKIN' | 'FORGOT_CHECK_OUT' | 'INSUFFICIENT_HOURS';
  reason: string;
  fileUrl?: string;
  status: ApologyStatus;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewNote?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: ApologyStatus;
  reviewedBy?: string;
  reviewerEmail?: string;
}

export interface OTRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  reason?: string;
  status: OTStatus;
  createdAt: string;
}

export interface DashboardSummary {
  today: string;
  todayAttendanceStatus?: AttendanceStatus;
  todayCheckIn?: string;
  todayCheckOut?: string;
  myPendingApologies: number;
  myPendingLeaveRequests: number;
  pendingApologiesToReview: number;
  pendingLeaveRequestsToReview: number;
  cutoffDay?: number;
}

export interface ChatMessageRequest {
  message: string;
  month?: number;
  year?: number;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatMessageResponse {
  message: string;
  toolName?: string | null;
  toolResult?: Record<string, unknown> | null;
  timestamp?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}
