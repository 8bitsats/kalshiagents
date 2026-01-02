"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { apiClient } from "@/lib/api";

export function GrokChatPanel() {
  const { systemState } = useStore();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await apiClient.chat(
        userMessage,
        systemState?.mode || "AUTONOMOUS",
        systemState?.state || undefined
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply || "No response from Grok",
        },
      ]);
    } catch (err) {
      console.error("Grok chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Failed to get response from Grok. Check API key and backend connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
      <h2 className="text-lg font-bold text-text-primary mb-4">🤖 Grok 4.1 Copilot</h2>

      {/* Messages */}
      <div className="h-64 overflow-y-auto mb-4 space-y-3 border border-border-secondary rounded-lg p-3 bg-bg-card">
        {messages.length === 0 ? (
          <div className="text-text-dim text-center py-8">
            Ask Grok about market conditions, strategy performance, or trading decisions...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-accent-blue/20 text-accent-blue"
                    : "bg-bg-primary text-text-primary border border-border-secondary"
                }`}
              >
                <div className="text-xs text-text-dim mb-1">
                  {msg.role === "user" ? "You" : "Grok"}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="text-text-dim text-sm">Grok is thinking...</div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask Grok about the market..."
          disabled={loading}
          className="flex-1 px-3 py-2 bg-bg-card border border-border-secondary rounded text-text-primary placeholder-text-dim disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-accent-blue/20 border border-accent-blue rounded text-accent-blue hover:bg-accent-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}

