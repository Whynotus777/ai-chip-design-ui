import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const {
  VITE_APP_TITLE,
  VITE_APP_LOGO,
  VITE_ANALYTICS_ENDPOINT,
  VITE_ANALYTICS_WEBSITE_ID,
} = import.meta.env;

// Apply optional runtime overrides for title and favicon
if (VITE_APP_TITLE) {
  document.title = VITE_APP_TITLE;
}

if (VITE_APP_LOGO) {
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (favicon) {
    favicon.href = VITE_APP_LOGO;
  }
  if (appleIcon) {
    appleIcon.href = VITE_APP_LOGO;
  }
}

// Inject analytics script only when both endpoint and id are provided
if (VITE_ANALYTICS_ENDPOINT && VITE_ANALYTICS_WEBSITE_ID) {
  const existing = document.querySelector<HTMLScriptElement>('script[data-analytics="umami"]');
  if (!existing) {
    const script = document.createElement("script");
    script.type = "module";
    script.defer = true;
    script.src = `${VITE_ANALYTICS_ENDPOINT.replace(/\/$/, "")}/umami`;
    script.dataset.websiteId = VITE_ANALYTICS_WEBSITE_ID;
    script.dataset.analytics = "umami";
    document.head.appendChild(script);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
