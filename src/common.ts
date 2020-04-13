const TEST_EMAIL = false;

import slugify from "@sindresorhus/slugify";
import nodemailer from "nodemailer";
import axios from "axios";
import { config } from "dotenv";
config();

export const log = (...args: any[]) =>
  console.log(
    new Date().toISOString(),
    ...args.map(i => (typeof i === "string" ? i : JSON.stringify(i)))
  );

export const fileName = (file: string) => {
  if (file.includes(". ")) file = file.split(". ")[1];
  file = slugify(file.trim());
  return `${file}.json`;
};

export const keyName = (key: string) =>
  slugify(key.trim()).replace(/-([a-z])/g, g => g[1].toUpperCase());

export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const dateZero = (number: number | string) =>
  Number(number) > 9 ? number : `0${number}`;

export const updateAirtableRecord = (
  base: Airtable.Base,
  baseName: string,
  data: any[]
) =>
  new Promise((resolve, reject) => {
    base(baseName).update(data, (error: any, records: any) => {
      if (error) return reject(error);
      resolve(records);
    });
  });

const transport = nodemailer.createTransport({
  host: "smtp.hostinger.in",
  port: 587,
  secure: false,
  auth: {
    user: "help@karuna2020.org",
    pass: process.env.ZOHO_PASSWORD
  }
});

export const sendMail = (data: {
  to: string;
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text: string;
  html: string;
  attachments?: {
    filename: string;
    contentType: string;
    content?: string | Buffer;
    path?: string;
  }[];
}): Promise<string> =>
  new Promise((resolve, reject) => {
    data.to = TEST_EMAIL ? "anandchowdhary@gmail.com" : data.to;
    if (TEST_EMAIL) delete data.cc;
    transport.sendMail(
      { from: "help@karuna2020.org", ...data },
      (error, info) => {
        if (error) return reject(error);
        resolve(info.messageId);
      }
    );
  });

/**
 * Pad a number
 * @example pad(2, 4); // returns "0002"
 * @param n - Number to pad
 * @param width - Total width including padding
 * @param z - Padding character, defaults to 0
 * @source https://stackoverflow.com/a/10073788/1656944
 */
export const pad = (n: string | number, width: number, z?: string) => {
  if (typeof n === "number") n = n.toString();
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

export const sendSms = async (
  mobileNumber: string | number,
  message: string
) => {
  const result = await axios.get(
    `http://bulksms.mysmsmantra.com:8080/WebSMS/SMSAPI.jsp?username=${
      process.env.SMS_USERNAME
    }&password=${
      process.env.SMS_PASSWORD
    }&sendername=UNITTT&mobileno=${mobileNumber}&message=${encodeURIComponent(
      message
    )}`
  );
  return result.data;
};

export const hideEmail = (email: string) => {
  const name = email.split("@")[0];
  const domain = email.split("@")[1];
  return `${name.substr(0, 2)}*****@${domain}`;
};
