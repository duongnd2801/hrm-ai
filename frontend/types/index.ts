// TypeScript types — mirror Spring Boot DTOs

export type RoleType = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

export interface AuthResponse {
  email: string;
  role: RoleType;
  employeeId?: string;
  profileCompleted?: boolean;
  permissions: string[];
}

export interface UserSession {
  email: string;
  role: RoleType;
  employeeId?: string;
  profileCompleted?: boolean;
  permissions: string[];
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
  role?: RoleType;
  baseSalary?: number | null;
  taxDependents?: number | null;

  // Nhóm HĐ mở rộng
  manager2Id?: string;
  manager2Name?: string;
  joinDate?: string;
  contractSigningDate?: string;

  // Nhóm Cá nhân mở rộng
  personalEmail?: string;
  citizenId?: string;
  citizenIdDate?: string;
  citizenIdPlace?: string;

  // Nhóm Người thân liên hệ
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;

  // Nhóm Trình độ
  programmingLanguages?: string;
  major?: string;
  university?: string;
  educationLevel?: string;
  graduationYear?: number;
  itCertificate?: string;
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

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  onTimeCount: number;
  lateCount: number;
  insufficientCount: number;
  absentCount: number;
  approvedCount: number;
  dayOffCount: number;
  totalWorkHours: number;
  totalWorkDays: number;
}

export interface TeamMatrix {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  dailyStatus: Record<number, AttendanceStatus>;
  dailyHours: Record<number, number>;
  totalWorkHours: number;
  totalWorkDays: number;
  paidDays: number;
  lateCount: number;
  absentCount: number;
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

export interface LeaveRequestDTO {
  id: string;
  employeeId: string;
  employeeName?: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: ApologyStatus;
  reviewNote?: string;
  reviewedByName?: string;
  createdAt?: string;
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

export type ProjectStatus = 'ACTIVE' | 'OVERDUE' | 'COMPLETED' | 'ON_HOLD';
export type ProjectType = 'PRODUCT_DEVELOPMENT' | 'OUTSOURCING' | 'INTERNAL' | 'MAINTENANCE';
export type ProjectRole = 'PM' | 'DEV' | 'QA' | 'TESTER' | 'BA' | 'DESIGNER' | 'COMTER' | 'GUEST';

export interface Project {
  id: string;
  name: string;
  code: string;
  color?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  type: ProjectType;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  employeeAvatar?: string;
  role: ProjectRole;
  joinedAt?: string;
  leftAt?: string;
}

export interface EmployeeProject {
  projectId: string;
  projectName: string;
  projectCode: string;
  projectColor?: string;
  projectStatus: ProjectStatus;
  projectType: ProjectType;
  role: ProjectRole;
  joinedAt?: string;
  leftAt?: string;
}


export interface RoleDTO {
  id?: string;
  name: string;
  description?: string;
  permissions: string[]; // List of codes
  createdAt?: string;
}

export interface PermissionDTO {
  id?: string;
  name: string;
  code: string;
  module: string;
}
