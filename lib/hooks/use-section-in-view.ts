"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function useSectionInView<T extends HTMLElement>(): {
  ref: RefObject<T | null>;
  inView: boolean;
} {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "-12% 0px -18%", threshold: 0.18 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
