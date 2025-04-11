import express from "express";
import { exec } from "child_process";
import "dotenv/config";

const { PORT, WEBHOOK_SECRET, PATH_PROYECT } = process.env;

const app = express();

app.use(express.json());

app.post("/webhook/rebuild", (req, res) => {
  const secret = req.headers["x-webhook-secret"]; // Header utilizado en el Webhook creado en Strapi

  if (secret !== WEBHOOK_SECRET) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  res.status(200).json({ message: "Rebuilding" });

  exec(`cd ${PATH_PROYECT} && node --run build`, (err, stdout, stderr) => {
    if (err) console.error("❌ Error in rebuild:", stderr);
    else console.log("✅ Rebuild complete:", stdout);
  });
});

app.listen(PORT, () => {
  console.log(`🟢 Webhook listen in http://localhost:${PORT}`);
});
