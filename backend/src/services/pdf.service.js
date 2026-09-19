// Renders an HTML string to a PDF buffer using a headless browser.
// Used for the ATS-optimized resume download.
//
// Local dev (Windows/Mac/Linux dev machine): uses regular "puppeteer",
// which auto-downloads and manages its own full Chromium install - this
// is what you've already tested locally and it works fine.
//
// Production (Render/Railway/most containers): regular Chromium needs
// several OS-level shared libraries (libnss3, libatk, libgbm, fonts, etc.)
// that these containers don't ship with, so launching it fails even
// though it installed successfully. @sparticuz/chromium is a Chromium
// build made specifically to work in these restricted environments
// (originally built for AWS Lambda), so we use "puppeteer-core" +
// "@sparticuz/chromium" instead when NODE_ENV=production.
async function generatePdfFromHtml(html) {
  const isProduction = process.env.NODE_ENV === "production";

  let browser;
  if (isProduction) {
    const chromium = require("@sparticuz/chromium");
    const puppeteerCore = require("puppeteer-core");
    browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    const puppeteer = require("puppeteer");
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfData = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });
    // Wrap explicitly - some Puppeteer/Chromium builds return a Uint8Array
    // rather than a true Node Buffer, which Express would otherwise
    // silently mis-send as JSON instead of raw binary.
    return Buffer.from(pdfData);
  } finally {
    await browser.close();
  }
}

module.exports = { generatePdfFromHtml };
