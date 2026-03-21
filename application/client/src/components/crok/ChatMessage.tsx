import { memo, useEffect, useState, lazy, Suspense } from "react";

import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

// 리치 마크다운 컴포넌트를 lazy 로드 (katex CSS, remarkMath, remarkGfm, CodeBlock 포함)
const RichMarkdown = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/crok/RichMarkdown").then((m) => ({
    default: m.RichMarkdown,
  })),
);

interface Props {
  message: Models.ChatMessage;
  renderMarkdown?: boolean;
}

const UserMessage = ({ content }: { content: string }) => {
  return (
    <div className="mb-6 flex justify-end">
      <div className="bg-cax-surface-subtle text-cax-text max-w-[80%] rounded-3xl px-4 py-2">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

const AssistantMessage = memo(({ content, renderMarkdown = true }: { content: string; renderMarkdown?: boolean }) => {
  const [showRich, setShowRich] = useState(false);

  useEffect(() => {
    if (!renderMarkdown || !content) {
      setShowRich(false);
      return;
    }
    // 브라우저가 idle할 때 리치 마크다운으로 전환 (최대 2초 대기)
    const id = requestIdleCallback(() => setShowRich(true), { timeout: 2000 });
    return () => cancelIdleCallback(id);
  }, [renderMarkdown, content]);

  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {content ? (
            showRich ? (
              <Suspense fallback={<p className="whitespace-pre-wrap">{content}</p>}>
                <RichMarkdown content={content} />
              </Suspense>
            ) : (
              <p className="whitespace-pre-wrap">{content}</p>
            )
          ) : (
            <TypingIndicator />
          )}
        </div>
      </div>
    </div>
  );
});

export const ChatMessage = ({ message, renderMarkdown = true }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return <AssistantMessage content={message.content} renderMarkdown={renderMarkdown} />;
};
