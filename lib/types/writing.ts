import type { CilsLevel } from "@/lib/types/profile";

export type WritingStatus = "pending" | "corrected" | "error";
export type LevelVerdict = "below" | "at" | "above";

export type CorrectionErrorItem = {
  fragmento: string;
  correzione: string;
  tipo: string;
  spiegazione: string;
};

export type AssessmentDimension = {
  voto: number;
  commento: string;
};

export type Assessment = {
  adeguatezza: AssessmentDimension;
  morfosintassi: AssessmentDimension;
  lessico: AssessmentDimension;
  coesione: AssessmentDimension;
};

export type CorrectionPayload = {
  corrected_text: string;
  errors: CorrectionErrorItem[];
  assessment: Assessment;
  level_verdict: LevelVerdict;
  level_demonstrated: CilsLevel;
  general_comment: string;
};

export type WritingRow = {
  id: string;
  student_id: string;
  target_level: CilsLevel;
  prompt_text: string | null;
  content: string;
  status: WritingStatus;
  created_at: string;
};

export type CorrectionRow = CorrectionPayload & {
  writing_id: string;
  created_at: string;
};

export type WritingWithCorrection = WritingRow & {
  correction: CorrectionRow | null;
};
