require("dotenv").config();
const axios = require("axios");

const key = process.env.BREVO_API_KEY;
const from = process.env.EMAIL_FROM || "hearthandhealorg@gmail.com";
const to = process.env.TEST_EMAIL_TO || from;

if (!key) {
  console.error("Set BREVO_API_KEY in .env (Brevo → Settings → SMTP & API → API keys).");
  process.exit(1);
}

axios
  .post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Hearth & Heal Test", email: from },
      to: [{ email: to }],
      subject: "Brevo test",
      textContent: "If you see this, Brevo is configured correctly.",
    },
    {
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  )
  .then(() => console.log("Email sent successfully to", to))
  .catch((err) => {
    console.error("Brevo Error:", err.response?.data || err.message);
    process.exit(1);
  });
