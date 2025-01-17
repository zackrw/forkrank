import { defineManifest } from "@crxjs/vite-plugin";
import packageData from "../package.json";

//@ts-ignore
const isDev = process.env.NODE_ENV == "development";

export default defineManifest({
    name: `${packageData.displayName || packageData.name}${isDev ? ` ➡️ Dev` : ""}`,
    description: packageData.description,
    version: packageData.version,
    manifest_version: 3,
    icons: {
        16: "img/logo-16.png",
        32: "img/logo-32.png",
        192: "img/logo-192.png",
        512: "img/logo-512.png",
    },
    action: {
        default_popup: "popup.html",
        default_icon: "img/logo-192.png",
    },
    background: {
        service_worker: "src/background/index.ts",
        type: "module",
    },
    content_scripts: [
        {
            matches: ["https://forkable.com/mc/*"],
            js: ["src/contentScript/index.ts"],
        },
    ],
    web_accessible_resources: [
        {
            resources: [
                "img/logo-16.png",
                "img/logo-32.png",
                "img/logo-192.png",
                "img/logo-512.png",
            ],
            matches: [],
        },
    ],
    permissions: ["storage"],
});
