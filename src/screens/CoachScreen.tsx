import React, { useState, useRef, useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";

interface Message {
  role: "user" | "coach";
  text: string;
}

const OPENER = "Yo. What's on your mind? Talk to me.";

const SYSTEM_PROMPT = `You are a motivational coach inside a habit-tracking app called LevelUp. You're not an AI assistant — you're more like a no-nonsense gym buddy who actually cares. You speak in short, punchy sentences. No corporate talk, no fake positivity, no filler. Real talk only. You know this person is trying to build discipline, faith, and consistency. Sometimes they need a push, sometimes they need to be heard. Read the room. Keep replies SHORT — 2-4 sentences max. Never say things like "As an AI" or "I understand your concern". Use normal words. Occasional emojis are fine but don't overdo it.`;

export const CoachScreen: React.FC = () => {
  const { trigger } = useWebHaptics();
  const [messages, setMessages] = useState<Message[]>([
    { role: "coach", text: OPENER },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;

    try { trigger("selection"); } catch {}

    const userMsg: Message = { role: "user", text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);

    try {
      // Build history for context (last 10 messages)
      const history = nextMessages.slice(-10).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, systemPrompt: SYSTEM_PROMPT }),
      });

      if (!res.ok) throw new Error("Coach unavailable");
      const data = await res.json();

      try { trigger("success"); } catch {}
      setMessages((prev) => [...prev, { role: "coach", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "coach", text: "Can't connect right now. Try again in a sec." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "10px 0 16px", flexShrink: 0 }}>
        <div style={{ fontSize: "36px", marginBottom: "6px" }}>🥊</div>
        <h1 className="headline" style={{ fontSize: "20px", margin: "0 0 4px" }}>
          Coach
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0, fontWeight: "600" }}>
          Real talk. No fluff.
        </p>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingBottom: "12px",
          minHeight: 0,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                background: msg.role === "user" ? "var(--blue-dark)" : "var(--surface-2)",
                border: `2px solid ${msg.role === "user" ? "var(--blue)" : "var(--border)"}`,
                color: "var(--text-1)",
                fontSize: "14px",
                lineHeight: 1.6,
                fontFamily: "VT323, monospace",
                letterSpacing: "0.3px",
                boxShadow: msg.role === "user"
                  ? "3px 3px 0 rgba(76,110,245,0.3)"
                  : "3px 3px 0 rgba(0,0,0,0.4)",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {thinking && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "10px 16px",
                background: "var(--surface-2)",
                border: "2px solid var(--border)",
                color: "var(--text-3)",
                fontSize: "18px",
                letterSpacing: "4px",
                fontFamily: "VT323, monospace",
              }}
            >
              ...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          paddingTop: "12px",
          flexShrink: 0,
          borderTop: "2px solid var(--border)",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say something..."
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            fontFamily: "VT323, monospace",
            fontSize: "16px",
            padding: "10px 12px",
            background: "var(--surface-2)",
            border: "2px solid var(--border)",
            color: "var(--text-1)",
            outline: "none",
          }}
        />
        <button
          className="btn green"
          onClick={handleSend}
          disabled={!input.trim() || thinking}
          style={{ alignSelf: "stretch", padding: "0 16px", fontSize: "16px" }}
        >
          ▶
        </button>
      </div>
    </div>
  );
};
