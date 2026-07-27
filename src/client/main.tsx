import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./styles.css";

// Mojo AI Summits is a dark, neon-accented brand. Keep the CRM pinned to that
// palette instead of following OS theme preferences.
document.documentElement.classList.add("dark");

// Agent/touch mode enlarges interactive targets (?agent or ?mode=agent).
const params = new URLSearchParams(window.location.search);
if (params.has("agent") || params.get("mode") === "agent") {
  document.documentElement.setAttribute("data-agent", "");
}

createRoot(document.getElementById("app")!).render(<App />);
