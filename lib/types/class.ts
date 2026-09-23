export type TeacherClassRow = {
  id: string;
  name: string;
  created_at: string;
  student_count: number;
};

export type ClassMemberRow = {
  id: string;
  full_name: string | null;
  isMember: boolean;
};
