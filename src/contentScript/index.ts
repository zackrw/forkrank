import { Message } from "../background";

console.info("Initializing Forkrank.");
const forYouId = "for-you-items";
let active = false;
setInterval(function () {
    const { href } = window.location;
    const menus = document.querySelector("#delivery-nav-menus");
    if (href.startsWith("https://forkable.com/mc") && menus) {
        const existingForYou = document.querySelector(`#${forYouId}`);
        if (!existingForYou) {
            // Only one request per 10 seconds
            if (!active) {
                active = true; // lock
                setTimeout(() => {
                    active = false;
                }, 10000);
                chrome.storage.sync.get(["prompt"], result => {
                    const fullMenu = makeMenu();
                    const forYou = document.createElement("div");
                    forYou.id = forYouId;
                    forYou.className = "container menu-items card-group";
                    forYou.style.margin = "auto";
                    forYou.innerHTML = `
<div class="section-name" style="margin-bottom:12px;text-transform:none;">
    <span class="text-ellipsis flex items-center">
        <div style="font-weight:normal;display:flex;align-items:center;box-sizing:border-box;height:28px;vertical-align:middle;color:white;background:#00ae8e;padding:14px;font-size:11px;border-radius:14px">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
            forkrank ai
        </div>
    </span>
</div>
<style>
.fr-loader {
  width: 20px;
  height: 20px;
  position: relative;
  margin: auto;
}
.fr-spinner {
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top: 2px solid #00ae8e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
<div class="fr-loader fr-spinner"></div>
        `.trim();
                    menus.prepend(forYou);
                    getResults(result.prompt, fullMenu, forYou);
                });
            }
        }
    }
}, 1000);

function getResults(prompt: string, menu: Menu, forYou: Element) {
    chrome.runtime.sendMessage({ type: "FORKRANK", prompt, menu }, response => {
        console.log(`Got response`);
        console.log(response);
        console.log(
            `Prompt 1:\n\n${response.prompt1.map((m: Message) => `${m.role}: ${m.content}`).join("\n\n")}`,
        );
        console.log(
            `Prompt 2:\n\n${response.prompt2.map((m: Message) => `${m.role}: ${m.content}`).join("\n\n")}`,
        );

        const ids = response.result.content.split("\n");
        document.querySelector(".fr-loader.fr-spinner")?.remove();

        ids.forEach((id: string, idx: number) => {
            // skip duplicates
            if (ids.indexOf(id) === idx) {
                try {
                    const item = document.querySelector(`#${id}`) as HTMLDivElement | null;
                    if (item) {
                        const toAdd = item.cloneNode(true) as HTMLDivElement;
                        toAdd.id = "";
                        toAdd.setAttribute("data-id", item.id);
                        forYou.appendChild(toAdd);
                        toAdd.addEventListener("click", function (e) {
                            const div = e.currentTarget as HTMLDivElement | null;
                            if (div) {
                                const id = div.getAttribute("data-id");
                                if (id) {
                                    const target = document.querySelector(
                                        `#${id}`,
                                    ) as HTMLDivElement | null;
                                    if (target) {
                                        target.click();
                                    }
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.log("Invalid ID: " + id);
                }
            }
        });
    });
}

export type Menu = {
    id: string;
    restaurant: string;
    section: string;
    dish: string;
    description: string;
    labels: string[];
    price: string;
}[];

function makeMenu() {
    const restaurants = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".menu-section");
    const menu: Menu = [];
    sections.forEach(section => {
        if (section && section.parentElement) {
            const restaurantIdx = getParentSiblingIndex(section);
            const sectionName = section.querySelector(".section-name") as HTMLDivElement;
            if (sectionName && restaurantIdx && restaurantIdx < restaurants.length) {
                const restaurant = (restaurants[restaurantIdx] as HTMLLIElement).innerText;
                const name = sectionName.innerText;
                const menuItems = section.querySelectorAll(".card.meal-card.meal-card--selectable");
                menuItems.forEach(item => {
                    const cardBody = item.querySelector(".card-body");
                    const dish = cardBody?.querySelector("h4")?.innerText;
                    const description = cardBody?.querySelector("p")?.innerText;
                    const labelEls = item.querySelectorAll(".icon-label");
                    const labels: string[] = [];
                    labelEls.forEach(l => {
                        labels.push((l as HTMLSpanElement).innerText);
                    });

                    const price =
                        item.querySelector("strong.color-blue.font-sm")?.innerHTML.trim() || "";

                    if (dish && description) {
                        menu.push({
                            id: item.id,
                            restaurant,
                            section: name,
                            dish,
                            description,
                            labels,
                            price,
                        });
                    } else {
                        console.log("No dish/description");
                    }
                });
            } else {
                console.log(
                    `No sectionName or restaurantIdx. Section name: ${sectionName.innerText}, Restaurant: ${restaurantIdx}`,
                );
            }
        }
    });
    return menu;
}

function getParentSiblingIndex(node: Element): null | number {
    const parent = node.parentElement;
    const grandParent = parent?.parentElement;
    const siblings = grandParent?.childNodes;
    let result: number | null = null;
    siblings?.forEach((el, idx) => {
        const element = el as HTMLElement; // Cast el to HTMLElement
        if (parent && element.id === parent.id) {
            result = idx;
        }
    });
    return result;
}
