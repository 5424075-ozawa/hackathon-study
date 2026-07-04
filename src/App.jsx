import { useState } from "react";
import CheckBox from "./CheckBox";

function App() {
    const [checked, setChecked] = useState(false);

    return (
        <div>
            <CheckBox
                text="出席"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
            />
            <CheckBox
                text="テスト"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
            />
            <CheckBox
                text="レポート"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
            />
        </div>
    );
}

export default App;