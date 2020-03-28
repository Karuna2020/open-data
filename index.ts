import got from "got";
import { join } from "path";
import { readFile, writeJson } from "fs-extra";
import { safeLoad } from "js-yaml";
import slugify from "@sindresorhus/slugify";

const log = (...args: string[]) =>
  console.log(new Date().toISOString(), ...args);

const fileName = (file: string) => {
  if (file.includes(". ")) file = file.split(". ")[1];
  file = slugify(file);
  return `${file}.json`;
};

const fetchData = async () => {
  const yaml = await readFile(join(".", "sheet.yml"), "utf8");
  const sheetFile: { publicEndpoint: string; tabs: string[] } = safeLoad(yaml);

  for await (const tab of sheetFile.tabs) {
    log("Updated data file", tab);
    try {
      const { body } = await got.get<{ [index: string]: string }[]>(
        `${sheetFile.publicEndpoint}?sheet=${encodeURIComponent(tab)}`,
        {
          responseType: "json"
        }
      );
      await writeJson(join(".", fileName(tab)), body, { spaces: 2 });
      log("SUCCESS", tab);
    } catch (error) {
      log("ERROR", tab, error);
    }
  }
};

fetchData();
