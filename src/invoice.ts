import { readJson, writeFile, ensureDir, readFile } from "fs-extra";
import { join } from "path";
import { safeLoad } from "js-yaml";
import { log, fileName } from "./common";

interface Record {
  _id: "string";
  amount: number;
  method: "Cash" | "NEFT" | "IMPS" | "TPT" | "UPI" | "Cheque";
  mobile: string;
  name: string;
  status: string;
  toAccount: string;
}

export const createInvoices = async () => {
  const yaml = await readFile(join(".", "src", "airtable.yml"), "utf8");
  const sheetFile: {
    generateInvoiceStep: string;
    completedInvoiceStep: string;
    sentInvoiceStep: string;
  } = safeLoad(yaml);
  log("Generating invoices");

  const json: Record[] = await readJson(join(".", fileName("Donations")));
  const recordsToGenerate = json.filter(
    i => i.status === sheetFile.generateInvoiceStep
  );

  log(recordsToGenerate.length, "records to generate invoice for");
};

createInvoices();
