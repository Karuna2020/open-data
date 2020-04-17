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
import { config } from "dotenv";
config();
import Airtable from "airtable";
import slugify from "@sindresorhus/slugify";
var convertRupeesIntoWords = require("convert-rupees-into-words");

const gen = async () => {
  const recordsToGenerate = await readJson(join(".", "src", "shakti.json"));
  log(recordsToGenerate.length, "records to generate invoice for");

  const shakti = await readFile(join(".", "src", "shakti-solo.html"), "utf8");
  const markdown = await readFile(join(".", "src", "invoice.md"), "utf8");

  for await (const record of recordsToGenerate) {
    try {
      await createSingleInvoice(record, shakti, markdown);
    } catch (error) {
      log("ERROR", error.toString() + "\n");
    }
  }
};
const createSingleInvoice = async (
  record: any,
  shakti: string,
  markdown: string
) => {
  log("Generating invoice for record", record.sNo, record.name);

  const nFamilies = Math.floor(record.amount / 750);
  const data = {
    ...record,
    signature: record._id,
    amount: Number(record.amount).toLocaleString("en-IN"),
    amountInWords: convertRupeesIntoWords(record.amount),
    numberOfFamilies: `${nFamilies} famil${nFamilies === 1 ? "y" : "ies"}`,
    numberOfPeople4: Math.floor((record.amount / 750) * 4),
    numberOfPeople5: Math.floor((record.amount / 750) * 5),
    serialNumber: `SF-Covid19-${pad(record.sNo, 4)}`,
    dateNowDate: dateZero(new Date().getUTCDate()),
    dateNowMonth: dateZero(new Date().getUTCMonth() + 1),
    dateNowYear: new Date().getUTCFullYear(),
    dateDate: record.dateDate,
    dateMonth: record.dateMonth,
    dateYear: record.dateYear,
    nameOfBank: record.fromBank || "",
  };

  const pdf = await generatePdf(render(shakti, data));
  log("Generated PDF", Math.floor(pdf.byteLength / 1000) + " kb");
  await mkdirp(join(".", "generated"));
  const pdfPath = join(
    ".",
    "generated",
    `${record.sNo}-${slugify(record.name)}.pdf`
  );
  await writeFile(pdfPath, pdf);
};

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

gen();
