import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setCards([]);
    setFlipped({});
    setError("");
    setProgress(0);

    const tick = setInterval(() => {
      setProgress((p) => (p < 85 ? p + Math.random() * 12 : p));
    }, 300);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Flashcard App",
        },
        body: JSON.stringify({
          model: "qwen/qwen-2.5-7b-instruct",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a flashcard generator. Return ONLY a raw JSON object with a single key "cards" containing an array.
Each item must have exactly two fields: "q" (question) and "a" (answer).
Example: {"cards":[{"q":"What is RAM?","a":"Random Access Memory — volatile short-term storage used by the CPU."}]}
Generate 6–8 flashcards. No markdown, no backticks, no explanation.`,
            },
            {
              role: "user",
              content: `Generate flashcards for: ${input}`,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "API error");

      const raw = data?.choices?.[0]?.message?.content || "";

      let result;
      try {
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        result = Array.isArray(parsed)
          ? parsed
          : parsed.cards || parsed.flashcards || Object.values(parsed)[0];
      } catch {
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) result = JSON.parse(match[0]);
        else throw new Error("Model didn't return valid JSON. Try rephrasing your topic.");
      }

      if (!Array.isArray(result) || result.length === 0)
        throw new Error("No flashcards returned. Try a more specific topic.");

      clearInterval(tick);
      setProgress(100);
      setTimeout(() => setCards(result), 300);
    } catch (err) {
      clearInterval(tick);
      setError(err.message);
    }

    setLoading(false);
  };

  const toggleFlip = (i) =>
    setFlipped((prev) => ({ ...prev, [i]: !prev[i] }));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate();
  };

  const answered = Object.values(flipped).filter(Boolean).length;

  return (
    <div style={{ fontFamily: "'Inter', Arial, sans-serif", minHeight: "100vh", background: "#f8f9fb", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 600, margin: "0 0 6px", color: "#111" }}>
            Flashcard generator
          </h1>
          <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>
            Enter a topic and get AI-generated study cards. Click any card to reveal the answer.
          </p>
        </div>

        {/* Input area */}
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e8e8e8", padding: "1.25rem", marginBottom: "1rem" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Operating Systems, React hooks, Photosynthesis…"
            style={{
              width: "100%", boxSizing: "border-box", height: "90px",
              resize: "none", fontSize: "15px", lineHeight: 1.6,
              border: "1px solid #e0e0e0", borderRadius: "8px",
              padding: "10px 12px", color: "#111", background: "#fafafa",
              outline: "none", fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
            <span style={{ fontSize: "12px", color: "#bbb" }}>Ctrl + Enter to generate</span>
            <button
              onClick={generate}
              disabled={loading || !input.trim()}
              style={{
                padding: "9px 22px", fontSize: "14px", fontWeight: 500,
                borderRadius: "8px", border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                background: loading || !input.trim() ? "#e0e0e0" : "#111",
                color: loading || !input.trim() ? "#999" : "#fff",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Generating…" : "Generate cards"}
            </button>
          </div>

          {/* Progress bar */}
          {loading && (
            <div style={{ marginTop: "12px", height: "3px", background: "#f0f0f0", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%", background: "#111", borderRadius: "2px",
                width: `${progress}%`, transition: "width 0.3s ease",
              }} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fff5f5", border: "1px solid #ffd0d0", borderRadius: "10px",
            padding: "12px 16px", fontSize: "14px", color: "#c0392b", marginBottom: "1rem",
          }}>
            {error}
          </div>
        )}

        {/* Stats bar */}
        {cards.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "1rem", padding: "0 2px",
          }}>
            <span style={{ fontSize: "13px", color: "#888" }}>
              {cards.length} cards
            </span>
            <span style={{ fontSize: "13px", color: answered === cards.length && cards.length > 0 ? "#27ae60" : "#888" }}>
              {answered}/{cards.length} revealed
            </span>
          </div>
        )}

        {/* Cards grid */}
        {cards.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {cards.map((c, i) => (
              <div
                key={i}
                onClick={() => toggleFlip(i)}
                style={{
                  background: flipped[i] ? "#f0f7ff" : "#fff",
                  border: flipped[i] ? "1px solid #bdd7f5" : "1px solid #e8e8e8",
                  borderRadius: "14px", padding: "1.1rem 1.25rem",
                  cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
                  minHeight: "110px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#bbb", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Q{i + 1}
                  </div>
                  <p style={{ fontSize: "15px", color: "#111", margin: 0, lineHeight: 1.55 }}>
                    {c.q}
                  </p>
                  {flipped[i] && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #d6eafc" }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#7ab3e0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
                        Answer
                      </div>
                      <p style={{ fontSize: "15px", color: "#1a5fa8", margin: 0, lineHeight: 1.55 }}>
                        {c.a}
                      </p>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "11px", color: "#ccc", marginTop: "10px", textAlign: "right" }}>
                  {flipped[i] ? "click to hide" : "click to reveal"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reset button */}
        {cards.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <button
              onClick={() => { setCards([]); setFlipped({}); setInput(""); setProgress(0); }}
              style={{
                background: "none", border: "1px solid #e0e0e0", borderRadius: "8px",
                padding: "8px 20px", fontSize: "13px", color: "#888", cursor: "pointer",
              }}
            >
              Start over
            </button>
          </div>
        )}

      </div>
    </div>
  );
}