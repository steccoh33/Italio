export type UserRole = "admin" | "teacher" | "student";
export type UserStatus = "pending" | "active" | "paused";
export type CilsLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type AdminTeacherRow = {
  id: string;
  full_name: string | null;
  status: UserStatus;
  teacher_code: string | null;
  login_code: string;
  created_at: string;
  student_count: number;
};

export type TeacherStudentRow = {
  id: string;
  full_name: string | null;
  status: UserStatus;
  login_code: string;
  created_at: string;
  target_level: CilsLevel;
};
