import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGFM from "remark-gfm";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@avenire/ui/components/table"
import { Separator } from "@avenire/ui/components/separator"
import "katex/dist/katex.min.css"
import { cn } from "@avenire/ui/lib/utils"
import dynamic from "next/dynamic"

const MermaidDiagram = dynamic(
  () => import("./mermaid").then((mod) => mod.MermaidDiagram),
  {
    ssr: false,
  }
);

// Dynamically import the MatplotlibRenderer (client-only)
const MatplotlibRenderer = dynamic(() => import("./matplotlib-renderer").then(mod => mod.MatplotlibRenderer), { ssr: false });

const Code = (props: any) => {
  const { children, className, node, ...rest } = props;
  const match = /language-(\w+)/.exec(className || "");

  // Check if this is a Mermaid code block
  if (match && match[1].toLowerCase() === 'mermaid') {
    return (
      <div className="my-4">
        <MermaidDiagram
          chart={children as string}
          containerHeight={400}
          containerWidth={800}
        />
      </div>
    );
  }

  // Treat matplotlib as a regular code block
  return match ? (
    <div className="overflow-scroll">
      <code {...rest} className={cn(className, "font-mono text-sm bg-muted px-2 py-1 rounded-md")}>
        {children}
      </code>
    </div>
  ) : (
    <code {...rest} className={cn(className, "font-mono text-sm bg-muted px-2 py-1 rounded-md")}>
      {children}
    </code>
  );
};

const MarkdownBlock = ({ content }: { content: string }) => {
  return (
    <div className="prose dark:prose-invert max-w-full flex flex-col [&>*:not(:nth-child(1))]:mt-5 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGFM]}
        rehypePlugins={[rehypeKatex]}
        components={{
          ul: ({ children }) => <ul className="list-disc">{children}</ul>,
          table: ({ children }) => <Table>{children}</Table>,
          thead: ({ children }) => <TableHeader>{children}</TableHeader>,
          tr: ({ children }) => <TableRow>{children}</TableRow>,
          th: ({ children }) => (
            <TableHead className="text-left">{children}</TableHead>
          ),
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          td: ({ children }) => <TableCell>{children}</TableCell>,
          hr: () => <Separator />,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          h1: ({ children }) => (
            <h1 className="text-text text-4xl font-semibold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-text text-xl font-semibold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-text text-lg font-semibold">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-text text-md font-semibold">{children}</h4>
          ),
          code: ({ className, children }) => (
            <Code className={className || ""} >
              {children}
            </Code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = ({ content, id }: { content: string; id: string }) => {
  return <MarkdownBlock content={content} key={id} />;
};
