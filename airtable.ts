import { writeJson, readJson } from "fs-extra";
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

const PRIVATE_COLUMNS = ["Phone", "Email", "phoneNumber", "listAadharPictures"];

const update = async () => {
  log("Updating data from Airtable");

  for await (const tab of [
    "Volunteers",
    "Donor Lifecycle",
    "Distribution",
    "Procurement",
    "Social Media Outreach",
  ]) {
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

const urls = async () => {};

// update().then(() => summarize()).then(() => urls());
urls();
