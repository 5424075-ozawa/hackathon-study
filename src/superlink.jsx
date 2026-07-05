export function renderAnswer(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split("\n").map((line, i) => (
        <div key={i}>
            {line.split(urlRegex).map((part, j) => {
                if (urlRegex.test(part)) {
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