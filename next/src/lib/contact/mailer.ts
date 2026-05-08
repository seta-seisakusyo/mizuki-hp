import nodemailer from "nodemailer";
import { ContactPayload } from "./types";

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  toAddress: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS; // SMTP_PASSWORD または SMTP_PASS をサポート
  const toAddress = process.env.CONTACT_TO_EMAIL || user || "";

  if (!host || !user || !pass || !toAddress) {
    throw new Error("Mail server is not configured.");
  }

  return { host, port, user, pass, toAddress };
}

export async function sendContactEmails(payload: ContactPayload): Promise<void> {
  const smtp = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safePhone = escapeHtml(payload.phone || "-");
  const safeInquiryHtml = escapeHtml(payload.inquiry).replace(/\n/g, "<br />");
  const safeNameForSubject = payload.name.replace(/[\r\n]/g, " ").trim();

  await Promise.all([
    transporter.sendMail({
      from: `"Web Contact Form" <${smtp.user}>`,
      to: smtp.toAddress,
      subject: `[Contact] from ${safeNameForSubject}`,
      text: [
        "A new contact inquiry was submitted.",
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Phone: ${payload.phone || "-"}`,
        "",
        payload.inquiry,
      ].join("\n"),
      html: [
        "<h3>A new contact inquiry was submitted.</h3>",
        `<p><strong>Name:</strong> ${safeName}</p>`,
        `<p><strong>Email:</strong> ${safeEmail}</p>`,
        `<p><strong>Phone:</strong> ${safePhone}</p>`,
        `<p><strong>Message:</strong><br />${safeInquiryHtml}</p>`,
      ].join(""),
    }),
    transporter.sendMail({
      from: `"Clinic" <${smtp.user}>`,
      to: payload.email,
      subject: "【自動返信】お問い合わせありがとうございます",
      text: [
        `${payload.name} 様`,
        "",
        "お問い合わせありがとうございます。",
        "以下の内容で受け付けました。",
        "",
        payload.inquiry,
      ].join("\n"),
      html: [
        `<p>${safeName} 様</p>`,
        "<p>お問い合わせありがとうございます。</p>",
        "<p>以下の内容で受け付けました。</p>",
        "<hr />",
        `<p>${safeInquiryHtml}</p>`,
      ].join(""),
    }),
  ]);
}
