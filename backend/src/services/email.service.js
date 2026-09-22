const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function emailWrapper(title, bodyHtml, linkUrl, linkLabel, expiryNote) {
  return `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin-bottom: 4px;">${title}</h2>
      ${bodyHtml}
      <p style="margin: 24px 0;">
        <a href="${linkUrl}" style="background:#E8B339;color:#0B0B0D;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
          ${linkLabel}
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        Or copy and paste this link into your browser:<br/>
        <span style="word-break: break-all;">${linkUrl}</span>
      </p>
      <p style="font-size: 13px; color: #666;">${expiryNote}</p>
    </div>
  `;
}

async function sendVerificationEmail(to, name, verifyUrl) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Job Prep AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your Job Prep AI account",
    html: emailWrapper(
      `Welcome, ${name}!`,
      `<p>Please verify your email address to activate your Job Prep AI account.</p>`,
      verifyUrl,
      "Verify Email",
      "This link expires in 24 hours."
    ),
  });
}

async function sendPasswordResetEmail(to, name, resetUrl) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Job Prep AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Job Prep AI password",
    html: emailWrapper(
      "Password Reset Request",
      `<p>Hi ${name}, we received a request to reset your password.</p>`,
      resetUrl,
      "Reset Password",
      "This link expires in 1 hour. If you didn't request this, you can safely ignore this email."
    ),
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
