import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { ChatImageCard } from './ChatImageCard';

interface MarkdownRendererProps {
  content: string;
  onOpenLightbox?: (url: string, prompt: string) => void;
  onOpenInStudio?: (prompt: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onOpenLightbox,
  onOpenInStudio,
}) => {
  return (
    <div className="prose prose-invert max-w-none text-stone-200 text-sm leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 text-stone-200 text-sm leading-relaxed">
              {children}
            </p>
          ),

          // Headings
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-amber-300 mt-4 mb-2 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-stone-100 mt-3 mb-1.5 tracking-tight border-b border-stone-800 pb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-amber-400 mt-2.5 mb-1 tracking-wide uppercase">
              {children}
            </h3>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc space-y-1 text-stone-200 marker:text-amber-500/80">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal space-y-1 text-stone-200 marker:text-amber-400 font-normal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-0.5 leading-relaxed text-stone-200">{children}</li>
          ),

          // Strong & Emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-stone-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-stone-300">{children}</em>
          ),

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-amber-500/70 pl-3.5 my-2.5 bg-amber-500/5 py-1.5 rounded-r-xl text-stone-300 italic">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="my-3 border-stone-800" />,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium transition-colors"
            >
              {children}
            </a>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-stone-800 bg-stone-950/60">
              <table className="min-w-full divide-y divide-stone-800 text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-stone-900/80 text-stone-300 font-semibold">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-stone-800/60 text-stone-300">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-stone-900/40 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-medium">{children}</th>
          ),
          td: ({ children }) => <td className="px-3 py-2">{children}</td>,

          // Images
          img: ({ src, alt }) => {
            if (!src) return null;
            return (
              <ChatImageCard
                image={{
                  url: src,
                  prompt: alt || 'Generated Artwork',
                }}
                onOpenLightbox={onOpenLightbox}
                onOpenInStudio={onOpenInStudio}
              />
            );
          },

          // Code blocks & inline code
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (inline) {
              return (
                <code
                  className="bg-stone-800/90 text-amber-200 px-1.5 py-0.5 rounded text-xs font-mono border border-stone-700/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={language} code={codeString} />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Sleek CodeBlock component with copy functionality
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-stone-800 bg-stone-950 font-mono text-xs shadow-lg">
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900/90 border-b border-stone-800 text-[11px] text-stone-400">
        <span className="font-semibold text-stone-300 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-stone-200 transition p-1 rounded hover:bg-stone-800 cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-stone-200 leading-relaxed font-mono">
        <pre className="m-0">{code}</pre>
      </div>
    </div>
  );
};
