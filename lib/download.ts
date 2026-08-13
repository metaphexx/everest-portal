// Real file downloads for the prototype.
//
// Every "Download" in the portal used to be a toast. That is fine for a wired
// action nobody can complete, but download is the one place a stub is actively
// misleading: the tutor's marking workflow is "download the work, mark it up,
// upload the marked copy", so the first step has to actually produce a file.
//
// There is no backend, so we synthesise a small, valid PDF carrying the file's
// name and a note about its origin. It opens in a real reader, which is enough
// to prove the round trip end to end - and it means the button behaves the same
// on a phone, where a fake download would be impossible to distinguish from a
// broken one.

/** Escape the characters that would otherwise terminate a PDF string literal. */
function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Build a one-page A4 PDF. Offsets in the xref table must be byte-exact, so the
 * body is assembled first and each object's position recorded as we go.
 */
function buildPdf(lines: string[]): Blob {
  const content =
    "BT\n/F1 16 Tf\n56 780 Td\n" +
    lines
      .map((line, i) => (i === 0 ? "(" + pdfEscape(line) + ") Tj\n" : "0 -26 Td\n(" + pdfEscape(line) + ") Tj\n"))
      .join("") +
    "ET";

  const objects = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>",
    "<</Length " + content.length + ">>\nstream\n" + content + "\nendstream",
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += i + 1 + " 0 obj\n" + body + "\nendobj\n";
  });

  const xrefAt = pdf.length;
  pdf += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  offsets.forEach((off) => {
    pdf += String(off).padStart(10, "0") + " 00000 n \n";
  });
  pdf += "trailer\n<</Size " + (objects.length + 1) + "/Root 1 0 R>>\nstartxref\n" + xrefAt + "\n%%EOF";

  return new Blob([pdf], { type: "application/pdf" });
}

/**
 * Download `fileName`, generating a stand-in document that names the file and
 * where it came from. Returns false when the browser blocks it so callers can
 * fall back to a message rather than appearing to do nothing.
 */
export function downloadFile(fileName: string, note?: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    const isPdf = /\.pdf$/i.test(fileName);
    const lines = [fileName, ...(note ? [note] : []), "Everest Tutoring - prototype document"];
    const blob = isPdf
      ? buildPdf(lines)
      : new Blob([lines.join("\n") + "\n"], { type: "text/plain;charset=utf-8" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    // Safari on iOS needs the anchor in the document before it will honour a
    // programmatic click.
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoking immediately can cancel the download on some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch {
    return false;
  }
}
