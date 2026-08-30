import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

const APP_URL =
  process.env.APP_URL || "https://mathilde-7md2.onrender.com";

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Dados inválidos.",
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": APP_URL,
          "X-Title": "Mathilde",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          max_tokens: 1000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", errorText);

      return res.status(500).json({
        error: "Não foi possível conversar com a Mathilde agora.",
      });
    }

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content?.trim() || "";

    res.json({ reply });
  } catch (error) {
    console.error("OpenRouter error:", error);

    res.status(500).json({
      error: "Não foi possível conversar com a Mathilde agora.",
    });
  }
});

const distPath = path.join(__dirname, "..", "dist");

app.use(express.static(distPath));

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Mathilde rodando na porta ${port}`);
});
