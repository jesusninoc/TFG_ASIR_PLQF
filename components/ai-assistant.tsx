"use client";

import { FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useStore } from "./store-provider";
import { normalizeBuildIds, normalizeSelectionIds, AI_BUILDER_LOAD_EVENT, AI_SUGGESTED_FULL_BUILD_KEY, AI_SUGGESTED_PARTIAL_SELECTION_KEY } from "@/lib/builder-transfer";
import { BuildCard } from "./build-card";
import { ComponentCard } from "./component-card";
import { sanitizeMarkdown } from "@/lib/sanitizer";
import { TOGGLE_AI_ASSISTANT_EVENT } from "@/lib/assistant/assistant-events";
import { getAssistantLoadingMessages } from "@/lib/assistant/loading-messages";
import type { AgentResponse, BuildIds, BuildMessage, ComponentRecommendation, PartialSelection } from "@/lib/types";
import { Bot } from "lucide-react";
import { DotsSpinner } from "./dots";

type Message = {
  role: "user" | "assistant";
  content: string;
  build?: BuildMessage;
  components?: ComponentRecommendation[];
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "¡Hola! Soy Chipi, tu guía de hardware en la tienda. Puedo ayudarte con lo que estás viendo, revisar tu carrito, resolver dudas frecuentes o montar una configuración con el stock actual.",
};

const ASSISTANT_MESSAGES_STORAGE_KEY = "pc_selector_ai_assistant_messages";
const ASSISTANT_OPEN_STORAGE_KEY = "pc_selector_ai_assistant_open";
const MAX_PERSISTED_MESSAGES = 50;

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Partial<Message>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

function loadPersistedMessages(): Message[] {
  if (typeof window === "undefined") {
    return [INITIAL_MESSAGE];
  }

  const raw = sessionStorage.getItem(ASSISTANT_MESSAGES_STORAGE_KEY);
  if (!raw) {
    return [INITIAL_MESSAGE];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      sessionStorage.removeItem(ASSISTANT_MESSAGES_STORAGE_KEY);
      return [INITIAL_MESSAGE];
    }

    const messages = parsed.filter(isMessage).slice(-MAX_PERSISTED_MESSAGES);
    return messages.length > 0 ? messages : [INITIAL_MESSAGE];
  } catch {
    sessionStorage.removeItem(ASSISTANT_MESSAGES_STORAGE_KEY);
    return [INITIAL_MESSAGE];
  }
}

function loadPersistedOpenState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(ASSISTANT_OPEN_STORAGE_KEY) === "true";
}

function extractFirstJsonObject(text: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        start = index;
      }
      depth++;
      continue;
    }

    if (char === "}") {
      if (depth === 0) {
        continue;
      }

      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function tryParseAgentResponse(text?: string): AgentResponse | null {
  if (!text) {
    return null;
  }

  const trimmed = text.trim();
  const candidates = [
    trimmed,
    trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(),
  ];

  const embeddedJson = extractFirstJsonObject(trimmed);
  if (embeddedJson) {
    candidates.push(embeddedJson);
  }

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      let parsed: unknown = JSON.parse(candidate);

      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }

      if (!parsed || typeof parsed !== "object") {
        continue;
      }

      const possibleResponse = parsed as AgentResponse;
      if (possibleResponse.answer || possibleResponse.builds || possibleResponse.components) {
        return possibleResponse;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeBuildMessage(build: BuildMessage): BuildMessage {
  return {
    ...build,
    buildIds: normalizeBuildIds(build.buildIds) ?? {},
    componentRecommendations: Array.isArray(build.componentRecommendations) ? build.componentRecommendations : [],
  };
}

function normalizeAgentResponse(payload: AgentResponse): AgentResponse {
  const parsedFromAnswer = (!payload.builds?.length && !payload.components?.length)
    ? tryParseAgentResponse(payload.answer)
    : null;
  const resolved = parsedFromAnswer ?? payload;

  if (parsedFromAnswer?.builds?.length) {
    console.warn("[ai-assistant] rescued structured build payload from answer text", {
      builds: parsedFromAnswer.builds.length,
    });
  }

  return {
    ...payload,
    ...resolved,
    answer: resolved.answer?.trim() || resolved.clarifyQuestion || payload.answer?.trim() || payload.clarifyQuestion || "",
    references: Array.isArray(resolved.references) ? resolved.references : [],
    components: Array.isArray(resolved.components) ? resolved.components : undefined,
    builds: Array.isArray(resolved.builds) ? resolved.builds.map(normalizeBuildMessage) : undefined,
    builderPayload: resolved.builderPayload
      ? {
          fullBuildIds: normalizeBuildIds(resolved.builderPayload.fullBuildIds),
          partialSelection: normalizeSelectionIds(resolved.builderPayload.partialSelection),
        }
      : undefined,
  };
}

function buildResultIntro(builds: BuildMessage[]): string {
  const count = builds.length;
  return count === 1
    ? "He preparado esta configuración compatible. Te dejo los componentes en la tarjeta."
    : `He preparado ${count} configuraciones compatibles. Te dejo los componentes en cada tarjeta.`;
}

const MarkdownMessage = memo(function MarkdownMessage({ content }: { content: string }) {
  const sanitizedHtml = useMemo(() => sanitizeMarkdown(content), [content]);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
});

export function AiAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { items: cartItems, addRecommendationToCart } = useStore();
  const [open, setOpen] = useState(loadPersistedOpenState);
  const [messages, setMessages] = useState<Message[]>(loadPersistedMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(() => getAssistantLoadingMessages(""));
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem(
      ASSISTANT_MESSAGES_STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_PERSISTED_MESSAGES)),
    );
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(ASSISTANT_OPEN_STORAGE_KEY, String(open));
  }, [open]);

  // Ajustar padding del body cuando el sidebar está expandido (desktop)
  useEffect(() => {
    const updateBodyPadding = () => {
      if (typeof window === "undefined") return;
      if (open && window.innerWidth >= 768) {
        document.body.style.paddingRight = "400px";
        document.body.style.transition = "padding-right 0.3s ease";
      } else {
        document.body.style.paddingRight = "";
        document.body.style.transition = "";
      }
    };

    updateBodyPadding();
    window.addEventListener("resize", updateBodyPadding);
    return () => window.removeEventListener("resize", updateBodyPadding);
  }, [open]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    const handleToggle = () => {
      setOpen((value) => !value);
    };

    window.addEventListener(TOGGLE_AI_ASSISTANT_EVENT, handleToggle);
    return () => window.removeEventListener(TOGGLE_AI_ASSISTANT_EVENT, handleToggle);
  }, []);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((index) => (index + 1) % loadingMessages.length);
    }, 3300);

    return () => window.clearInterval(interval);
  }, [loading, loadingMessages.length]);

  const loadInBuilder = useCallback((buildIds?: BuildIds, partialSelection?: PartialSelection) => {
    const normalizedBuildIds = normalizeBuildIds(buildIds);
    const normalizedPartialSelection = normalizeSelectionIds(partialSelection);

    if (normalizedBuildIds) {
      localStorage.setItem(AI_SUGGESTED_FULL_BUILD_KEY, JSON.stringify(normalizedBuildIds));
      localStorage.removeItem(AI_SUGGESTED_PARTIAL_SELECTION_KEY);
    } else if (normalizedPartialSelection) {
      localStorage.setItem(AI_SUGGESTED_PARTIAL_SELECTION_KEY, JSON.stringify(normalizedPartialSelection));
      localStorage.removeItem(AI_SUGGESTED_FULL_BUILD_KEY);
    }

    window.dispatchEvent(new Event(AI_BUILDER_LOAD_EVENT));
    setOpen(false);
    router.push("/builder");
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setLoadingMessages(getAssistantLoadingMessages(question));
    setLoadingMessageIndex(0);
    setLoading(true);

    try {
      const history = messages.map((m) => {
        if (m.role === "assistant" && m.build) {
          return {
            role: m.role as "user" | "assistant",
            content: `[build ${m.build.tier}] ${m.build.answer}`.slice(0, 500),
          };
        }
        if (m.role === "assistant" && m.components?.length && !m.content) {
          return {
            role: m.role as "user" | "assistant",
            content: `[${m.components.length} componentes recomendados]`,
          };
        }
        return {
          role: m.role as "user" | "assistant",
          content: m.content.length > 500 ? m.content.slice(0, 500) + "…" : m.content,
        };
      });

      const context = {
        currentPage: pathname,
        currentProductId: params?.slug as string | undefined,
        cart: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          priceCents: item.product.priceCents,
          name: item.product.name,
          type: item.product.type,
        })),
      };

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, context }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor (${response.status})`);
      }

      const payload = normalizeAgentResponse(await response.json() as AgentResponse);

      // Manejar navegación automática sugerida por la IA
      if (payload.navigation) {
        const { path, buildIds } = payload.navigation;
        if (buildIds) {
          localStorage.setItem(AI_SUGGESTED_FULL_BUILD_KEY, JSON.stringify(buildIds));
          localStorage.removeItem(AI_SUGGESTED_PARTIAL_SELECTION_KEY);
        }
        router.push(path);
        setOpen(false);
        return;
      }

      const newMessages: Message[] = [];

      if (payload.builds && payload.builds.length > 0) {
        newMessages.push({ role: "assistant", content: buildResultIntro(payload.builds) });
        for (const build of payload.builds) {
          newMessages.push({ role: "assistant", content: "", build });
        }
      } else if (payload.components && payload.components.length > 0) {
        if (payload.answer) {
          newMessages.push({ role: "assistant", content: payload.answer });
        }
        newMessages.push({ role: "assistant", content: "", components: payload.components });
      } else {
        const answer = payload.answer || payload.clarifyQuestion;
        if (!answer?.trim()) {
          console.warn("[ai-assistant] Empty answer received, using default. Payload:", payload);
        }
        newMessages.push({ role: "assistant", content: answer || "No pude responder ahora." });
      }

      setMessages((current) => [...current, ...newMessages]);
    } catch (err) {
      console.error("[ai-assistant] fetch error:", err);
      setMessages((current) => [...current, { role: "assistant", content: "Lo siento, no puedo responder en este momento. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = useCallback(() => {
    sessionStorage.removeItem(ASSISTANT_MESSAGES_STORAGE_KEY);
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  }, []);

  // Helper: renderizar cabecera del sidebar
  const renderHeader = () => (
    <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Chipi</p>
            <p className="text-xs text-gray-500 leading-tight">Hardware &amp; compatibilidad</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClear}
            title="Nueva conversación"
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Nueva conversación"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar asistente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          {message.build ? (
            <div className="w-full max-w-sm">
              <BuildCard build={message.build} onLoad={() => loadInBuilder(message.build!.buildIds)} />
            </div>
          ) : message.components && message.components.length > 0 && !message.content ? (
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {message.components.map((comp) => (
                <ComponentCard
                  key={comp.id}
                  recommendation={comp}
                  onAddToCart={addRecommendationToCart}
                  onViewProduct={() => router.push(`/product/${comp.productLink.split('/').pop()}`)}
                />
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[88%] ${
              message.role === "assistant"
                ? "text-gray-900"
                : "bg-gray-100 text-gray-900 rounded-tl-none"
            }`}>
              <MarkdownMessage content={message.content} />
            </div>
          )}
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div
            className="max-w-[88%] px-4 py-2.5 text-sm text-gray-700"
            role="status"
            aria-live="polite"
          >
            <span className="inline-flex items-center gap-2">
              <DotsSpinner color="#6a7282" />
              <span>{loadingMessages[loadingMessageIndex] ?? "Preparando la respuesta..."}</span>
            </span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderFooter = () => (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 px-4 py-3 border-t border-gray-200">
      <div className="flex-1 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          rows={1}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white disabled:opacity-40 hover:bg-gray-800 transition-colors"
        aria-label="Enviar mensaje"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );

  // Si no está abierto, mostrar solo botón flotante minimalista
  if (!open) {
    return <></>
  }

  // Sidebar completo (desktop y mobile)
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed right-0 top-0 bottom-0 w-[400px] bg-white border-l border-gray-200 shadow-sm z-50 flex-col">
        {renderHeader()}
        {renderMessages()}
        {renderFooter()}        
      </div>

      {/* Mobile Overlay & Sidebar */}
      <div className="md:hidden fixed inset-0 z-50">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
        {/* Panel */}
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col">
          {renderHeader()}
          {renderMessages()}
          {renderFooter()}
        </div>
      </div>
    </>
  );
}
