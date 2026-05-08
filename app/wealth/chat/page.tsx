"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Portfolio, ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "مرحبا! 👋 I'm your personal halal investment analyst. I know your portfolio and can analyze any EGX or US stock. Ask me anything — market conditions, specific stocks, portfolio strategy, or halal screening.\n\n*Try: \"Should I add more COMI?\" or \"What are some halal ETFs?\" or \"Analyze AAPL for me\"*",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/portfolio").then((r) => r.json()).then(setPortfolio).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const allMessages = [...messages, userMsg];
    const apiMessages = allMessages.map((m) => ({
      role: m.role === "user" ? "user" : "model" as const,
      parts: [{ text: m.content }],
    }));

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, portfolio }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = { role: "assistant", content: data.response ?? "Sorry, no response received.", timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Couldn't reach the AI — please try again.", timestamp: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const SUGGESTIONS = [
    "What's my portfolio risk level?",
    "Best halal EGX stocks to watch",
    "Is COMI a good buy right now?",
    "Explain the current EGX situation",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="text-2xl font-bold mb-1">AI Analyst</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          Powered by Gemini Flash • Halal-first • Portfolio-aware
          {portfolio && <span className="ml-2 text-[var(--accent-green)]">✓ Portfolio loaded ({portfolio.holdings.length} holdings)</span>}
        </p>
      </motion.div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[var(--accent-blue)] text-white rounded-br-sm"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3">
                <ThinkingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground-subtle)] transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about any stock, your portfolio, or the market..."
          className="bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] resize-none min-h-[44px] max-h-[120px]"
          rows={1}
        />
        <Button onClick={send} disabled={loading || !input.trim()} className="bg-[var(--accent-blue)] hover:opacity-90 text-white h-11 px-4 flex-shrink-0">
          {loading ? "..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-muted)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
}
