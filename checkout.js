require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();
app.use(express.static(__dirname)); // Serve static files like the html
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "mpesa_test.html"));
});

const {
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_SHORTCODE,
    MPESA_PASSKEY,
    MPESA_CALLBACK_URL,
    MPESA_ENV
} = process.env;

const BASE_URL = MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

// Generate access token
async function getAccessToken() {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
    const res = await axios.get(
        `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        { headers: { Authorization: `Basic ${auth}` } }
    );
    return res.data.access_token;
}

// Timestamp helper
function getTimestamp() {
    const now = new Date();
    return (
        now.getFullYear().toString() +
        ("0" + (now.getMonth() + 1)).slice(-2) +
        ("0" + now.getDate()).slice(-2) +
        ("0" + now.getHours()).slice(-2) +
        ("0" + now.getMinutes()).slice(-2) +
        ("0" + now.getSeconds()).slice(-2)
    );
}

// Checkout → STK Push
app.post("/checkout", async (req, res) => {
    try {
        const { phone, amount } = req.body;
        const token = await getAccessToken();
        const timestamp = getTimestamp();
        const password = Buffer.from(MPESA_SHORTCODE + MPESA_PASSKEY + timestamp).toString("base64");

        const stkRes = await axios.post(
            `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
            {
                BusinessShortCode: MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone, // customer phone number (2547XXXXXXXX)
                PartyB: MPESA_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: MPESA_CALLBACK_URL,
                AccountReference: "HearthHeal",
                TransactionDesc: "Checkout Payment"
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        res.json({ message: "STK Push initiated", response: stkRes.data });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "STK Push failed" });
    }
});

// Callback endpoint
app.post("/checkout/callback", (req, res) => {
    console.log("M-Pesa Callback:", JSON.stringify(req.body, null, 2));
    // Save transaction details to DB here
    res.sendStatus(200);
});

// Avoid port conflict if app.js is running, but user provided this port.
// For safety, let's keep it as is, but user will need to run valid node env.
app.listen(3001, () => console.log("Checkout server running on port 3001"));
