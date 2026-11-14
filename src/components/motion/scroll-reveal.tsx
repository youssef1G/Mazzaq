"use client";

import { useEffect } from "react";

/**
 * Sitewide scroll-reveal engine.
 *
 * Any element rendered anywhere (server or client components) can opt in by
 * adding a `data-reveal` attribute. This component observes those elements and
 * flips `data-visible="true"` the first time they enter the viewport.
 *
 * A tiny inline script in the root layout adds the `reveal-ready` class to
 * <html> before first paint, so content is only hidden when JS is guaranteed
 * to run — without JavaScript, everything renders fully visible.
 */
export function ScrollReveal() {
  useEffect(() => {
    const observed = new WeakSet<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -7% 0px" },
    );

    function scan(node: ParentNode) {
      const targets = node.querySelectorAll("[data-reveal]");
      for (const target of targets) {
        if (observed.has(target)) continue;
        observed.add(target);
        observer.observe(target);
      }
    }

    scan(document);

    // Catch client-rendered nodes (filtered shop grids, drawer lines, …).
    const mutation = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.hasAttribute("data-reveal") && !observed.has(node)) {
            observed.add(node);
            observer.observe(node);
          }
          scan(node);
        }
      }
    });
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);

  return null;
}
