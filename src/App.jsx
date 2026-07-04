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

    // 決定ボタンが押された時の処理
    const handleSubmit = () => {
        if (!preferences.first && !preferences.second) {
            alert("第一希望または第二希望を選択してください。");
            return;
        }
        
        alert(`選択しました！\n第一希望: ${preferences.first || "未選択"}\n第二希望: ${preferences.second || "未選択"}`);
        console.log("送信されたデータ:", preferences);
    };

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            {/* アプリタイトル */}
            <h1 style={{ fontSize: "28px", color: "#333", borderBottom: "2px solid #007bff", paddingBottom: "10px", marginBottom: "30px" }}>
                授業おすすめソン
            </h1>

            <h3 style={{ marginBottom: "20px", color: "#555" }}>評価基準の希望順位選択</h3>
            
            {ranks.map((rank) => (
                <div key={rank.id} style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", width: "90px", shrink: 0, color: "#444" }}>
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

            {/* 決定ボタン */}
            <button
                onClick={handleSubmit}
                style={{
                    marginTop: "20px",
                    padding: "12px 28px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
            >
                決定
            </button>
        </div>
        //fds
    );
}

export default App;