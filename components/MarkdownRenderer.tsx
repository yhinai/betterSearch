import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import CodeBlock from './CodeBlock';
import { useTheme } from './ThemeProvider';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark', // We can switch this based on betterSearch theme logic if needed
  securityLevel: 'loose',
  fontFamily: 'monospace',
});

interface MarkdownRendererProps {
  content: string;
  onSvgClick: (svgContent: string) => void;
}

const MermaidBlock = ({ code }: { code: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const { theme } = useTheme();

  useEffect(() => {
    // Re-initialize theme when it changes
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
    });

    const renderChart = async () => {
      if (ref.current) {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, code);
          setSvg(svg);
        } catch (error) {
          console.error("Mermaid failed to render:", error);
          setSvg(`<div class="text-red-500 text-xs">Failed to render diagram</div>`);
        }
      }
    };
    renderChart();
  }, [code, theme]);

  return (
    <div
      className="mermaid my-6 flex justify-center p-4 rounded-sm border transition-all overflow-x-auto"
      ref={ref}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--border-primary)'
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onSvgClick }) => {
  const { theme } = useTheme();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[[rehypeKatex, { strict: false, trust: true }]]}
      components={{
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const isSvg = !inline && match && match[1] === 'svg';
          const isMermaid = !inline && match && match[1] === 'mermaid';

          if (isMermaid) {
            return <MermaidBlock code={String(children)} />;
          }

          if (isSvg) {
            const svgContent = String(children);
            return (
              <div
                className="my-6 p-2 rounded-sm relative overflow-hidden group cursor-pointer transition-colors hover:opacity-90"
                style={{
                  border: '1px solid var(--border-primary)',
                  backgroundColor: 'var(--bg-tertiary)'
                }}
                onClick={() => onSvgClick(svgContent)}
                title="Click to expand schematic"
              >
                <div
                  className="absolute top-0 right-0 p-1 text-[8px] uppercase tracking-widest group-hover:opacity-100 opacity-60 transition-colors z-10"
                  style={{
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border-secondary)',
                    borderLeft: '1px solid var(--border-secondary)',
                    backgroundColor: 'var(--bg-hover)'
                  }}
                >
                  Schematic_Render [EXPAND]
                </div>
                {/* 
                   Force SVG to be responsive. 
                   w-full: takes full width of container.
                   h-auto: maintains aspect ratio.
                   max-h: prevents it from being excessively tall on mobile.
                   svg-invert: inverts colors for light theme
                */}
                <div
                  className={`w-full flex justify-center items-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[600px] [&>svg]:block ${theme === 'light' ? 'svg-invert' : ''}`}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </div>
            );
          }

          if (!inline) {
            return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
          }

          return (
            <code
              className="px-1 rounded break-all"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ node, children }) => <>{children}</>,
        table: ({ node, children }) => (
          <div
            className="overflow-x-auto my-6 rounded-sm"
            style={{ border: '1px solid var(--border-secondary)' }}
          >
            <table className="w-full text-left border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ node, children }) => (
          <thead
            className="uppercase tracking-wider font-bold"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            {children}
          </thead>
        ),
        tbody: ({ node, children }) => (
          <tbody style={{ borderColor: 'var(--border-secondary)' }} className="divide-y">{children}</tbody>
        ),
        tr: ({ node, children }) => (
          <tr className="transition-colors hover:opacity-80">{children}</tr>
        ),
        th: ({ node, children }) => (
          <th
            className="px-4 py-3 whitespace-nowrap"
            style={{ borderBottom: '1px solid var(--border-primary)' }}
          >
            {children}
          </th>
        ),
        td: ({ node, children }) => (
          <td
            className="px-4 py-3"
            style={{ borderRight: '1px solid var(--border-secondary)' }}
          >
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;

