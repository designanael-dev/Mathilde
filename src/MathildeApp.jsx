
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

function BreathingOrb({ active, large = false }) {
  return (
    <div className={`orb-wrap ${large ? "large" : ""}`}>
      <div
        className={`breathing-orb ${active ? "active" : ""} ${
          large ? "large" : ""
        }`}
      />
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

function GlobeIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18" />
      <path d="M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

export default function MathildeApp() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLanguages, setShowLanguages] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Oii! Eu sou a Mathilde.\n\nQue bom que você chegou. Estou aqui para conversar, ouvir e fazer companhia. Não sou terapeuta, mas posso ser uma amiga para conversar. Pode chegar do seu jeito.",
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

    if (detectCrisis(text)) {
      setShowCrisis(true);
    }

    const nextMessages = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Falha na API");
      }

      const data = await response.json();
      const reply = (data.reply || "").trim();

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

  if (showWelcome) {
    return (
      <div className="welcome">
        <button
          className="globe-button"
          onClick={() => setShowLanguages(!showLanguages)}
          aria-label="Opções de idioma"
          aria-expanded={showLanguages}
          title="Idiomas"
        >
          <GlobeIcon />
        </button>

        {showLanguages && (
          <div
            role="status"
            style={{
              position: "absolute",
              top: "76px",
              right: "22px",
              width: "220px",
              padding: "16px",
              borderRadius: "14px",
              background: TOKENS.surface,
              border: `1px solid ${TOKENS.surfaceRaised}`,
              color: TOKENS.sand,
              zIndex: 2,
              boxShadow: "0 8px 28px #00000033",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Idiomas
            </p>
            <p
              style={{
                margin: 0,
                color: TOKENS.mauve,
                fontSize: "12px",
                lineHeight: 1.6,
              }}
            >
              Novos idiomas estarão disponíveis em breve. A Mathilde está
              se preparando para conversar com mais pessoas pelo mundo.
            </p>
          </div>
        )}

        <div className="welcome-content">
          <BreathingOrb large />

          <h1 className="welcome-title">Mathilde</h1>

          <p className="welcome-text">
            Um espaço para conversar, respirar e ser você.
            No seu tempo, do seu jeito.
          </p>

          <button
            className="start-button"
            onClick={() => setShowWelcome(false)}
          >
            Começar a conversar
            <span aria-hidden="true">→</span>
          </button>

          <p className="welcome-note">
            Não sou terapeuta. Sou uma companhia digital, feita para
            ouvir e conversar com você.
          </p>
        </div>
      </div>
    );
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
