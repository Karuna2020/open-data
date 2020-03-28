import got from "got";
import { join } from "path";
import { readFile, writeJson } from "fs-extra";
import { safeLoad } from "js-yaml";
import slugify from "@sindresorhus/slugify";

const fetchData = async () => {
  const yaml = await readFile(join(".", "sheet.yml"), "utf8");
  const sheetFile: { publicEndpoint: string; tabs: string[] } = safeLoad(yaml);

  for await (const tab of sheetFile.tabs) {
    const { body } = await got.get<{ [index: string]: string }[]>(
      `${sheetFile.publicEndpoint}?sheet=${encodeURIComponent(tab)}`,
      {
        responseType: "json"
      }
    );
    await writeJson(
      join(".", `${slugify(tab.replace(/\d\.\s+/g, ""))}.json`),
      body
    );
  }
};

fetchData();
