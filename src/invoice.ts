import { readJson, writeFile, readFile } from "fs-extra";
import { join } from "path";
import { safeLoad } from "js-yaml";
import { log, fileName, dateZero } from "./common";
import htmlToPdf from "pdf-puppeteer";
import { render } from "mustache";
var convertRupeesIntoWords = require("convert-rupees-into-words");

interface Record {
  _id: "string";
  id: string;
  invoiceUrl?: string;
  amount: number;
  date: string;
  method: "Cash" | "NEFT" | "IMPS" | "TPT" | "UPI" | "Cheque";
  name: string;
  fromBank?: string;
  status: string;
  toAccount: string;
  address?: string;
  mobile?: string;
  panNo?: string;
  utrPaymentDetailsImpsNeftRtgsNo?: string;
}

export const createInvoices = async () => {
  const yaml = await readFile(join(".", "src", "airtable.yml"), "utf8");
  const sheetFile: {
    generateInvoiceStep: string;
    completedInvoiceStep: string;
    sentInvoiceStep: string;
  } = safeLoad(yaml);
  log("\n\nGenerating invoices");

  const json: Record[] = await readJson(join(".", fileName("Donations")));
  const recordsToGenerate = json.filter(
    i => i.status === sheetFile.generateInvoiceStep && !i.invoiceUrl
  );
  log(recordsToGenerate.length, "records to generate invoice for");

  const html = await readFile(join(".", "src", "invoice.html"), "utf8");
  for await (const record of recordsToGenerate) {
    try {
      await createSingleInvoice(record, html);
    } catch (error) {
      log("ERROR", error.toString() + "\n");
    }
  }
};

const createSingleInvoice = async (record: Record, html: string) => {
  log("Generating invoice for record", record._id, record.name);

  if (!record.address) throw new Error("Address not available");
  if (!record.date) throw new Error("Date not available");
  if (!record.amount) throw new Error("Amount not available");
  if (!record.mobile) throw new Error("Phone number not available");
  if (!record.panNo) throw new Error("PAN not available");

  const pdf = await generatePdf(
    render(html, {
      ...record,
      signature: record._id,
      amountInWords: convertRupeesIntoWords(record.amount),
      serialNumber: "KARUNA-" + record.id,
      dateNowDate: dateZero(new Date().getUTCDate()),
      dateNowMonth: dateZero(new Date().getUTCMonth() + 1),
      dateNowYear: new Date().getUTCFullYear(),
      dateDate: record.date.split("-")[2],
      dateMonth: record.date.split("-")[1],
      dateYear: record.date.split("-")[0],
      nameOfBank: record.fromBank || ""
    })
  );
  await writeFile(join(".", "pdf.pdf"), pdf);

  log("Successfully generated\n");
};

const generatePdf = (
  html: string,
  options?: any,
  puppeteerArgs?: any,
  remoteContent?: boolean
) =>
  new Promise((resolve, reject) => {
    htmlToPdf(
      html,
      (data: Buffer) => {
        return resolve(data);
      },
      { landscape: true, ...options },
      puppeteerArgs,
      remoteContent
    );
  });

createInvoices();
