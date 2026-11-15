require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.static("public"));

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { ok: false, error: "Too many order attempts. Please try again later." }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/orders", orderLimiter, upload.single("receipt"), async (req, res) => {
  try {
    if (!WEBHOOK_URL || !WEBHOOK_URL.startsWith("https://discord.com/api/webhooks/")) {
      return res.status(500).json({ ok: false, error: "Server webhook is not configured." });
    }

    const { customerName, contact, product, paymentMethod, reference, notes } = req.body;
    if (![customerName, contact, product, paymentMethod].every(v => typeof v === "string" && v.trim())) {
      return res.status(400).json({ ok: false, error: "Please complete the required order fields." });
    }

    const safe = value => String(value || "Not provided").trim().slice(0, 500);
    const embed = {
      title: "🟢 New SLIME STORE Order",
      color: 0x7CFC00,
      fields: [
        { name: "Customer", value: safe(customerName), inline: true },
        { name: "Contact", value: safe(contact), inline: true },
        { name: "Product", value: safe(product), inline: false },
        { name: "Payment Method", value: safe(paymentMethod), inline: true },
        { name: "Reference", value: safe(reference), inline: true },
        { name: "Notes", value: safe(notes), inline: false },
        { name: "Status", value: "PENDING — verify payment manually before delivering any key.", inline: false }
      ],
      timestamp: new Date().toISOString()
    };

    const form = new FormData();
    form.append("payload_json", JSON.stringify({ embeds: [embed] }));

    if (req.file) {
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      form.append("files[0]", blob, req.file.originalname || "receipt");
    }

    const response = await fetch(WEBHOOK_URL, { method: "POST", body: form });
    if (!response.ok) {
      console.error("Discord webhook returned", response.status);
      return res.status(502).json({ ok: false, error: "Could not send order notification to Discord." });
    }

    res.json({ ok: true, message: "Order submitted. Payment is still pending verification." });
  } catch (error) {
    console.error("Order error:", error.message);
    res.status(500).json({ ok: false, error: "Something went wrong while submitting the order." });
  }
});

app.listen(PORT, () => {
  console.log(`SLIME STORE server running on port ${PORT}`);
});
