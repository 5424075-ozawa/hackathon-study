import { useState } from "react";
import CheckBox from "./CheckBox";

function App() {
    const [checked, setChecked] = useState(false);

    return (
        <div>
            <CheckBox
                text="チェックボックス"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
            />
        </div>
    );
}

export default App;