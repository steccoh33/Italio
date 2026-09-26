import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY } from "@/lib/legal/legal-content";

export const metadata = { title: "Política de Privacidad — Italio" };

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
