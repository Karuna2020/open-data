import got from "got";
import { join } from "path";
import { readFile } from "fs-extra";
import { safeLoad } from "js-yaml";

const fetchData = async () => {
  const yaml = await readFile(join(".", "sheet.yml"), "utf8");
  const sheetFile: { publicEndpoint: string; tabs: string[] } = safeLoad(yaml);
  console.log(sheetFile);

  // const { body } = await got.get<{ [index: string]: string }[]>(
  //   SHEETDB_PUBLIC_API_ENDPOINT,
  //   {
  //     responseType: "json"
  //   }
  // );
};

fetchData();
