import { useState } from "react";
import { askAI } from "./api";

function App() {
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        setAnswer("AIが考え中です...");

        const reply = await askAI("総合教育科目の中からおすすめ授業を3つ教えてください。");

        setAnswer(reply);
        setLoading(false);
    };

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
            <h1>授業おすすめソン</h1>

            <button onClick={handleClick} disabled={loading}>
                {loading ? "考え中..." : "AIに聞く"}
            </button>

            {answer && (
                <div style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}>
                    {answer}
                </div>
            )}
        </div>
    );
}

export default App;