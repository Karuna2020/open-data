import { config } from "dotenv";
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

const update = async () => {
  log("Updating data from Airtable");
};

update();
