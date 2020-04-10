import axios from "axios";
import { dateZero } from "./common";
import { config } from "dotenv";
import { mkdirp, writeJson } from "fs-extra";
import { join } from "path";
config();

export const getAnalytics = async () => {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(-1);
  const analytics = (
    await axios.post(
      "https://api.cloudflare.com/client/v4/graphql",
      {
        query: `query {
          viewer {
            zones(filter: {zoneTag: "${process.env.CLOUDFLARE_ZONE_ID}"}) {
              httpRequests1dGroups(
                orderBy: [date_ASC],
                limit: 5
                filter: { date_gt: "${thisMonth.getUTCFullYear()}-${dateZero(
          thisMonth.getUTCMonth() + 1
        )}-${dateZero(thisMonth.getUTCDate())}" }) {
                  dimensions {
                    date
                  }
                  sum {
                  browserMap {
                    pageViews
                    uaBrowserFamily
                  }
                  bytes
                  cachedBytes
                  cachedRequests
                  contentTypeMap {
                    bytes
                    requests
                    edgeResponseContentTypeName
                  }
                  countryMap {
                    bytes
                    requests
                    threats
                    clientCountryName
                  }
                  encryptedBytes
                  encryptedRequests
                  pageViews
                  requests
                  responseStatusMap {
                    requests
                    edgeResponseStatus
                  }
                }
                uniq {
                  uniques
                }
              }
            }
          }
        }`
      },
      {
        headers: {
          "X-AUTH-EMAIL": process.env.CLOUDFLARE_EMAIL,
          "X-AUTH-KEY": process.env.CLOUDFLARE_API_KEY
        }
      }
    )
  ).data.data.viewer.zones[0].httpRequests1dGroups;
  await mkdirp(join(".", "analytics"));
  await writeJson(
    join(
      ".",
      "analytics",
      `${new Date().getUTCFullYear()}-${dateZero(
        new Date().getUTCMonth() + 1
      )}.json`
    ),
    analytics,
    { spaces: 2 }
  );
};
