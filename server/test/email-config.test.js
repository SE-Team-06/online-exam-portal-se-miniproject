import test from 'node:test';
import assert from 'node:assert/strict';
import { requireEncryptedSmtpUrl } from '../src/security/email.js';

test('requires encryption for SMTP connection URLs', () => {
  const startTls = new URL(requireEncryptedSmtpUrl('smtp://mail.example.test:587'));
  assert.equal(startTls.protocol, 'smtp:');
  assert.equal(startTls.searchParams.get('requireTLS'), 'true');

  const implicitTls = new URL(requireEncryptedSmtpUrl('smtps://mail.example.test:465'));
  assert.equal(implicitTls.searchParams.get('secure'), 'true');
});

test('rejects non-SMTP and explicitly insecure SMTP settings', () => {
  for (const url of [
    'http://mail.example.test',
    'direct://mail.example.test',
    'smtp://mail.example.test?requireTLS=false',
    'smtp://mail.example.test?requireTLS=0',
    'smtp://mail.example.test?ignoreTLS=true',
    'smtp://mail.example.test?tls.rejectUnauthorized=false',
    'smtp://mail.example.test?tls.rejectUnauthorized=0',
    'smtps://mail.example.test?secure=false',
  ]) assert.throws(() => requireEncryptedSmtpUrl(url), /SMTP_URL/);
});
