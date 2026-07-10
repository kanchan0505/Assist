import mammoth from "mammoth";

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
): Promise<string> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    return text.trim();
  }

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
}
