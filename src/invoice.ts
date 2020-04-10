import { readJson, writeFile, ensureDir, readFile } from "fs-extra";
import { join } from "path";
import { safeLoad } from "js-yaml";
import { log, fileName } from "./common";

interface Record {
  _id: "string";
  amount: number;
  method: "Cash" | "NEFT" | "IMPS" | "TPT" | "UPI" | "Cheque";
  name: string;
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
    i => i.status === sheetFile.generateInvoiceStep
  );
  log(recordsToGenerate.length, "records to generate invoice for");

  for await (const record of recordsToGenerate) {
    try {
      await createSingleInvoice(record);
    } catch (error) {
      log("ERROR", error.toString() + "\n");
    }
  }
};

export const createSingleInvoice = async (record: Record) => {
  log("Generating invoice for record", record._id, record.name);

  if (!record.address) throw new Error("Address not available");
  if (!record.amount) throw new Error("Amount not available");
  if (!record.mobile) throw new Error("Phone number not available");
  if (!record.panNo) throw new Error("PAN not available");

  log("Successfully generated\n");
};

createInvoices();
