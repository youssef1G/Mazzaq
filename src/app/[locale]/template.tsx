import type { ReactNode } from "react";

/**
 * Re-mounts on every navigation, giving each page a soft editorial entrance.
 */
export default function LocaleTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
