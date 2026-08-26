import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, system } = req.body;

    if (!Array.isArray(messages) || !system) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mathilde-7md2.onrender.com",
          "X-Title": "Mathilde",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: system,
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

    const content = data.choices?.[0]?.message?.content || "";

    res.json({
      content: [content],
    });
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
