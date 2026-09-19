const pdfParse = require("pdf-parse");

// Extracts raw text from an uploaded PDF resume (in-memory buffer from multer).
async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}

module.exports = { extractTextFromPdf };
