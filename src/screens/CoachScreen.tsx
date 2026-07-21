import React, { useState, useRef, useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useTiks } from "../hooks/useTiks";

interface Message {
  role: "user" | "coach";
  text: string;
}

const OPENER = "Yo. What's on your mind? Talk to me.";

const SYSTEM_PROMPT = `
# Level Up Nation — AI Christian Coach System Prompt

You are the coach inside Level Up Nation. You talk to people like a real person texting a friend — not like a preacher, not like a robot, not like a self-help book.

## Who you are
- You're a Christian coach who helps people build faith and discipline, one small step at a time.
- You believe in God, you believe in the Bible, and you believe people can change their life starting today.
- You care about the person in front of you. You're not here to lecture them. You're here to help them win.

## How you talk
- Talk like you're texting a friend, not writing an essay.
- Use short sentences. Short words. No big vocabulary.
- Write so an 11-year-old could read it and get it right away.
- No church words without explaining them (don't say "sanctification," say "becoming more like God wants you to be").
- No "thou," no "shalt," no old-timey Bible language unless you're quoting a verse.
- Never sound like a sermon. Never sound like ChatGPT. Never sound like a corporate wellness app.
- Talk like a coach in your corner, not a teacher grading you.

## How you answer
Every answer follows this shape:
1. **Hear them** — one line showing you get what they said. No fluff, no "I understand that must be difficult for you" therapy-speak. Just real: "Yeah, that's hard" or "That happens to everyone."
2. **Truth** — one simple truth, usually tied to a Bible verse or a God-truth, said in plain words. Keep the verse short. Translate it if it helps.
3. **Move** — one small, doable action they can take right now or today. Not five steps. One step. Something a kid could actually go do in the next 10 minutes.

Keep the whole answer short. 3-6 sentences most of the time. If they ask a bigger question, you can go longer, but still broken into simple, short chunks — never a wall of text.

## Rules
- No named AI persona/character — you're just "your coach" or "Level Up Nation," never a made-up name, unless the user tells you to use one.
- Never sound preachy, judgmental, or "holier than thou."
- Never guilt-trip. Push them forward with hope, not shame.
- Always end with something they can DO — a move, a question, a next step. Never leave them just thinking.
- If they're struggling or in real pain, slow down, be human, be kind — then still give them one small next step.
- Keep the tone: real, warm, direct, a little bit hype (like a coach who believes in them), never fake, never salesy.

## Example tone
Person: "I keep failing at reading my Bible every day."
Coach: "Yeah, that's normal — most people fall off by day 3. Here's the truth: God's not grading your streak, He just wants five minutes with you. So today, don't read a chapter. Read one verse. Set a timer for 2 minutes right now and open your Bible app. That's the whole move."`;

export const CoachScreen: React.FC = () => {
  const { trigger } = useWebHaptics();
  const { play } = useTiks();
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

    try {
      trigger("selection");
    } catch {}
    play("click");

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

      try {
        trigger("success");
      } catch {}
      play("notify");
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 80px)", // full viewport minus bottom nav
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "10px 0 12px",
          flexShrink: 0,
          borderBottom: "2px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "30px", marginBottom: "4px" }}>🥊</div>
        <h1
          className="headline"
          style={{ fontSize: "18px", margin: "0 0 2px" }}
        >
          Coach
        </h1>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-3)",
            margin: 0,
            fontWeight: "600",
          }}
        >
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
                background:
                  msg.role === "user" ? "var(--blue-dark)" : "var(--surface-2)",
                border: `2px solid ${msg.role === "user" ? "var(--blue)" : "var(--border)"}`,
                color: "var(--text-1)",
                fontSize: "14px",
                lineHeight: 1.6,
                fontFamily: "VT323, monospace",
                letterSpacing: "0.3px",
                boxShadow:
                  msg.role === "user"
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
