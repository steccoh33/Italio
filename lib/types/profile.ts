export type UserRole = "admin" | "teacher" | "student";
export type UserStatus = "pending" | "active" | "paused";

export type AdminTeacherRow = {
  id: string;
  full_name: string | null;
  status: UserStatus;
  teacher_code: string | null;
  login_code: string;
  created_at: string;
  student_count: number;
};
