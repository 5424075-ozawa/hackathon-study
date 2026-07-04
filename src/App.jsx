import { useState } from "react";
import CheckBox from "./CheckBox";

function App() {
    const items = [
        { id: "attendance", text: "出席" },
        { id: "test", text: "テスト" },
        { id: "report", text: "レポート" },
    ];

    const [checked, setChecked] = useState({});

    const handleChange = (id) => (e) => {
        setChecked({
            ...checked,
            [id]: e.target.checked,
        });
    };

    return (
        <div>
            {items.map((item) => (
                <CheckBox
                    key={item.id}
                    text={item.text}
                    checked={checked[item.id] || false}
                    onChange={handleChange(item.id)}
                />
            ))}
        </div>
    );
}

export default App;