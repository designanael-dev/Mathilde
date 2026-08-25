import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, system } = req.body;

    if (!Array.isArray(messages) || !system) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = (response.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text);

    res.json({ content });
  } catch (error) {
    console.error("Anthropic error:", error);
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