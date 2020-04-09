import {
  readJson,
  readdir,
  mkdirp,
  pathExists,
  writeFile,
  ensureDir,
} from "fs-extra";
const download = require("download");

import { join } from "path";

export const getPhotos = async () => {
  await mkdirp(join(".", "attachments"));
  const files = (await readdir(join("."))).filter((i) => i.endsWith(".json"));
  const images: any[] = [];
  for await (const file of files) {
    const json = await readJson(join(".", file));
    if (Array.isArray(json)) {
      json.forEach((i) => {
        ["pictures", "distributionPictures", "logo"].forEach((j) => {
          if (i[j])
            images.push({
              type: file.replace(".json", ""),
              typeKey: j,
              data: i[j].filter((img: any) =>
                (img.type || "").startsWith("image/")
              ),
            });
        });
      });
    }
  }
  for await (const item of images) {
    for await (const image of item.data) {
      const url = `attachments/${item.type}/${image.id}`;
      const hasImage = await pathExists(join(".", url));
      if (!hasImage) {
        await ensureDir(join(".", url));
        for await (const key of Object.keys(image.thumbnails || {})) {
          const img = (image.thumbnails || {})[key];
          console.log("Downloading", image.id, key, img.url);
          await writeFile(
            join(
              ".",
              url,
              `${key}.${(image.type || "").replace("image/", "")}`
            ),
            await download(img.url)
          );
        }
        await writeFile(
          join(".", url, "README.md"),
          `# Image \`${image.id}\`

## Original file details

- **ID:** ${image.id}
- **URL:** ${image.url}
- **File name:** ${image.filename}
- **Size:** ${image.size}
- **Type:** ${image.type}
- **Thumbnails:**
${Object.keys(image.thumbnails || {})
  .map(
    (i) =>
      `  - [${i.charAt(0).toUpperCase() + i.slice(1)}](${
        image.thumbnails[i].url
      }) (${image.thumbnails[i].width}×${image.thumbnails[i].height})`
  )
  .join("\n")}

## Generated file details

${Object.keys(image.thumbnails || {})
  .map(
    (i) =>
      `- ${i.charAt(0).toUpperCase() +
        i.slice(1)}: https://open-data.karuna2020.org/${url}/${i}.${(
        image.type || ""
      ).replace("image/", "")}`
  )
  .join("\n")}

## Image preview

${Object.keys(image.thumbnails || {})
  .map(
    (i) =>
      `### ${i.charAt(0).toUpperCase() +
        i.slice(1)}\n\n![](https://open-data.karuna2020.org/${url}/${i}.${(
        image.type || ""
      ).replace("image/", "")})`
  )
  .join("\n\n")}

_This file is automatically generated, please don't edit it manually. If you need any changes, edit [photos.ts](/photos.ts) or ask [@AnandChowdhary](https://github.com/AnandChowdhary)_

`
        );
      }
    }
  }
};

getPhotos();
