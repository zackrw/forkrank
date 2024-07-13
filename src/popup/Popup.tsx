import { useState, useEffect } from "react";

import "./Popup.css";

export const Popup = () => {
    const [prompt, setPrompt] = useState("");
    useEffect(() => {
        alert("HI");
        console.log("Prompt: ", prompt);
        chrome.storage.sync.get(["prompt"], result => {
            setPrompt(result.prompt || "");
        });
    }, []);

    useEffect(() => {
        chrome.storage.sync.set({ prompt });
        // chrome.runtime.sendMessage({ type: "COUNT", count });
    }, [prompt]);

    return (
        <main
            style={{
                width: "840px",
            }}
        >
            <textarea
                style={{
                    width: "800px",
                    height: "400px",
                }}
                placeholder="Enter your prompt"
                value={prompt}
                onChange={e => {
                    console.log("Change: ", e.currentTarget.value);
                    setPrompt(e.currentTarget.value);
                }}
            ></textarea>
        </main>
    );
};

export default Popup;
