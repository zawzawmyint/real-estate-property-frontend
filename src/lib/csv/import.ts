import { z } from "zod";
export async function decodeImportFile(value: unknown): Promise<string> {
  const file = z
    .object({
      file: z
        .instanceof(File)
        .refine(
          (f) => f.size > 0 && f.size <= 1048576,
          "Choose a nonempty CSV up to 1 MiB.",
        ),
    })
    .parse({ file: value }).file;
  let csv: string;
  try {
    csv = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      await file.arrayBuffer(),
    );
  } catch {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["file"],
        message: "Choose a valid UTF-8 CSV file.",
      },
    ]);
  }
  if (csv.includes("\0"))
    throw new z.ZodError([
      {
        code: "custom",
        path: ["file"],
        message: "CSV must not contain NUL characters.",
      },
    ]);
  return csv;
}
export const importIdentitySchema = z.strictObject({
  submissionId: z.uuid(),
  schemaVersion: z.literal(1),
  digest: z.string().regex(/^[a-f0-9]{64}$/),
});

export const issueSchema = z.object({
  rowNumber: z.number().int().min(1),
  column: z.string(),
  message: z.string(),
});
