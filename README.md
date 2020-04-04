<h1><img alt="" src="https://cdn.karuna2020.org/icon-colored.svg" height="29">&nbsp; Karuna 2020 Open Data</h1>

This repository contains all our data — contributors, donors, beneficiaries, and more, directly from the Airtable and Google Sheets databases we use as our central information repositories.

[![Open Data status](https://img.shields.io/github/workflow/status/Karuna2020/open-data/Karuna%202020%20Open%20Data?label=Data%20CI&logo=github)](https://github.com/Karuna2020/open-data/actions)
[![Build status](https://img.shields.io/github/workflow/status/Karuna2020/open-data/Karuna%202020%20Open%20Data%20Build?label=Build%20CI&logo=github)](https://github.com/Karuna2020/open-data/actions)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/Karuna2020/open-data)](https://snyk.io/test/github/Karuna2020/open-data)
[![David](https://img.shields.io/david/Karuna2020/open-data)](https://david-dm.org/Karuna2020/open-data)
[![GitHub](https://img.shields.io/badge/license-CC%20BY%204.0-brightgreen)](https://github.com/Karuna2020/open-data/blob/master/LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/Karuna2020/open-data)](https://github.com/Karuna2020/open-data/commits/master)

## 📈 Data

### Airtable

The following endpoints come from our Airtable databases.

| File                                                         | Data                             | CDN URL                                                                     |
| ------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------- |
| [`summary.json`](./summary.json)                             | Quick summary of important data  | [API Endpoint](https://open-data.karuna2020.org/summary.json)               |
| [`volunteers.json`](./volunteers.json)                       | List of our volunteers.json      | [API Endpoint](https://open-data.karuna2020.org/volunteers.json)            |
| [`donor-lifecycle.json`](./donor-lifecycle.json)             | List of our donors               | [API Endpoint](https://open-data.karuna2020.org/donor-lifecycle.json)       |
| [`distribution.json`](./distribution.json)                   | List of food distribution        | [API Endpoint](https://open-data.karuna2020.org/distribution.json)          |
| [`procurement.json`](./procurement.json)                     | Raw material procurement details | [API Endpoint](https://open-data.karuna2020.org/procurement.json)           |
| [`social-media-outreach.json`](./social-media-outreach.json) | Social media and blog posts      | [API Endpoint](https://open-data.karuna2020.org/social-media-outreach.json) |

### Google Sheets

The following endpoints come from our Google Sheets spreadsheets.

| File                                                                                   | Data                                       | CDN URL                                                                                  |
| -------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [`amount-received.json`](./amount-received.json)                                       | List of financial contributors and amounts | [API Endpoint](https://open-data.karuna2020.org/amount-received.json)                    |
| [`amount-payable.json`](./amount-payable.json)                                         | List of outgoing transactions              | [API Endpoint](https://open-data.karuna2020.org/amount-payable.json)                     |
| [`infrastructure.json`](./infrastructure.json)                                         | List of our available infrastructure       | [API Endpoint](https://open-data.karuna2020.org/infrastructure.json)                     |
| [`sop-s.json`](./sop-s.json)                                                           | Our SOPs (standard operating procedures)   | [API Endpoint](https://open-data.karuna2020.org/sop-s.json)                              |
| [`concalls.json`](./concalls.json)                                                     | Summary of our conference calls            | [API Endpoint](https://open-data.karuna2020.org/concalls.json)                           |
| [`it-website.json`](./it-website.json)                                                 | Technology, website, and marketing         | [API Endpoint](https://open-data.karuna2020.org/it-website.json)                         |
| [`things-to-be-done.json`](./things-to-be-done.json)                                   | List of things to be done                  | [API Endpoint](https://open-data.karuna2020.org/things-to-be-done.json)                  |
| [`geography-and-beneficiary-requests.json`](./geography-and-beneficiary-requests.json) | Geography                                  | [API Endpoint](https://open-data.karuna2020.org/geography-and-beneficiary-requests.json) |
| [`material-list.json`](./material-list.json)                                           | Material we're planning on getting         | [API Endpoint](https://open-data.karuna2020.org/material-list.json)                      |
| [`material-ordered-and-transfer`](./material-ordered-and-transfer)                     | Material we've ordered                     | [API Endpoint](https://open-data.karuna2020.org/material-ordered-and-transfer)           |

## 💡 How it works

- We maintain our central MIS in a Google Sheets spreadsheet
- Every hour, a [GitHub Actions](https://github.com/Karuna2020/open-data/blob/master/.github/workflows/data.yml) workflow is triggered
- Our friends at [SheetDB](https://sheetdb.io) help us convert spreadsheet tabs to JSON files
- We commit these JSON files to this repository and deploy them to our API

**API endpoint:** https://open-data.karuna2020.org

For example, the list of money raised is available at https://open-data.karuna2020.org/amount-received.json

## 👩‍💻 Development

Build TypeScript:

```bash
npm run build
```

Update data (triggered by GitHub Actions):

```bash
npm run update-data
```

## 📄 License

This data is available under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
