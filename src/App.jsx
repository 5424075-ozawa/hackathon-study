
import { useState } from "react";
import { askAI } from "./api";

function App() {
    const options = [
        { id: "attendance", text: "出席" },
        { id: "test", text: "テスト" },
        { id: "report", text: "レポート" },
    ];

    const ranks = [
        { id: "first", label: "第一希望" },
        { id: "second", label: "第二希望" },
    ];

    const [preferences, setPreferences] = useState({
        first: "",
        second: "",
    });

    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (rankId, optionId) => {
        setPreferences({
            ...preferences,
            [rankId]: optionId,
        });
    };

    const getOptionText = (optionId) => {
        const option = options.find((item) => item.id === optionId);
        return option ? option.text : "未選択";
    };

    const handleSubmit = async () => {
        if (!preferences.first && !preferences.second) {
            alert("第一希望または第二希望を選択してください。");
            return;
        }

        const firstText = getOptionText(preferences.first);
        const secondText = getOptionText(preferences.second);

        const message = `
総合教育科目の中から、授業をおすすめしてください。

評価基準の希望は以下です。
第一希望: ${firstText}
第二希望: ${secondText}

この条件に合う授業を3つ、理由つきで教えてください。
`;

        try {
            setLoading(true);
            setAnswer("AIが考え中です...");

            const reply = await askAI(message);
            setAnswer(reply);
        } catch (error) {
            console.error(error);
            setAnswer("AIの取得に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "36px", color: "#333", borderBottom: "3px solid #007bff", paddingBottom: "12px", marginBottom: "40px" }}>
                授業おすすめソン
            </h1>

            <h2 style={{ marginBottom: "25px", color: "#555" }}>
                評価基準の希望順位選択
            </h2>

            {ranks.map((rank) => (
                <div key={rank.id} style={{ marginBottom: "24px", display: "flex", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", width: "120px", color: "#444", fontSize: "20px" }}>
                        {rank.label}:
                    </span>

                    <div style={{ display: "flex", gap: "35px" }}>
                        {options.map((option) => (
                            <label key={option.id} style={{ cursor: "pointer", display: "flex", alignItems: "center", fontSize: "20px" }}>
                                <input
                                    type="radio"
                                    name={rank.id}
                                    value={option.id}
                                    checked={preferences[rank.id] === option.id}
                                    onChange={() => handleChange(rank.id, option.id)}
                                    style={{ marginRight: "8px", width: "18px", height: "18px" }}
                                />
                                {option.text}
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                    marginTop: "30px",
                    padding: "16px 42px",
                    fontSize: "20px",
                    fontWeight: "bold",
                    backgroundColor: loading ? "#999" : "#007bff",
                    color: "white",
                    border: "3px solid orange",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                }}
                onMouseOver={(e) => {
                    if (!loading) e.target.style.backgroundColor = "#0056b3";
                }}
                onMouseOut={(e) => {
                    if (!loading) e.target.style.backgroundColor = "#007bff";
                }}
            >
                {loading ? "考え中..." : "決定"}
            </button>

            {answer && (
                <div
                    style={{
                        marginTop: "40px",
                        padding: "24px",
                        border: "1px solid #ddd",
                        borderRadius: "12px",
                        backgroundColor: "#fafafa",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.8",
                        fontSize: "18px",
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>AIのおすすめ</h2>
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
}

export default App;