import { writeJson } from "fs-extra";
import { config } from "dotenv";
import { join } from "path";
import slugify from "@sindresorhus/slugify";
config();

/**
 * This is NOT the API key, it's the public app ID
 */
const AIRTABLE_APP_ID = "appoaPyQSLrreakJN";

import Airtable from "airtable";
const airtable = new Airtable();
const base = airtable.base(AIRTABLE_APP_ID);

const log = (...args: string[]) =>
  console.log(new Date().toISOString(), ...args);

const fileName = (file: string) => {
  if (file.includes(". ")) file = file.split(". ")[1];
  file = slugify(file.trim());
  return `${file}.json`;
};

const keyName = (key: string) =>
  slugify(key.trim()).replace(/-([a-z])/g, (g) => g[1].toUpperCase());

const cleanResponse = (data: { [index: string]: string }[]) => {
  if (Array.isArray(data))
    data = data.map((i) => {
      if (typeof i === "object" && !Array.isArray(i)) {
        Object.keys(i).forEach((key) => {
          if (typeof i[key] === "string") i[key] = i[key].trim();
          if (i[key] !== "") i[keyName(key)] = i[key];
          delete i[key];
          PRIVATE_COLUMNS.forEach((col) => delete i[col]);
        });
      }
      return i;
    });
  return data;
};

const PRIVATE_COLUMNS = ["Phone", "Email"];

const update = async () => {
  log("Updating data from Airtable");

  for await (const tab of ["Volunteers"]) {
    const volunteers: any[] = [];
    await base(tab)
      .select()
      .eachPage((records, fetchNextPage) => {
        volunteers.push(
          ...records.map((record) => ({ id: record.id, ...record.fields }))
        );
        fetchNextPage();
      });
    console.log(tab, volunteers.length);
    await writeJson(join(".", fileName(tab)), cleanResponse(volunteers), {
      spaces: 2,
    });
  }
};

update();
