"use client";

import { useRef, useState } from "react";

const MODE_LABEL = {
  test: "Test mode: scripted bot, real pricing engine",
  live: "Live model",
};

function errorText(phone) {
  return `Something went wrong. Call us at ${phone}.`;
}

function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "var(--qb-space-2)",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          background: isUser ? "var(--qb-color-brand)" : "var(--qb-color-surface-muted)",
          color: isUser ? "var(--qb-color-brand-contrast)" : "var(--qb-color-text)",
          borderRadius: "var(--qb-radius-md)",
          padding: "var(--qb-space-3)",
          fontSize: "var(--qb-text-base)",
          lineHeight: "var(--qb-leading-normal)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {content}
      </div>
    </div>
  );
}

function QuickReplies({ options, onPick, disabled }) {
  if (!options || options.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--qb-space-2)",
        marginBottom: "var(--qb-space-4)",
      }}
    >
      {options.map((option, i) => (
        <button
          key={`${option.value}-${i}`}
          type="button"
          disabled={disabled}
          onClick={() => onPick(option)}
          style={{
            minHeight: "var(--qb-tap-target)",
            padding: "0 var(--qb-space-4)",
            borderRadius: "var(--qb-radius-pill)",
            border: "1px solid var(--qb-color-border)",
            background: "var(--qb-color-surface)",
            color: "var(--qb-color-text)",
            fontSize: "var(--qb-text-sm)",
            fontFamily: "var(--qb-font)",
            cursor: disabled ? "default" : "pointer",
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function EstimateCard({ outcome }) {
  if (outcome.status === "ok") {
    return (
      <div
        style={{
          background: "var(--qb-color-surface)",
          border: "1px solid var(--qb-color-border)",
          borderRadius: "var(--qb-radius-lg)",
          padding: "var(--qb-space-4)",
          marginBottom: "var(--qb-space-4)",
        }}
      >
        <div
          style={{
            fontSize: "var(--qb-text-2xl)",
            fontWeight: "var(--qb-weight-bold)",
            color: "var(--qb-color-text)",
            marginBottom: "var(--qb-space-2)",
          }}
        >
          ${outcome.low} to ${outcome.high}
        </div>
        {Array.isArray(outcome.included) && outcome.included.length > 0 && (
          <ul style={{ margin: 0, marginBottom: "var(--qb-space-2)", paddingLeft: "var(--qb-space-5)" }}>
            {outcome.included.map((item, i) => (
              <li key={i} style={{ fontSize: "var(--qb-text-base)", color: "var(--qb-color-text)" }}>
                {item}
              </li>
            ))}
          </ul>
        )}
        {outcome.disclaimer && (
          <p style={{ margin: 0, fontSize: "var(--qb-text-base)", color: "var(--qb-color-text-muted)" }}>
            {outcome.disclaimer}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--qb-color-surface)",
        border: "1px solid var(--qb-color-border)",
        borderRadius: "var(--qb-radius-lg)",
        padding: "var(--qb-space-4)",
        marginBottom: "var(--qb-space-4)",
      }}
    >
      <div style={{ fontSize: "var(--qb-text-lg)", fontWeight: "var(--qb-weight-bold)", marginBottom: "var(--qb-space-2)" }}>
        Status: {outcome.status}
      </div>
      {Array.isArray(outcome.reasons) && outcome.reasons.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: "var(--qb-space-5)" }}>
          {outcome.reasons.map((reason, i) => (
            <li key={i} style={{ fontSize: "var(--qb-text-base)", color: "var(--qb-color-text-muted)" }}>
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DevChat({ clientId, businessName, phone }) {
  const [messages, setMessages] = useState([]);
  const [job, setJob] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [last, setLast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, messages: nextMessages, job, conversationId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(errorText(phone));
        setLoading(false);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setJob(data.job ?? null);
      if (data.conversation_id) setConversationId(data.conversation_id);
      setLast(data);
      setLoading(false);
      scrollToBottom();
      // The input is disabled while waiting, which drops focus; give it back so typing continues.
      setTimeout(() => document.getElementById("dev-chat-input")?.focus(), 0);
    } catch {
      setError(errorText(phone));
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  function handleReset() {
    setMessages([]);
    setJob(null);
    setConversationId(null);
    setLast(null);
    setLoading(false);
    setError(null);
    setInput("");
  }

  const modeLabel = last?.mode ? MODE_LABEL[last.mode] ?? last.mode : null;

  return (
    <div
      style={{
        maxWidth: "var(--qb-page-max-width)",
        margin: "0 auto",
        padding: `var(--qb-space-4)`,
        display: "flex",
        flexDirection: "column",
        gap: "var(--qb-space-4)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--qb-space-3)",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "var(--qb-text-xl)", fontWeight: "var(--qb-weight-bold)" }}>
            {businessName} (dev test chat)
          </div>
          {modeLabel && (
            <div style={{ fontSize: "var(--qb-text-sm)", color: "var(--qb-color-text-muted)" }}>
              {modeLabel}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleReset}
          style={{
            minHeight: "var(--qb-tap-target)",
            padding: "0 var(--qb-space-4)",
            borderRadius: "var(--qb-radius-md)",
            border: "1px solid var(--qb-color-border)",
            background: "var(--qb-color-surface)",
            color: "var(--qb-color-text)",
            fontSize: "var(--qb-text-sm)",
            fontFamily: "var(--qb-font)",
            cursor: "pointer",
          }}
        >
          Reset chat
        </button>
      </header>

      <div
        ref={listRef}
        style={{
          background: "var(--qb-color-surface)",
          border: "1px solid var(--qb-color-border)",
          borderRadius: "var(--qb-radius-lg)",
          padding: "var(--qb-space-4)",
          minHeight: "calc(var(--qb-space-8) * 5)",
          maxHeight: "var(--qb-widget-max-height)",
          overflowY: "auto",
        }}
      >
        {messages.length === 0 && (
          <p style={{ fontSize: "var(--qb-text-base)", color: "var(--qb-color-text-muted)", margin: 0 }}>
            Say hi to start.
          </p>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div style={{ fontSize: "var(--qb-text-base)", color: "var(--qb-color-text-muted)" }}>…</div>
        )}
        {!loading && last?.quick_replies?.options && (
          <QuickReplies options={last.quick_replies.options} onPick={(o) => send(o.value)} disabled={loading} />
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            color: "var(--qb-color-danger)",
            fontSize: "var(--qb-text-base)",
            padding: "var(--qb-space-3)",
            border: "1px solid var(--qb-color-border)",
            borderRadius: "var(--qb-radius-md)",
            background: "var(--qb-color-surface)",
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: "var(--qb-space-2)" }}
      >
        <label htmlFor="dev-chat-input" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Message
        </label>
        <input
          id="dev-chat-input"
          type="text"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Type a message"
          style={{
            flex: 1,
            minHeight: "var(--qb-tap-target)",
            padding: "0 var(--qb-space-3)",
            borderRadius: "var(--qb-radius-md)",
            border: "1px solid var(--qb-color-border)",
            fontSize: "var(--qb-text-base)",
            fontFamily: "var(--qb-font)",
            color: "var(--qb-color-text)",
            background: "var(--qb-color-surface)",
          }}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={loading || !input.trim()}
          style={{
            minHeight: "var(--qb-tap-target)",
            minWidth: "var(--qb-tap-target)",
            padding: "0 var(--qb-space-4)",
            borderRadius: "var(--qb-radius-md)",
            border: "none",
            background: "var(--qb-color-brand)",
            color: "var(--qb-color-brand-contrast)",
            fontSize: "var(--qb-text-base)",
            fontFamily: "var(--qb-font)",
            fontWeight: "var(--qb-weight-bold)",
            cursor: loading || !input.trim() ? "default" : "pointer",
            opacity: loading || !input.trim() ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </form>

      {last?.limit_reached && (
        <div
          style={{
            fontSize: "var(--qb-text-base)",
            color: "var(--qb-color-warning)",
          }}
        >
          This chat hit the message cap.
        </div>
      )}

      {last?.outcome && <EstimateCard outcome={last.outcome} />}

      <section>
        <h2 style={{ fontSize: "var(--qb-text-lg)", fontWeight: "var(--qb-weight-bold)", margin: 0, marginBottom: "var(--qb-space-2)" }}>
          Debug
        </h2>
        {last?.guard?.retried && (
          <div
            style={{
              color: "var(--qb-color-warning)",
              fontSize: "var(--qb-text-base)",
              marginBottom: "var(--qb-space-2)",
            }}
          >
            Guard blocked a reply
            <pre
              style={{
                margin: 0,
                marginTop: "var(--qb-space-1)",
                fontSize: "var(--qb-text-sm)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(last.guard.problems, null, 2)}
            </pre>
          </div>
        )}
        <pre
          style={{
            background: "var(--qb-color-surface-muted)",
            border: "1px solid var(--qb-color-border)",
            borderRadius: "var(--qb-radius-md)",
            padding: "var(--qb-space-3)",
            fontSize: "var(--qb-text-sm)",
            color: "var(--qb-color-text)",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(
            { outcome: last?.outcome ?? null, job: job ?? null, guard: last?.guard ?? null },
            null,
            2
          )}
        </pre>
      </section>
    </div>
  );
}
