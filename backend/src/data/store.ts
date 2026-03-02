import type { AttendanceRecord, Program, User, Youth } from '../types/models';

export const users: User[] = [
  { id: 'u1', email: 'admin@youthblossom.org', name: 'Admin User', password: 'admin123', role: 'admin' },
];

export const youths: Youth[] = [];
export const programs: Program[] = [];
export const attendanceRecords: AttendanceRecord[] = [];
