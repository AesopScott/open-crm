import { useState, useEffect, useCallback } from "react";

const appBase = import.meta.env.BASE_URL.replace(/\/$/, "");

export type Route =
  | { name: "contacts" }
  | { name: "contact"; id: string }
  | { name: "companies" }
  | { name: "deals" }
  | { name: "properties" }
  | { name: "not-found" };

function parse(path: string): Route {
  if (path === "/" || path === "/contacts") return { name: "contacts" };
  const m = path.match(/^\/contacts\/([^/]+)$/);
  if (m) return { name: "contact", id: decodeURIComponent(m[1]) };
  if (path === "/companies") return { name: "companies" };
  if (path === "/deals") return { name: "deals" };
  if (path === "/settings/properties") return { name: "properties" };
  return { name: "not-found" };
}

function stripBase(path: string): string {
  if (!appBase) return path;
  if (path === appBase) return "/";
  if (path.startsWith(`${appBase}/`)) return path.slice(appBase.length) || "/";
  return path;
}

function withBase(path: string): string {
  if (!appBase) return path;
  if (path === "/") return `${appBase}/`;
  return `${appBase}${path.startsWith("/") ? path : `/${path}`}`;
}

export function useRouter() {
  const [path, setPath] = useState<string>(() => stripBase(window.location.pathname));

  const navigate = useCallback((to: string) => {
    const href = withBase(to);
    if (href === window.location.pathname) return;
    window.history.pushState(null, "", href);
    setPath(to);
  }, []);

  useEffect(() => {
    const handler = () => setPath(stripBase(window.location.pathname));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return { path, route: parse(path), navigate };
}
