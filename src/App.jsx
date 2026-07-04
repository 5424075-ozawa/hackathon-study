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

条件に合う授業を、理由つきで3つほど教えてください。
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
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "28px", color: "#333", borderBottom: "2px solid #007bff", paddingBottom: "10px", marginBottom: "30px" }}>
                授業おすすめソン
            </h1>

            <h3 style={{ marginBottom: "20px", color: "#555" }}>
                評価基準の希望順位選択
            </h3>

            {ranks.map((rank) => (
                <div key={rank.id} style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", width: "90px", color: "#444" }}>
                        {rank.label}:
                    </span>

                    <div style={{ display: "flex", gap: "20px" }}>
                        {options.map((option) => (
                            <label key={option.id} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                                <input
                                    type="radio"
                                    name={rank.id}
                                    value={option.id}
                                    checked={preferences[rank.id] === option.id}
                                    onChange={() => handleChange(rank.id, option.id)}
                                    style={{ marginRight: "6px", width: "16px", height: "16px" }}
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
                    marginTop: "20px",
                    padding: "12px 28px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    backgroundColor: loading ? "#999" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
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
                        marginTop: "30px",
                        padding: "16px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: "#f9f9f9",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.6"
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>AIのおすすめ</h3>
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
}

export default App;