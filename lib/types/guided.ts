import type { CilsLevel } from "@/lib/types/profile";
import type { WritingWithCorrection } from "@/lib/types/writing";

export type GuidedSessionRow = {
  id: string;
  target_level: CilsLevel;
  prompt_text: string;
  plan_summary: string | null;
  status: "in_progress" | "completed";
  created_at: string;
  completed_at: string | null;
  /** El texto final corregido de esta sesión. */
  writing: WritingWithCorrection;
};
