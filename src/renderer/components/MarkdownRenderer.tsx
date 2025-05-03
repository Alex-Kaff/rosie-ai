import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Markdown styles
const markdownStyles = {
  p: "my-2",
  h1: "text-xl font-bold my-4",
  h2: "text-lg font-bold my-3",
  h3: "text-md font-bold my-2",
  ul: "list-disc ml-6 my-2",
  ol: "list-decimal ml-6 my-2",
  li: "my-1",
  a: "text-blue-400 underline",
  blockquote: "border-l-4 border-gray-500 pl-2 italic my-2",
  code: "bg-gray-800 px-1 rounded text-xs",
};

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Custom renderer for code blocks
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    p: ({ children }: any) => <p className={markdownStyles.p}>{children}</p>,
    h1: ({ children }: any) => <h1 className={markdownStyles.h1}>{children}</h1>,
    h2: ({ children }: any) => <h2 className={markdownStyles.h2}>{children}</h2>,
    h3: ({ children }: any) => <h3 className={markdownStyles.h3}>{children}</h3>,
    ul: ({ children }: any) => <ul className={markdownStyles.ul}>{children}</ul>,
    ol: ({ children }: any) => <ol className={markdownStyles.ol}>{children}</ol>,
    li: ({ children }: any) => <li className={markdownStyles.li}>{children}</li>,
    a: ({ href, children }: any) => <a href={href} className={markdownStyles.a} target="_blank" rel="noopener noreferrer">{children}</a>,
    blockquote: ({ children }: any) => <blockquote className={markdownStyles.blockquote}>{children}</blockquote>,
  };

  return (
    <ReactMarkdown components={MarkdownComponents}>
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer; 