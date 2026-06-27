import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [cards, setCards] = useState([]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AI Flashcard Generator ✨</h1>

      <textarea
        style={styles.textarea}
        placeholder="Paste your notes here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button style={styles.button}>
        Generate Flashcards
      </button>

      <div style={styles.output}>
        <h2>Flashcards</h2>

        {cards.length === 0 ? (
          <p style={{ color: "gray" }}>No flashcards yet</p>
        ) : (
          cards.map((card, index) => (
            <div key={index} style={styles.card}>
              <p><b>Q:</b> {card.q}</p>
              <p><b>A:</b> {card.a}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial",
    padding: "30px",
    maxWidth: "800px",
    margin: "auto",
  },
  title: {
    textAlign: "center",
  },
  textarea: {
    width: "100%",
    height: "150px",
    padding: "10px",
    marginTop: "10px",
    fontSize: "16px",
  },
  button: {
    marginTop: "10px",
    padding: "10px 20px",
    cursor: "pointer",
  },
  output: {
    marginTop: "30px",
  },
  card: {
    border: "1px solid #ddd",
    padding: "10px",
    marginTop: "10px",
  },
};

export default App;