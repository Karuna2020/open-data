import {
  readJson,
  readdir,
  mkdirp,
  pathExists,
  writeFile,
  ensureDir,
  readFile,
} from "fs-extra";
const download = require("download");
import { config } from "dotenv";
config();
import Airtable from "airtable";
const airtable = new Airtable();

import { join } from "path";
import { safeLoad } from "js-yaml";
import slugify from "@sindresorhus/slugify";
function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const updateAirtableRecord = (
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

const log = (...args: string[]) =>
  console.log(new Date().toISOString(), ...args);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fileName = (file: string) => {
  if (file.includes(". ")) file = file.split(". ")[1];
  file = slugify(file.trim());
  return `${file}.json`;
};

export const getPhotos = async () => {
  const yaml = await readFile(join(".", "src", "airtable.yml"), "utf8");
  const sheetFile: {
    publicAppId: string;
    tabs: string[];
    attachments: string[];
  } = safeLoad(yaml);
  log("Updating images from Airtable");

  for await (const tab of sheetFile.tabs) {
    const json = await readJson(join(".", fileName(tab)));
    console.log(json, tab);
  }
};

getPhotos();
