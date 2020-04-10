import { readJson, writeFile, ensureDir, readFile } from "fs-extra";
import { join } from "path";
import { safeLoad } from "js-yaml";
import { log } from "./common";

export const getPhotos = async () => {
  const yaml = await readFile(join(".", "src", "airtable.yml"), "utf8");
  const sheetFile: {
    publicAppId: string;
    tabs: string[];
    attachments: string[];
  } = safeLoad(yaml);
  log("Updating images from Airtable");

  for await (const tab of sheetFile.tabs) {
  }
};
