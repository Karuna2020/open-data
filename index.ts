import got from "got";

const SHEETDB_PUBLIC_API_ENDPOINT = `https://sheetdb.io/api/v1/qnigd524si9dw`;

const fetchData = async () => {
  const { body } = await got.get<{}>(SHEETDB_PUBLIC_API_ENDPOINT, {
    responseType: "json"
  });
  console.log(JSON.stringify(body));
};
