import OpenAI from "openai";
import { Menu } from "../contentScript";

export type Message = {
    role: "system" | "user" | "assistant";
    content: string;
};

const RECS_PROMPT = `# Instructions
You are an expert meal ordering assistant.
Your task is to select the items from the menu below that best match the preferences provided by the user.
You may recommend up to 6 items that the user will like the most.
You should provide your answers as a list, one per line. 
You must ONLY provide items that are included in the menu.
DO NOT repeat items.
If the customer mentions an available dish positively by name, you should absolutely recommend it.
If the customer mentions an available restaurant positively by name, you should absolutely recommend a dish or two from it.
`;

const FILTER_PROMPT = `# Instructions
You are an administrative assistant.
Your job is to take the following recommendations and correlate them to the correct IDs in the menu below.
You should provide the IDs as a list, one per line with NOTHING ELSE on the line.
You must ONLY provide IDs that are included in the menu.

Example:
menu-item-XXXXX-XX
menu-item-XXXXX-XX
menu-item-XXXXX-XX
menu-item-XXXXX-XX
`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "FORKRANK") {
        try {
            const apiKey = request.prompt.split("\n")[0];
            const openai = new OpenAI({
                apiKey,
            });
            const prompt1: Message[] = [
                {
                    role: "system",
                    content: RECS_PROMPT,
                },
                {
                    role: "system",
                    content: formatMenu(request.menu),
                },
                {
                    role: "system",
                    content: `# User Preferences\n${request.prompt.split("\n").slice(1)}`,
                },
            ];
            openai.chat.completions
                .create({
                    model: "gpt-4o",
                    messages: prompt1,
                })
                .then(chatCompletion => {
                    const result = chatCompletion.choices[0].message;
                    console.log("Got recommendations");
                    console.log(result);
                    const prompt2: Message[] = [
                        {
                            role: "system",
                            content: FILTER_PROMPT,
                        },
                        {
                            role: "system",
                            content: formatMenu(request.menu),
                        },
                        {
                            role: "system",
                            content: `# Recommendations\n${result.content}`,
                        },
                    ];
                    openai.chat.completions
                        .create({
                            model: "gpt-4o",
                            messages: prompt2,
                        })
                        .then(chatCompletion2 => {
                            console.log("Got IDs");
                            console.log(chatCompletion2.choices[0].message);
                            sendResponse({
                                prompt1,
                                prompt2,
                                result: chatCompletion2.choices[0].message,
                            });
                        });
                });
            return true;
        } catch (e) {
            sendResponse("error: " + e);
        }
    }
});

function formatMenu(menu: Menu) {
    const formatted = menu
        .map(item =>
            `
### ID: ${item.id}
Dish: ${item.dish} from ${item.restaurant}
Description: ${item.description}
Price: ${item.price}
Labels: ${item.section}, ${item.labels.join(", ")}
`.trim(),
        )
        .join("\n\n");

    return ["# Menu", formatted].join("\n");
}
