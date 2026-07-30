const csvCell = (value) => {
  const normalized =
    value instanceof Date
      ? value.toISOString()
      : value == null
        ? ""
        : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
};

const toCsv = (headers, rows) =>
  [
    headers.map(({ label }) => csvCell(label)).join(","),
    ...rows.map((row) =>
      headers.map(({ key }) => csvCell(row[key])).join(",")
    ),
  ].join("\r\n");

const sendCsv = (res, filename, headers, rows) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename.replaceAll('"', "")}"`
  );
  res.send(`\uFEFF${toCsv(headers, rows)}`);
};

const pdfEscape = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");

const makeSimplePdf = ({ title, lines }) => {
  const content = [
    "BT",
    "/F1 18 Tf",
    "50 790 Td",
    `(${pdfEscape(title)}) Tj`,
    "0 -30 Td",
    "/F1 11 Tf",
    "16 TL",
    ...lines.flatMap((line, index) => [
      index === 0 ? `(${pdfEscape(line)}) Tj` : "T*",
      ...(index === 0 ? [] : [`(${pdfEscape(line)}) Tj`]),
    ]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
};

const sendPdf = (res, filename, options) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename.replaceAll('"', "")}"`
  );
  res.send(makeSimplePdf(options));
};

export { sendCsv, sendPdf, makeSimplePdf };
