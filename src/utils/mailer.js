const nodemailer = require('nodemailer');

let transporter;
let isTestAccount = false;

async function getTransporter() {
  if (transporter) return transporter;

  // If SMTP settings provided in env, use them for production or real sending
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Using SMTP transporter from environment variables');
    return transporter;
  }

  // Fallback to Ethereal test account for development
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  isTestAccount = true;
  console.log('Ethereal test account created. Login at https://ethereal.email with the credentials above if needed.');
  return transporter;
}

async function sendMail({ to, subject, text, html, from }) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: from || (process.env.FROM_EMAIL || 'no-reply@hearthandheal.org'),
    to,
    subject,
    text,
    html,
  });

  let previewUrl = null;
  if (isTestAccount) {
    previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('Preview URL:', previewUrl);
  }

  return { info, previewUrl };
}

module.exports = { sendMail };
