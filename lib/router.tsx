// Router compatibility layer.
//
// The pages were written against Next.js's App Router navigation API. This app
// runs on React Router (Vite SPA), so this module re-exports React Router's
// hooks behind the exact signatures the pages expect - `useRouter().push(...)`,
// a string `usePathname()`, a `URLSearchParams` from `useSearchParams()`, and a
// `useParams()` - so the page/component code stays framework-agnostic.
//
// Swap this file (and components/ui/Link) if you move to a different router.

import React from "react";
import {
  useNavigate,
  useLocation,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

/** Next-style router object. Only the members the app actually uses are wired. */
export function useRouter() {
  const navigate = useNavigate();
  return React.useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => {},
      prefetch: () => {},
    }),
    [navigate]
  );
}

/** Current pathname as a string (matches Next's usePathname). */
export function usePathname(): string {
  return useLocation().pathname;
}

/** Route params, e.g. `useParams<{ id: string }>()` -> `{ id }`. */
export const useParams = useRouterParams;

/** Read-only URLSearchParams (matches how the app calls `.get(...)`). */
export function useSearchParams(): URLSearchParams {
  const [params] = useRouterSearchParams();
  return params;
}

/** Rendered where Next code did `return notFound()`. */
export function notFound(): React.ReactElement {
  return (
    <div style={{ padding: "48px 22px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800 }}>Page not found</div>
      <div style={{ fontSize: 13, color: "var(--fg3)", marginTop: 6 }}>That page does not exist. Check the link and try again.</div>
    </div>
  );
}
