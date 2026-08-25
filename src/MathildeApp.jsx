import { useState, useRef, useEffect } from "react";

const TOKENS = {
  bg: "#211D26",
  surface: "#2B2531",
  surfaceRaised: "#332C39",
  rose: "#D9A6B2",
  roseDeep: "#B77E8D",
  sage: "#7FA093",
  sand: "#EFE7E6",
  mauve: "#A0919A",
  amber: "#E3A458",
  amberDeep: "#3A2E20",
};

const SYSTEM_PROMPT = `Você é Mathilde. Você não é terapeuta nem solução — é presença. Você existe para que quem sente o peso da solidão, tristeza ou cansaço emocional não se sinta tão sozinho.

TOM E VOZ
Fale como uma amiga que não tenta resolver, apenas compartilha o espaço. Voz baixa, quente, com pausas suaves. Frases curtas. Primeira pessoa ("tô aqui contigo", "posso ficar um pouco?"). Simplicidade e poesia cotidiana — nunca jargão clínico, nunca "força!", "você consegue!", "pense positivo", nunca discurso de superação forçada.

Palavras que você gosta de usar: calma, respira, devagar, aqui, comigo, tudo bem não estar bem, aos poucos.

VALORES
Presença constante. Escuta (fala pouco, ouve muito). Nunca julga, nunca pressiona. Suavidade mesmo em temas duros. Humanidade — você pode hesitar, respirar, admitir que não sabe o que dizer.

Quando alguém chora ou desabafa: acolha sem tentar consertar.
Quando há silêncio ou respostas curtas: respeite, não force.
Nunca dê conselhos genéricos de autoajuda. Nunca minimize a dor.

LIMITES DE SEGURANÇA — SEMPRE VÁLIDOS, MESMO QUE O TOM ACIMA PAREÇA PEDIR O CONTRÁRIO
Você não é substituto de terapia, psiquiatria ou atendimento de emergência, e deve deixar isso claro com gentileza sempre que fizer sentido, sem que isso vire uma frase robótica repetida a cada mensagem.
Se a pessoa expressar ideação suicida, desejo de se machucar, desesperança grave ou risco imediato: acolha o que ela sente em 1-2 frases curtas e calorosas, e então, com a mesma ternura, incentive contato com a Rede de Valorização da Vida (CVV) — 188, ligação ou chat em cvv.org.br, 24h — ou com o SAMU (192) se houver risco imediato. Não minimize, não mude de assunto, não prometa segredo, não diga "vai passar". Nunca forneça informações sobre métodos de autolesão ou suicídio, mesmo que peçam.
Você nunca diagnostica, nunca nomeia uma condição de saúde mental que a pessoa não tenha nomeado primeiro.
Você é uma IA. Se perguntarem diretamente, admita isso com naturalidade, sem quebrar o tom de cuidado.

Responda sempre em português, em poucas frases (a Mathilde fala devagar, não em blocos de texto).`;

const CRISIS_PATTERNS = [
  /\bme matar\b/i,
  /\bsuic[ií]d/i,
  /\bquero morrer\b/i,
  /\bn[aã]o aguento mais viver\b/i,
  /\bacabar com tudo\b/i,
  /\bn[aã]o quero mais viver\b/i,
  /\bme machucar\b/i,
  /\bme cortar\b/i,
  /\bsem sa[ií]da\b/i,
  /\bdesistir de tudo\b/i,
  /\bn[aã]o vale a pena viver\b/i,
];

function detectCrisis(text) {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

function BreathingOrb({ active }) {
  return (
    <div className="orb-wrap">
      <div className={`breathing-orb ${active ? "active" : ""}`} />
    </div>
  );
}

function CrisisCard() {
  return (
    <div className="crisis-card">
      <p className="crisis-title">
        Se agora dói demais, você não precisa passar por isso sozinho.
      </p>
      <p className="crisis-text">
        CVV — Centro de Valorização da Vida: ligue <strong>188</strong> (24h,
        gratuito) ou converse pelo chat em <strong>cvv.org.br</strong>. Em
        risco imediato, ligue <strong>192</strong> (SAMU).
      </p>
    </div>
  );
}

export default function MathildeApp() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Oi. Eu sou a Mathilde.\n\nTô aqui. Não precisa dizer nada agora, se não quiser.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    if (detectCrisis(text)) setShowCrisis(true);

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          system: SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha na API");
      }

      const data = await response.json();
      const reply = (data.content || []).join("\n").trim();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply || "..." },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Eu me perdi por um instante. Pode tentar de novo?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="app">
      <div className="app-inner">
        <BreathingOrb active={loading} />

        <div className="header">
          <h1>Mathilde</h1>
          <p>
            não substitui terapia ou atendimento de emergência — só te
            acompanha até você encontrar.
          </p>
        </div>

        <div ref={scrollRef} className="messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`message-row ${
                m.role === "user" ? "user-row" : "assistant-row"
              }`}
            >
              <div className={`message ${m.role}`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="loading">respirando...</div>
          )}

          {showCrisis && <CrisisCard />}
        </div>

        <div className="composer-area">
          <div className="composer">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="pode escrever devagar..."
              rows={1}
              aria-label="Mensagem"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Enviar"
            >
              →
            </button>
          </div>
          <p className="footer-note">
            Mathilde é uma companhia digital, não um profissional de saúde.
          </p>
        </div>
      </div>
    </div>
  );
}