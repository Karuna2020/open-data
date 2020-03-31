import got from "got";
import { join } from "path";
import { readFile, writeJson, readJson } from "fs-extra";
import { safeLoad } from "js-yaml";
import slugify from "@sindresorhus/slugify";
import { config } from "dotenv";
config();

const log = (...args: string[]) =>
  console.log(new Date().toISOString(), ...args);

const fileName = (file: string) => {
  if (file.includes(". ")) file = file.split(". ")[1];
  file = slugify(file.trim());
  return `${file}.json`;
};

const keyName = (key: string) =>
  slugify(key.trim()).replace(/-([a-z])/g, g => g[1].toUpperCase());

const cleanResponse = (data: { [index: string]: string }[]) => {
  if (Array.isArray(data))
    data = data.map(i => {
      if (typeof i === "object" && !Array.isArray(i)) {
        Object.keys(i).forEach(key => {
          if (typeof i[key] === "string") i[key] = i[key].trim();
          if (i[key] !== "") i[keyName(key)] = i[key];
          delete i[key];
        });
      }
      return i;
    });
  return data;
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
          responseType: "json",
          username: process.env.USERNAME,
          password: process.env.PASSWORD
        }
      );
      await writeJson(join(".", fileName(tab)), cleanResponse(body), {
        spaces: 2
      });
      log("SUCCESS", tab);
    } catch (error) {
      log("ERROR", tab, error);
    }
  }
};

const summarize = async () => {
  const data = {
    totalAmountRaised: 0,
    numberOfContributors: 0,
    numberOfVolunteers: 0
  };

  const contributorsFile: {
    date: string;
    contributor: string;
    amount: string;
    method: string;
    notes?: string;
  }[] = await readJson(join(".", fileName("13. Amount Received")));
  for (const contribution of contributorsFile) {
    const value = parseInt(contribution.amount.replace(/\D/g, ""));
    if (!isNaN(value)) {
      data.totalAmountRaised += value;
      data.numberOfContributors += 1;
    }
  }

  const volunteersFile: {
    sNo: string;
    status: string;
    name: string;
    phone: string;
    email: string;
    competenceBackground: string;
    location: string;
    reference: string;
    areaOfWorkAllocated: string;
    remarks: string;
  }[] = await readJson(join(".", fileName("4. Volunteers")));
  data.numberOfVolunteers = volunteersFile.length;
  await writeJson(join(".", fileName("Summary")), data, { spaces: 2 });
};

fetchData()
  .then(() => summarize())
  .then(() => console.log("Completed update process"))
  .catch(error => console.log("ERROR", error))
  .finally(() => process.exit(0));
