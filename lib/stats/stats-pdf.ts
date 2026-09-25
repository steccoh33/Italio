import type { Report, Tone } from "@/lib/stats/report-model";

const AZUL: [number, number, number] = [31, 68, 224];
const ROJO: [number, number, number] = [255, 90, 54];
const VERDE: [number, number, number] = [16, 150, 105];
const TINTA: [number, number, number] = [23, 34, 60];
const GRIS: [number, number, number] = [91, 101, 127];
const TRACK: [number, number, number] = [234, 230, 217];

const PAGE_MARGIN = 16;
const PAGE_BOTTOM = 280;

function toneColor(tone: Tone): [number, number, number] {
  if (tone === "good") return VERDE;
  if (tone === "bad") return ROJO;
  if (tone === "same") return GRIS;
  return AZUL;
}

/**
 * Genera y descarga el informe en PDF, en el navegador. jsPDF se carga solo
 * al hacer clic. Solo se usan caracteres Latin-1 (las fuentes estándar del
 * PDF no tienen flechas): por eso el PDF expresa la tendencia con palabras.
 */
export async function downloadReportPdf(report: Report): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const contentWidth = width - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  const ensure = (height: number) => {
    if (y + height > PAGE_BOTTOM) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...AZUL);
  doc.text(report.brand, PAGE_MARGIN, y + 6);
  y += 12;
  doc.setFontSize(14);
  doc.setTextColor(...TINTA);
  doc.text(report.title, PAGE_MARGIN, y);
  y += 7;
  doc.setFontSize(13);
  doc.text(report.studentName, PAGE_MARGIN, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(report.levelLine, PAGE_MARGIN, y);
  y += 5;
  doc.text(report.dateLine, PAGE_MARGIN, y);
  y += 4;
  doc.setDrawColor(...AZUL);
  doc.setLineWidth(0.6);
  doc.line(PAGE_MARGIN, y, width - PAGE_MARGIN, y);
  y += 8;

  const heading = (text: string) => {
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...AZUL);
    doc.text(text, PAGE_MARGIN, y);
    y += 6;
  };

  for (const section of report.sections) {
    heading(section.heading);

    if (section.type === "cards") {
      const colWidth = contentWidth / 2;
      section.items.forEach((item, index) => {
        const col = index % 2;
        if (col === 0) ensure(13);
        const x = PAGE_MARGIN + col * colWidth;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...GRIS);
        doc.text(item.label, x, y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...TINTA);
        doc.text(item.value, x, y + 5.5);
        if (col === 1 || index === section.items.length - 1) y += 12;
      });
    }

    if (section.type === "text") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...TINTA);
      for (const line of section.lines) {
        const wrapped = doc.splitTextToSize(`- ${line}`, contentWidth) as string[];
        ensure(wrapped.length * 5 + 1);
        doc.text(wrapped, PAGE_MARGIN, y);
        y += wrapped.length * 5 + 1;
      }
    }

    if (section.type === "bars") {
      const labelWidth = 62;
      const barWidth = 70;
      if (section.items.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...GRIS);
        doc.text(section.empty ?? "-", PAGE_MARGIN, y);
        y += 6;
      } else {
        for (const item of section.items) {
          ensure(11);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...TINTA);
          doc.text(item.label, PAGE_MARGIN, y);
          const barX = PAGE_MARGIN + labelWidth;
          doc.setFillColor(...TRACK);
          doc.roundedRect(barX, y - 3, barWidth, 3.6, 1.2, 1.2, "F");
          const fill = Math.max(
            (item.value / item.max) * barWidth,
            item.value > 0 ? 1.5 : 0
          );
          if (fill > 0) {
            doc.setFillColor(...toneColor(item.tone));
            doc.roundedRect(barX, y - 3, fill, 3.6, 1.2, 1.2, "F");
          }
          doc.setFont("helvetica", "bold");
          doc.text(item.valueText, barX + barWidth + 4, y);
          if (item.badge) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...toneColor(item.badge.tone));
            doc.text(item.badge.text, barX + barWidth + 14, y);
          }
          y += 8;
        }
      }
    }

    if (section.type === "trends") {
      if (section.notice) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(...GRIS);
        const wrapped = doc.splitTextToSize(section.notice, contentWidth) as string[];
        ensure(wrapped.length * 5 + 2);
        doc.text(wrapped, PAGE_MARGIN, y);
        y += wrapped.length * 5 + 2;
      }
      for (const item of section.items) {
        ensure(7);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...TINTA);
        doc.text(`${item.label}: ${item.text}`, PAGE_MARGIN, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...toneColor(item.tone));
        doc.text(item.verb, PAGE_MARGIN + 118, y);
        y += 6;
      }
    }

    y += 5;
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(
      `${report.brand} - ${report.pageLabel} ${page}/${pages}`,
      width / 2,
      290,
      { align: "center" }
    );
  }

  doc.save(report.fileName);
}
