import { useState } from "react";

function App() {
    // 選択肢（評価基準）
    const options = [
        { id: "attendance", text: "出席" },
        { id: "test", text: "テスト" },
        { id: "report", text: "レポート" },
    ];

    // 希望のランク
    const ranks = [
        { id: "first", label: "第一希望" },
        { id: "second", label: "第二希望" },
    ];

    // 状態管理
    const [preferences, setPreferences] = useState({
        first: "",
        second: "",
    });

    // ラジオボタンが変更された時の処理
    const handleChange = (rankId, optionId) => {
        setPreferences({
            ...preferences,
            [rankId]: optionId,
        });
    };

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
            <h2>評価基準の希望順位選択</h2>
            
            {ranks.map((rank) => (
                <div key={rank.id} style={{ marginBottom: "15px", display: "flex", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", width: "90px", shrink: 0 }}>
                        {rank.label}:
                    </span>
                    
                    <div style={{ display: "flex", gap: "15px" }}>
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
        </div>
    );
}

export default App;