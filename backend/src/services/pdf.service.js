const puppeteer = require("puppeteer");

// Renders an HTML string to a PDF buffer using a headless browser.
// Used for the ATS-optimized resume download.
async function generatePdfFromHtml(html) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfData = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" } });
    return Buffer.from(pdfData);
  } finally {
    await browser.close();
  }
}

module.exports = { generatePdfFromHtml };
