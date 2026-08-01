import PDFDocument from "pdfkit";

type InvoiceData = {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  billingDetails?: unknown;
  description: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  dueDate: Date;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
};
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
export function createInvoicePdf(invoice: InvoiceData) {
  const billing =
    invoice.billingDetails && typeof invoice.billingDetails === "object"
      ? (invoice.billingDetails as Record<string, unknown>)
      : {};
  const billingLine = (...keys: string[]) =>
    keys
      .map((key) => billing[key])
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .join(", ");
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: { Title: `Invoice ${invoice.invoiceNumber}`, Author: "Serhii Dev Studio" }
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc
      .fontSize(22)
      .text("Serhii Dev Studio")
      .fontSize(10)
      .fillColor("#555")
      .text("Frontend & Full Stack JavaScript Development");
    doc.moveDown(2).fillColor("#111").fontSize(18).text(`Invoice ${invoice.invoiceNumber}`);
    doc
      .fontSize(10)
      .text(`Client: ${invoice.clientName}`)
      .text(`Email: ${invoice.clientEmail}`)
      .text(`Due: ${invoice.dueDate.toISOString().slice(0, 10)}`);
    const company = billingLine("companyName");
    const address = billingLine("addressLine1", "addressLine2");
    const locality = billingLine("postalCode", "city", "region", "country");
    const taxId = billingLine("taxId");
    if (company) doc.text(`Company: ${company}`);
    if (address) doc.text(address);
    if (locality) doc.text(locality);
    if (taxId) doc.text(`Tax ID: ${taxId}`);
    doc.moveDown().fontSize(12).text(invoice.description).moveDown();
    for (const item of invoice.items)
      doc
        .fontSize(10)
        .text(`${item.description}  × ${item.quantity}`, { continued: true })
        .text(money(item.total, invoice.currency), { align: "right" });
    doc
      .moveDown()
      .fontSize(10)
      .text(`Subtotal: ${money(invoice.subtotal, invoice.currency)}`, { align: "right" })
      .text(`Tax: ${money(invoice.tax, invoice.currency)}`, { align: "right" })
      .fontSize(14)
      .text(`Total: ${money(invoice.total, invoice.currency)}`, { align: "right" });
    doc.end();
  });
}
