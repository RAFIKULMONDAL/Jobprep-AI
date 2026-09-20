const pdfParse = require("pdf-parse");
const ApiError = require("../utils/ApiError");

// Extracts raw text from an uploaded PDF resume (in-memory buffer from multer).
async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    // pdf-parse throws on corrupted/malformed PDFs (e.g. "bad XRef entry")
    // rather than returning empty text - turn this into a clear, actionable
    // message instead of letting it surface as a generic 500.
    console.error("PDF parsing failed:", err);
    throw new ApiError(
      400,
      "Could not read this PDF - it may be corrupted or saved in an unusual format. Try re-exporting it (e.g. 'Save As PDF' or 'Print to PDF') and upload again."
    );
  }
}

module.exports = { extractTextFromPdf };
