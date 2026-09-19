const nodemailer = require('nodemailer');

let transporter;
let isTestAccount = false;

async function getTransporter() {
  if (transporter) return transporter;

  // Create an Ethereal test account for development
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
