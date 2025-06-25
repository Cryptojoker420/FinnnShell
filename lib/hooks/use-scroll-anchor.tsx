import { useCallback, useEffect, useRef, useState } from "react";

export const useScrollAnchor = () => {
  const messagesRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    }
  }, []);

  // ⚙️ Automatically scroll to bottom when appropriate
  useEffect(() => {
    if (messagesRef.current && isAtBottom && !isVisible) {
      messagesRef.current.scrollIntoView({
        block: "end",
      });
    }
  }, [isAtBottom, isVisible]);

  // 📡 Detect manual scroll activity to toggle isAtBottom
  useEffect(() => {
    const current = scrollRef.current;
    if (!current) return;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLDivElement;
      const offset = 25;
      const atBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - offset;

      setIsAtBottom(atBottom);
    };

    current.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      current.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 🕶️ Watch if bottom marker is visible in viewport
  useEffect(() => {
    if (!visibilityRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        rootMargin: "0px 0px -150px 0px",
      },
    );

    observer.observe(visibilityRef.current);
    return () => observer.disconnect();
  }, []);

  return {
    messagesRef,
    scrollRef,
    visibilityRef,
    scrollToBottom,
    isAtBottom,
    isVisible,
  };
};
