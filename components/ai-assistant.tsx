"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type BuildIds = Record<string, string>;

interface Message {
  role: "user" | "assistant";
  content: string;
  buildIds?: BuildIds;
  buildTier?: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "¡Hola! Soy Chipi, el asistente de hardware de la tienda. Cuéntame qué tipo de PC necesitas y con qué presupuesto, y te monto las mejores opciones con el stock actual. 🖥️",
};

export function AiAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadInBuilder = (buildIds: BuildIds) => {
    localStorage.setItem("ai_suggested_build", JSON.stringify(buildIds));
    setOpen(false);
    router.push("/builder");
  };

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setLoading(true);

    try {
      // Build conversation history to send to the API.
      // - Build messages (multi-line component lists) are summarised so the LLM
      //   sees clean context instead of truncated lists that lose the budget info.
      // - Regular messages are capped at 500 chars (generous but not infinite).
      const history = messages.map((m) => {
        if (m.role === "assistant" && m.buildIds) {
          const tier = m.buildTier ? `tier ${m.buildTier}` : "build generada";
          return { role: m.role as "user" | "assistant", content: `[${tier}]` };
        }
        return {
          role: m.role as "user" | "assistant",
          content: m.content.length > 500 ? m.content.slice(0, 500) + "…" : m.content,
        };
      });

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, messages: history }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor (${response.status})`);
      }

      const payload = await response.json();
      const newMessages: Message[] = [];

      if (payload.builds && payload.builds.length > 0) {
        // Intro message
        if (payload.answer) {
          newMessages.push({ role: "assistant", content: payload.answer });
        }
        // One message per build with its own button
        for (const build of payload.builds) {
          newMessages.push({
            role: "assistant",
            content: build.answer,
            buildIds: build.buildIds,
            buildTier: build.tier,
          });
        }
      } else {
        newMessages.push({
          role: "assistant",
          content: payload.answer ?? "No pude responder ahora.",
        });
      }

      setMessages((current) => [...current, ...newMessages]);
    } catch (err) {
      console.error("[ai-assistant] fetch error:", err);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Lo siento, no puedo responder en este momento. Inténtalo de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  };

  return (
    <>
      {/* Floating orb button */}
      <style>{`
        /* IDLE: vagabundeo curioso, rotaciones errantes */
        @keyframes orb-idle-move {
          0%   { transform: translate(0px,   0px)  rotate(0deg)   scale(1);    }
          6%   { transform: translate(2px,  -5px)  rotate(34deg)  scale(1.03); }
          13%  { transform: translate(-2px, -3px)  rotate(18deg)  scale(1.01); }
          21%  { transform: translate(-4px, -8px)  rotate(-20deg) scale(0.97); }
          29%  { transform: translate(1px,  -2px)  rotate(-44deg) scale(1.02); }
          37%  { transform: translate(3px,  -9px)  rotate(-12deg) scale(1.05); }
          45%  { transform: translate(-2px, -4px)  rotate(58deg)  scale(0.98); }
          52%  { transform: translate(0px,  -7px)  rotate(74deg)  scale(1.04); }
          60%  { transform: translate(-3px, -2px)  rotate(28deg)  scale(1.01); }
          68%  { transform: translate(2px, -10px)  rotate(-26deg) scale(0.96); }
          75%  { transform: translate(-1px, -5px)  rotate(-52deg) scale(1.03); }
          83%  { transform: translate(3px,  -3px)  rotate(14deg)  scale(1.0);  }
          91%  { transform: translate(-2px, -6px)  rotate(-6deg)  scale(1.02); }
          100% { transform: translate(0px,   0px)  rotate(0deg)   scale(1);    }
        }
        @keyframes orb-idle-glow {
          0%   { box-shadow: 0 4px 18px rgba(90,60,200,0.28), 0 0 0 0   rgba(130,80,230,0.0);  }
          30%  { box-shadow: 0 6px 28px rgba(60,80,220,0.46), 0 0 0 7px rgba(100,60,240,0.06); }
          55%  { box-shadow: 0 3px 14px rgba(110,50,180,0.22), 0 0 0 0  rgba(130,80,230,0.0);  }
          80%  { box-shadow: 0 8px 36px rgba(70,90,210,0.52), 0 0 0 9px rgba(90,70,255,0.05);  }
          100% { box-shadow: 0 4px 18px rgba(90,60,200,0.28), 0 0 0 0   rgba(130,80,230,0.0);  }
        }

        /* OPEN: respira despacio, quieto, atento — leve pulso de escala */
        @keyframes orb-open-breathe {
          0%   { transform: translate(0px, 0px) rotate(0deg)  scale(1);    }
          18%  { transform: translate(0px,-1px) rotate(4deg)  scale(1.06); }
          36%  { transform: translate(0px, 0px) rotate(0deg)  scale(1.02); }
          54%  { transform: translate(0px,-1px) rotate(-4deg) scale(1.07); }
          72%  { transform: translate(0px, 0px) rotate(0deg)  scale(1.01); }
          90%  { transform: translate(0px,-1px) rotate(3deg)  scale(1.05); }
          100% { transform: translate(0px, 0px) rotate(0deg)  scale(1);    }
        }
        @keyframes orb-open-glow {
          0%   { box-shadow: 0 0 14px 2px rgba(100,80,240,0.30), 0 0 0 0   rgba(120,100,255,0.0);  }
          40%  { box-shadow: 0 0 28px 6px rgba(80,100,255,0.55), 0 0 0 12px rgba(120,100,255,0.10); }
          100% { box-shadow: 0 0 14px 2px rgba(100,80,240,0.30), 0 0 0 0   rgba(120,100,255,0.0);  }
        }

        .orb-btn-idle {
          animation: orb-idle-move 24s cubic-bezier(0.45,0.05,0.55,0.95) infinite,
                     orb-idle-glow 11s ease-in-out infinite;
          transition: box-shadow 0.6s ease, border-color 0.6s ease;
        }
        .orb-btn-open {
          animation: orb-open-breathe 4s ease-in-out infinite,
                     orb-open-glow   4s ease-in-out infinite;
          border-color: rgba(160,120,255,0.55) !important;
          transition: box-shadow 0.6s ease, border-color 0.6s ease;
        }
        .orb-btn-idle:hover,
        .orb-btn-open:hover {
          animation-play-state: paused;
          filter: brightness(1.08);
        }
      `}</style>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir asistente AI"
        className={`fixed bottom-5 right-5 z-50 overflow-hidden rounded-full active:scale-95 ${open ? "orb-btn-open" : "orb-btn-idle"}`}
        style={{
          height: 56,
          width: 56,
          backgroundImage: "url('/orb-3.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "2px solid rgba(255,255,255,0.25)",
        }}
      />


      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-[74px] right-5 z-50 flex flex-col overflow-hidden rounded-2xl bg-[var(--bg-card)] shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
          style={{ border: "1px solid var(--border)", width: 380, maxHeight: 540 }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--text-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-[var(--text-primary)]">Asistente AI</p>
                <p className="text-[11px] leading-tight text-[var(--text-tertiary)]">Hardware &amp; compatibilidad</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Clear conversation */}
              <button
                type="button"
                onClick={handleClear}
                title="Nueva conversación"
                className="rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-secondary)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
              {/* Close */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ minHeight: 320, maxHeight: 360 }}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.role === "assistant"
                    ? "rounded-tl-sm bg-[var(--bg-subtle)] text-[var(--text-primary)]"
                    : "ml-auto rounded-tr-sm bg-[var(--text-primary)] text-white"
                }`}
              >
                <span style={{ whiteSpace: "pre-line" }}>{message.content}</span>
                {message.buildIds && (
                  <button
                    type="button"
                    onClick={() => loadInBuilder(message.buildIds!)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--accent)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    Cargar esta build en el Builder
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[var(--bg-subtle)] px-3.5 py-2.5">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 px-3.5 py-3.5"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu pregunta..."
              className="input-base flex-1 px-3.5 py-2.5 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}