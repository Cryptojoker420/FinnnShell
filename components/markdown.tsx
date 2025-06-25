"use client";
import { FC, memo, useEffect, useState } from "react";

type MarkdownProps = {
  children: string;
  remarkPlugins?: any[];
  components?: Record<string, any>;
};

export const MemoizedReactMarkdown: FC<MarkdownProps> = memo(
  ({ children, remarkPlugins, components }) => {
    const [ReactMarkdown, setReactMarkdown] = useState<any>(null);

    useEffect(() => {
      import("react-markdown").then((mod) => {
        setReactMarkdown(() => mod.default);
      });
    }, []);

    if (!ReactMarkdown) return null;
    return (
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {children}
      </ReactMarkdown>
    );
  },
  (prev, next) =>
    prev.children === next.children &&
    prev.remarkPlugins === next.remarkPlugins &&
    prev.components === next.components,
);

MemoizedReactMarkdown.displayName = "MemoizedReactMarkdown";
