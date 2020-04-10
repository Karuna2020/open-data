import { readFile, readJson, writeJson } from "fs-extra";
import { join } from "path";
import { createHash } from "crypto";
import { safeLoad } from "js-yaml";
import { fileName } from "./common";

const PRIVATE_COLUMNS = [
  "phone",
  "email",
  "mobile",
  "phoneNumber",
  "listAadharPictures"
];

export const cleanFiles = async () => {
  const yaml = await readFile(join(".", "src", "airtable.yml"), "utf8");
  const sheetFile: { publicAppId: string; tabs: string[] } = safeLoad(yaml);

  for await (const tab of sheetFile.tabs) {
    let json = await readJson(join(".", fileName(tab)));
    if (Array.isArray(json)) {
      json = json.map(i => {
        if (i.email)
          i.emailMd5 = createHash("md5")
            .update(i.email)
            .digest("hex");
        PRIVATE_COLUMNS.forEach(col => {
          delete i[col];
        });
        return i;
      });
    }
    await writeJson(join(".", fileName(tab)), json, { spaces: 2 });
  }
};

cleanFiles();
