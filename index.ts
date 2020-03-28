import got from "got";
import { join } from "path";
import { readFile, writeJson, readJson } from "fs-extra";
import { safeLoad } from "js-yaml";
import slugify from "@sindresorhus/slugify";

const log = (...args: string[]) =>
  console.log(new Date().toISOString(), ...args);

const fileName = (file: string) => {
  if (file.includes(". ")) file = file.split(". ")[1];
  file = slugify(file.trim());
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

const summarize = async () => {
  const data = {
    totalAmountRaised: 0,
    numberOfContributors: 0
  };
  const contributorsFile: {
    Date: string;
    Contributor: string;
    Amount: string;
    Method: string;
    Notes?: string;
  }[] = await readJson(join(".", fileName("13. Contributors")));
  for (const contribution of contributorsFile) {
    const value = parseInt(contribution.Amount.replace(/\D/g, ""));
    if (!isNaN(value)) {
      data.totalAmountRaised += value;
      data.numberOfContributors += 1;
    }
  }
  await writeJson(join(".", fileName("Summary")), data, { spaces: 2 });
};

fetchData()
  .then(() => summarize())
  .then(() => console.log("Completed update process"))
  .catch(error => console.log("ERROR", error))
  .finally(() => process.exit(0));
