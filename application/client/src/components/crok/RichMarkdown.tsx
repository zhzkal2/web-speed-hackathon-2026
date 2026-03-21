import "katex/dist/katex.min.css";
import { memo } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";

const markdownComponents = { pre: CodeBlock };
const markdownRehypePlugins = [rehypeKatex];
const markdownRemarkPlugins = [remarkMath, remarkGfm];

export const RichMarkdown = memo(({ content }: { content: string }) => (
  <Markdown
    components={markdownComponents}
    rehypePlugins={markdownRehypePlugins}
    remarkPlugins={markdownRemarkPlugins}
  >
    {content}
  </Markdown>
));
