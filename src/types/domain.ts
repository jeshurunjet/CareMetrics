export type Role = "manager" | "employee";
export type Status = "active" | "inactive" | "on-leave" | "archived";
export interface Employee { id: string; name: string; email: string; phone: string; role: string; house: string; status: Status; availability: string[]; }
export interface Client { id: string; name: string; house: string; status: "active" | "inactive"; supportLevel: string; }
export interface House { id: string; name: string; address: string; status: "active" | "inactive"; employeeIds: string[]; clientIds: string[]; }
export interface Shift { id: string; employeeId?: string; houseId: string; date: string; start: string; end: string; status: "scheduled" | "unassigned" | "cancelled"; notes?: string; }
export interface AttendanceRecord { id: string; employeeId: string; shiftId: string; clockIn?: string; clockOut?: string; status: "normal" | "late" | "missing-in" | "missing-out" | "exception" | "resolved"; managerNote?: string; }
export interface LeaveRequest { id: string; employeeId: string; type: string; start: string; end: string; note: string; status: "pending" | "approved" | "declined"; }
export type CareFieldType = "text" | "long-text" | "number" | "date" | "time" | "yes-no" | "single-choice" | "multiple-choice" | "dropdown" | "rating";
export interface CareTemplateField { id: string; label: string; type: CareFieldType; required: boolean; options?: string[]; }
export interface CareTemplate { id: string; name: string; description: string; version: number; status: "active" | "draft" | "archived"; fields: CareTemplateField[]; }
export interface CareRecord { id: string; clientId: string; templateId: string; templateVersion: number; recordedBy: string; recordedAt: string; values: Record<string, string | number | boolean | string[]>; notes?: string; status: "complete" | "flagged"; }
export interface Notification { id: string; title: string; type: "attendance" | "roster" | "leave" | "care" | "system"; priority: "low" | "normal" | "high"; read: boolean; href?: string; }
