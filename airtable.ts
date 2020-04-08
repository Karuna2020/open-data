import { writeJson, readJson, readFile, writeFile } from "fs-extra";
import { config } from "dotenv";
import { join } from "path";
import slugify from "@sindresorhus/slugify";
import axios from "axios";
import { createHash } from "crypto";
config();

import Airtable from "airtable";
import { safeLoad } from "js-yaml";
const airtable = new Airtable();

const log = (...args: string[]) =>
  console.log(new Date().toISOString(), ...args);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fileName = (file: string) => {
  if (file.includes(". ")) file = file.split(". ")[1];
  file = slugify(file.trim());
  return `${file}.json`;
};

const keyName = (key: string) =>
  slugify(key.trim()).replace(/-([a-z])/g, (g) => g[1].toUpperCase());

const cleanResponse = (tab: string, data: { [index: string]: string }[]) => {
  if (Array.isArray(data))
    data = data.map((i) => {
      if (typeof i === "object" && !Array.isArray(i)) {
        const id = i._id;
        for (const key in i) {
          if (typeof i[key] === "string") i[key] = i[key].trim();
          if (i.email)
            i.emailMd5 = createHash("md5")
              .update(i.email)
              .digest("hex");
          PRIVATE_COLUMNS.forEach((col) => {
            delete i[col];
            delete i[keyName(col)];
          });
          if (i[key] !== "") i[keyName(key)] = i[key];
          delete i[key];
        }
        i._id = id;
      }
      const ordered: any = {};
      Object.keys(i)
        .sort()
        .forEach((key) => (ordered[key] = i[key]));
      return ordered;
    });
  if (tab === "Volunteers")
    data = data
      .filter((i) => i.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  if (tab === "Partners")
    data = data
      .filter((i) => i.brandName)
      .sort((a, b) => a.brandName.localeCompare(b.brandName));
  return data;
};

const PRIVATE_COLUMNS = ["phone", "email", "phoneNumber", "listAadharPictures"];

const update = async () => {
  const yaml = await readFile(join(".", "airtable.yml"), "utf8");
  const sheetFile: { publicAppId: string; tabs: string[] } = safeLoad(yaml);
  const base = airtable.base(sheetFile.publicAppId);
  log("Updating data from Airtable");

  for await (const tab of sheetFile.tabs) {
    const data: any[] = [];
    await base(tab)
      .select()
      .eachPage((records, fetchNextPage) => {
        data.push(
          ...records.map((record) => ({ _id: record.id, ...record.fields }))
        );
        fetchNextPage();
      });
    console.log(tab, data.length);
    await writeJson(join(".", fileName(tab)), cleanResponse(tab, data), {
      spaces: 2,
    });
    await wait(1000);
  }
};

const summarize = async () => {
  const data = {
    totalAmountRaised: 0,
    numberOfContributors: 0,
    numberOfVolunteers: 0,
    numberOfKitDistributionsCompleted: 0,
    numberOfPeopleImpacted: 0,
  };

  const volunteers: any[] = await readJson(join(".", fileName("Volunteers")));
  data.numberOfVolunteers = volunteers.length;

  const amount: any[] = await readJson(join(".", fileName("Amount Received")));
  data.numberOfContributors = amount.length - 1;
  data.totalAmountRaised =
    amount.reduce(
      (sum, val) => sum + parseInt(val.amount.replace(/\D/g, "")),
      0
    ) / 2;

  const distribution: any[] = await readJson(
    join(".", fileName("Distribution"))
  );
  data.numberOfKitDistributionsCompleted = distribution
    .filter((i) =>
      ["Delivered", "Received Distribution Pictures"].includes(i.status)
    )
    .reduce((sum, val) => sum + val.numberOfKitsNeeded, 0);
  data.numberOfPeopleImpacted = data.numberOfKitDistributionsCompleted * 4;

  await writeJson(join(".", fileName("Summary")), data, { spaces: 2 });
};

const urls = async () => {
  const response = await axios.get<string>(
    "https://raw.githubusercontent.com/Karuna2020/go/master/redirects.csv"
  );
  const lines = response.data
    .split("\n")
    .filter((i) => i.includes(",") && i !== "short,long");
  const urlGuide = await readFile(
    join(".", "guides", "url-shortener.md"),
    "utf8"
  );
  await writeFile(
    join(".", "guides", "url-shortener.md"),
    urlGuide.replace(
      "\n\n<!--urls-->",
      lines
        .map(
          (i) =>
            `| [${i.split(",")[0]}](https://go.karuna2020.org/${
              i.split(",")[0]
            }) | ${i.split(",")[1]} |`
        )
        .join("\n")
    )
  );
};

update()
  .then(() => summarize())
  .then(() => urls());
