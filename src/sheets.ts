import got from "got";
import { join } from "path";
import { readFile, writeJson, readJson } from "fs-extra";
import { safeLoad } from "js-yaml";
import slugify from "@sindresorhus/slugify";
import { config } from "dotenv";
config();

const PRIVATE_COLUMNS = [
  "phone",
  "email",
  "mobile",
  "remarks",
  "utrPaymentDetailsImpsNeftRtgsNo",
  "receivedInWhichAccount",
];

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

const fetchData = async () => {
  const yaml = await readFile(join("src", "sheet.yml"), "utf8");
  const sheetFile: { publicEndpoint: string; tabs: string[] } = safeLoad(yaml);

  for await (const tab of sheetFile.tabs) {
    log("Updated data file", tab);
    try {
      const { body } = await got.get<{ [index: string]: string }[]>(
        `${sheetFile.publicEndpoint}?sheet=${encodeURIComponent(tab)}`,
        {
          responseType: "json",
          username: process.env.USERNAME,
          password: process.env.PASSWORD,
        }
      );
      await writeJson(join(".", fileName(tab)), cleanResponse(body), {
        spaces: 2,
      });
      log("SUCCESS", tab);
    } catch (error) {
      log("ERROR", tab, error);
    }
  }
};

fetchData()
  .then(() => console.log("Completed update process"))
  .catch((error) => console.log("ERROR", error))
  .finally(() => process.exit(0));
