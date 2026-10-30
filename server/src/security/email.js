import nodemailer from 'nodemailer';

let testTransport = null;

export function setEmailTransport(transport) {
  testTransport = transport;
}

function getTransport() {
  if (testTransport) return testTransport;
  if (!process.env.SMTP_URL || !process.env.MAIL_FROM) throw new Error('Email delivery is not configured.');
  return nodemailer.createTransport(process.env.SMTP_URL);
}

export async function sendAccountActionEmail({ to, subject, text }) {
  const from = process.env.MAIL_FROM;
  if (!testTransport && (!process.env.SMTP_URL || !from)) throw new Error('Email delivery is not configured.');
  return getTransport().sendMail({ from: from ?? 'Online Exam Portal <no-reply@example.test>', to, subject, text });
}
