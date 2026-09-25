export type AssignmentRow = {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  instructions: string;
  due_date: string | null;
  created_at: string;
};

/** Tarea vista por el alumno: incluye de qué clase es y si ya la entregó. */
export type StudentAssignmentRow = AssignmentRow & {
  class_name: string;
  delivered: boolean;
};

/** Tarea vista en la lista del profesor, con el resumen de entregas. */
export type AssignmentSummaryRow = {
  id: string;
  title: string;
  due_date: string | null;
  delivered: number;
  total: number;
};
