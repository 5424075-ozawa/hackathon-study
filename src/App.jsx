import "./style.css";
import { useState } from "react";
import { askAI } from "./api";

function renderAnswer(text) {
    const safeText =
        typeof text === "string"
            ? text
            : JSON.stringify(text, null, 2);

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return safeText.split("\n").map((line, i) => (
        <div key={i}>
            {line.split(urlRegex).map((part, j) => {
                if (part.match(/^https?:\/\/[^\s]+$/)) {
                    return (
                        <a
                            key={j}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {part}
                        </a>
                    );
                }

                return part;
            })}
        </div>
    ));
}

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
        setPreferences((prev) => ({
            ...prev,
            [rankId]: optionId,
        }));
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

            if (typeof reply === "string") {
                setAnswer(reply);
            } else {
                setAnswer(JSON.stringify(reply, null, 2));
            }
        } catch (error) {
            console.error(error);
            setAnswer("AIの取得に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 className="title">授業おすすめソン</h1>

            <h2 className="subTitle">評価基準の希望順位選択</h2>

            {ranks.map((rank) => (
                <div className="rankRow" key={rank.id}>
                    <span className="rankLabel">{rank.label}:</span>

                    <div className="optionGroup">
                        {options.map((option) => (
                            <label className="optionLabel" key={option.id}>
                                <input
                                    type="radio"
                                    name={rank.id}
                                    value={option.id}
                                    checked={preferences[rank.id] === option.id}
                                    onChange={() =>
                                        handleChange(rank.id, option.id)
                                    }
                                />
                                {option.text}
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            <button
                className="submitButton"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? "考え中..." : "決定"}
            </button>

            {answer && (
                <div className="answerBox">
                    <h2 className="answerTitle">AIのおすすめ</h2>

                    <div className="answerText">
                        {renderAnswer(answer)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;