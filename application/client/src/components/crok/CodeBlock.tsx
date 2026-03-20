import { ComponentProps, isValidElement, lazy, ReactElement, ReactNode, Suspense, useEffect, useState } from "react";

const SyntaxHighlighter = lazy(() =>
  import("react-syntax-highlighter").then((m) => ({ default: m.default })),
);

let cachedStyle: Record<string, React.CSSProperties> | null = null;

const getLanguage = (children: ReactElement<ComponentProps<"code">>) => {
  const className = children.props.className;
  if (typeof className === "string") {
    const match = className.match(/language-(\w+)/);
    return match?.[1] ?? "javascript";
  }
  return "javascript";
};

const isCodeElement = (children: ReactNode): children is ReactElement<ComponentProps<"code">> =>
  isValidElement(children) && children.type === "code";

export const CodeBlock = ({ children }: ComponentProps<"pre">) => {
  const [style, setStyle] = useState<Record<string, React.CSSProperties> | null>(cachedStyle);

  useEffect(() => {
    if (!cachedStyle) {
      import("react-syntax-highlighter/dist/esm/styles/hljs").then((m) => {
        cachedStyle = m.atomOneLight;
        setStyle(m.atomOneLight);
      });
    }
  }, []);

  if (!isCodeElement(children)) return <>{children}</>;
  const language = getLanguage(children);
  const code = children.props.children?.toString() ?? "";

  if (!style) {
    return <pre><code>{code}</code></pre>;
  }

  return (
    <Suspense fallback={<pre><code>{code}</code></pre>}>
      <SyntaxHighlighter
        customStyle={{
          fontSize: "14px",
          padding: "24px 16px",
          borderRadius: "8px",
          border: "1px solid var(--color-cax-border)",
        }}
        language={language}
        style={style}
      >
        {code}
      </SyntaxHighlighter>
    </Suspense>
  );
};
