import { readFile, writeFile, mkdir } from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";
import prettier from "prettier";

for (const domain of [
  "properties",
  "leads",
  "public-agency",
  "viewings",
  "tasks",
]) {
  const schema = new URL(
    `../docs/contracts/${domain}.openapi.yaml`,
    import.meta.url,
  );
  const destination = new URL(
    `../src/lib/api/generated/${domain}.d.ts`,
    import.meta.url,
  );
  const ast = await openapiTS(schema);
  const generated = await prettier.format(
    `/** Generated from docs/contracts/${domain}.openapi.yaml. Do not edit. */\n${astToString(ast)}`,
    {
      parser: "typescript",
      ...(await prettier.resolveConfig(destination.pathname)),
    },
  );
  if (process.argv.includes("--check")) {
    const current = await readFile(destination, "utf8").catch(() => "");
    if (
      current.replaceAll("\r\n", "\n") !== generated.replaceAll("\r\n", "\n")
    ) {
      console.error(
        `Generated ${domain} API types differ. Run bun run api:generate.`,
      );
      process.exitCode = 1;
    }
  } else {
    await mkdir(new URL("../src/lib/api/generated/", import.meta.url), {
      recursive: true,
    });
    await writeFile(destination, generated);
  }
}
