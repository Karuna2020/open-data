import slugify from "@sindresorhus/slugify";
import nodemailer from "nodemailer";

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

export const sendMail = async () => {
  //
};
