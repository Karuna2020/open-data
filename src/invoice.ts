import { readJson, writeFile, readFile, mkdirp } from "fs-extra";
import { join } from "path";
import { safeLoad } from "js-yaml";
import {
  log,
  fileName,
  dateZero,
  updateAirtableRecord,
  sendMail,
  pad,
  sendSms,
  hideEmail,
} from "./common";
import htmlToPdf from "pdf-puppeteer";
import marked from "marked";
import { render } from "mustache";
import Cloudinary from "cloudinary";
import { config } from "dotenv";
config();
import Airtable from "airtable";
import slugify from "@sindresorhus/slugify";
const airtable = new Airtable();
const cloudinary = Cloudinary.v2;
var convertRupeesIntoWords = require("convert-rupees-into-words");

cloudinary.config({
  cloud_name: "karuna-2020",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface Record {
  _id: "string";
  id: string;
  invoiceUrl?: string;
  "Invoice URL"?: string;
  amount: number;
  date: string;
  method: "Cash" | "NEFT" | "IMPS" | "TPT" | "UPI" | "Cheque";
  name: string;
  fromBank?: string;
  status: string;
  toAccount: string;
  address?: string;
  mobile?: string;
  email?: string;
  panNo?: string;
  utrPaymentDetailsImpsNeftRtgsNo?: string;
}

export const createInvoices = async () => {
  const yaml = await readFile(join(".", "src", "airtable.yml"), "utf8");
  const sheetFile: {
    publicAppId: string;
    generateInvoiceStep: string;
    completedInvoiceStep: string;
    sentInvoiceStep: string;
    needToContactStep: string;
    smsSentStep: string;
  } = safeLoad(yaml);
  const base = airtable.base(sheetFile.publicAppId);
  log("\n\nGenerating invoices");

  const json: Record[] = await readJson(join(".", fileName("Donations")));

  const recordsToContact = json.filter(
    (i) =>
      i.status === sheetFile.needToContactStep &&
      !(i.address && i.amount && i.mobile && i.email && i.panNo)
  );
  log(recordsToContact.length, "records to contact");

  for await (const record of recordsToContact) {
    try {
      await contactSingleDonor(base, record);
    } catch (error) {
      log("ERROR", error.toString() + "\n");
    }
  }

  const recordsToGenerate = json.filter(
    (i) => i.status === sheetFile.generateInvoiceStep && !i.invoiceUrl
  );
  log(recordsToGenerate.length, "records to generate invoice for");

  const shakti = await readFile(join(".", "src", "shakti.html"), "utf8");
  const ilsef = await readFile(join(".", "src", "ilsef.html"), "utf8");
  const markdown = await readFile(join(".", "src", "invoice.md"), "utf8");

  for await (const record of recordsToGenerate) {
    try {
      await createSingleInvoice(base, record, shakti, ilsef, markdown);
    } catch (error) {
      log("ERROR", error.toString() + "\n");
    }
  }
};

export const contactSingleDonor = async (
  base: Airtable.Base,
  record: Record
) => {
  log("Sending SMS to donor", record._id, record.name);
  if (!record.mobile) throw new Error("Mobile number for SMS not found");

  await sendSms(
    record.mobile || "",
    `Thank you for your contribution to Karuna 2020, ${record.name}! Please fill the form at https://go.karuna2020.org/donor so we can send you an 80G receipt.`
  );
  log("Sent SMS successfully");

  await updateAirtableRecord(base, "Donations", [
    {
      id: record._id,
      fields: {
        Status: "SMS sent",
      },
    },
  ]);
  log("Successfully updated Airtable record", record._id);
};

const createSingleInvoice = async (
  base: Airtable.Base,
  record: Record,
  shakti: string,
  ilsef: string,
  markdown: string
) => {
  log("Generating invoice for record", record._id, record.name);

  if (!record.address) throw new Error("Address not available");
  if (!record.date) throw new Error("Date not available");
  if (!record.amount) throw new Error("Amount not available");
  if (!record.mobile) throw new Error("Phone number not available");
  if (!record.email) throw new Error("Email not available");
  if (!record.panNo) throw new Error("PAN not available");
  if (
    !["shakti foundation", "ilsef"].includes(
      record.toAccount.toLocaleLowerCase()
    )
  )
    throw new Error("`toAccount` is not ILSEF or Shakti");

  const nFamilies = Math.floor(record.amount / 750);
  const data = {
    ...record,
    signature: record._id,
    amount: Number(record.amount).toLocaleString("en-IN"),
    amountInWords: convertRupeesIntoWords(record.amount),
    numberOfFamilies: `${nFamilies} famil${nFamilies === 1 ? "y" : "ies"}`,
    numberOfPeople4: Math.floor((record.amount / 750) * 4),
    numberOfPeople5: Math.floor((record.amount / 750) * 5),
    serialNumber: `${
      record.toAccount.toLocaleLowerCase() === "Shakti Foundation" ? "SF" : "IL"
    }/Karuna2020/${pad(record.id, 4)}`,
    dateNowDate: dateZero(new Date().getUTCDate()),
    dateNowMonth: dateZero(new Date().getUTCMonth() + 1),
    dateNowYear: new Date().getUTCFullYear(),
    dateDate: record.date.split("-")[2],
    dateMonth: record.date.split("-")[1],
    dateYear: record.date.split("-")[0],
    nameOfBank: record.fromBank || "",
  };

  const pdf = await generatePdf(
    render(
      record.toAccount.toLocaleLowerCase() === "Shakti Foundation"
        ? shakti
        : ilsef,
      data
    )
  );
  log("Generated PDF", Math.floor(pdf.byteLength / 1000) + " kb");
  await mkdirp(join(".", "generated"));
  const pdfPath = join(".", "generated", `${record._id}.pdf`);
  await writeFile(pdfPath, pdf);
  const result = await uploadToCloudinary(pdfPath);
  await updateAirtableRecord(base, "Donations", [
    {
      id: record._id,
      fields: {
        "Invoice URL": result.url,
        Invoice: [{ url: result.url }],
        Status: "Receipt Generated",
      },
    },
  ]);
  log("Successfully updated Airtable record", record._id);

  const mdHtml = marked(render(markdown, data));
  const mdPlainText = mdHtml.replace(/(<([^>]+)>)/gi, "");
  const messageId = await sendMail({
    to: record.email || "",
    subject: "Karuna 2020 - 80G Receipt for Donation",
    cc:
      record.toAccount.toLocaleLowerCase() === "Shakti Foundation"
        ? ["anurag@shaktifoundationindia.com"]
        : ["fa.unifiers@gmail.com"],
    text: mdPlainText,
    html: mdHtml,
    attachments: [
      {
        filename: `karuna2020-${slugify(record.name)}.pdf`,
        contentType: "application/pdf",
        content: pdf,
      },
    ],
  });
  log("Successfully send invoice email", messageId);
  await updateAirtableRecord(base, "Donations", [
    {
      id: record._id,
      fields: {
        Status: "Receipt Sent",
      },
    },
  ]);
  log("Successfully updated Airtable record", record._id);

  await sendSms(
    record.mobile,
    `Thank you for your contribution to Karuna 2020, ${
      record.name
    }! We've sent you an 80G receipt on your email, ${hideEmail(record.email)}.`
  );
  await sendSms(
    record.email,
    `Please check your Spam folder if you don't see the email. Need help? Email us at help@karuna2020.org, and join us on WhatsApp: https://go.karuna2020.org/w`
  );
  log("Sent SMS about invoice email to donor");

  log();
};

const uploadToCloudinary = (
  pdf: string
): Promise<Cloudinary.UploadApiResponse> =>
  new Promise((resolve, reject) => {
    log("Uploading PDF to Cloudinary...");
    cloudinary.uploader.upload(pdf, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });

const generatePdf = (
  html: string,
  options?: any,
  puppeteerArgs?: any,
  remoteContent?: boolean
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    htmlToPdf(
      html,
      (data: Buffer) => {
        return resolve(data);
      },
      { printBackground: true, ...options },
      puppeteerArgs,
      remoteContent
    );
  });
