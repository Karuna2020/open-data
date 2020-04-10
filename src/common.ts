import slugify from "@sindresorhus/slugify";

export const log = (...args: any[]) =>
  console.log(
    new Date().toISOString(),
    ...args.map(i => (typeof i === "string" ? i : JSON.stringify(i)))
  );

export const fileName = (file: string) => {
  if (file.includes(". ")) file = file.split(". ")[1];
  file = slugify(file.trim());
  return `${file}.json`;
};

export const keyName = (key: string) =>
  slugify(key.trim()).replace(/-([a-z])/g, g => g[1].toUpperCase());

export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));
