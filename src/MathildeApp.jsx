import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";

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
        CVV — Centro de Valorização da Vida: ligue{" "}
        <strong>188</strong> (24h, gratuito) ou converse pelo chat em{" "}
        <strong>cvv.org.br</strong>. Em risco imediato, ligue{" "}
        <strong>192</strong> (SAMU).
      </p>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Preencha seu e-mail e sua senha.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    if (data.session) {
      onLogin(data.session);
    }

    setLoading(false);
  }

  return (
    <div className="app">
      <div className="app-inner">
        <BreathingOrb active={false} />

        <div className="header">
          <h1>Mathilde</h1>

          <p>
            não substitui terapia ou atendimento de emergência — só te
            acompanha até você encontrar.
          </p>
        </div>

        <div className="login-container">
          <h2>Oii 🌿</h2>

          <p className="login-intro">
            A Mathilde ainda está crescendo aos poucos.
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="email">E-mail</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />

            <label htmlFor="password">Senha</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="sua senha"
              autoComplete="current-password"
            />

            {error && <p className="login-error">{error}</p>}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "entrando..." : "Entrar"}
            </button>
          </form>

          <p className="login-note">
            O acesso à Mathilde está sendo feito por convite.
          </p>
        </div>
      </div>
    </div>
  );
}

function Chat({ onLogout }) {
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
      {
        role: "user",
        content: text,
      },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? {
                Authorization: `Bearer ${session.access_token}`,
              }
            : {}),
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
        {
          role: "assistant",
          content: reply || "...",
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Eu me perdi por um instante. Pode tentar de novo?",
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

  async function handleLogout() {
    await supabase.auth.signOut();
    onLogout();
  }

  return (
    <div className="app">
      <div className="app-inner">
        <BreathingOrb active={loading} />

        <div className="header">
          <div className="header-top">
            <h1>Mathilde</h1>

            <button
              onClick={handleLogout}
              className="logout-button"
              type="button"
            >
              sair
            </button>
          </div>

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
                m.role === "user"
                  ? "user-row"
                  : "assistant-row"
              }`}
            >
              <div className={`message ${m.role}`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="loading">
              respirando...
            </div>
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
            Mathilde é uma companhia digital, não um profissional de
            saúde.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MathildeApp() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
        setCheckingSession(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <div className="app">
        <div className="app-inner">
          <BreathingOrb active={true} />

          <div className="header">
            <h1>Mathilde</h1>

            <p>
              um instante...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <LoginScreen
        onLogin={(newSession) => setSession(newSession)}
      />
    );
  }

  return (
    <Chat
      onLogout={() => setSession(null)}
    />
  );
}
