import { LegalPage } from "@/components/legal/legal-page";
import { TERMS } from "@/lib/legal/legal-content";

export const metadata = { title: "Términos y Condiciones — Italio" };

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}
