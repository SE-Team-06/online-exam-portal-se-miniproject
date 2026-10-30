import nodemailer from 'nodemailer';

let testTransport = null;

export function setEmailTransport(transport) {
  testTransport = transport;
}

export function requireEncryptedSmtpUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('SMTP_URL must be a valid SMTP connection URL.'); }
  if (!['smtp:', 'smtps:'].includes(url.protocol) || !url.hostname) {
    throw new Error('SMTP_URL must use smtp:// with STARTTLS or smtps:// with TLS.');
  }
  const isFalse = (value) => ['false', '0', 'no'].includes(String(value).toLowerCase());
  const isTrue = (value) => ['true', '1', 'yes'].includes(String(value).toLowerCase());
  if (isFalse(url.searchParams.get('requireTLS'))
    || isTrue(url.searchParams.get('ignoreTLS'))
    || isFalse(url.searchParams.get('secure'))
    || isFalse(url.searchParams.get('tls.rejectUnauthorized'))) {
    throw new Error('SMTP_URL cannot disable encrypted transport or TLS certificate validation.');
  }
  if (url.protocol === 'smtp:') url.searchParams.set('requireTLS', 'true');
  if (url.protocol === 'smtps:') url.searchParams.set('secure', 'true');
  return url.toString();
}

function getTransport() {
  if (testTransport) return testTransport;
  if (!process.env.SMTP_URL || !process.env.MAIL_FROM) throw new Error('Email delivery is not configured.');
  return nodemailer.createTransport(requireEncryptedSmtpUrl(process.env.SMTP_URL));
}

export async function sendAccountActionEmail({ to, subject, text }) {
  const from = process.env.MAIL_FROM;
  if (!testTransport && (!process.env.SMTP_URL || !from)) throw new Error('Email delivery is not configured.');
  return getTransport().sendMail({ from: from ?? 'Online Exam Portal <no-reply@example.test>', to, subject, text });
}
