import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const sanitizedHtml = useMemo(() => {
    if (!content) return '';
    try {
      // Configure marked for clean GFM parsing
      const rawHtml = marked.parse(content, {
        gfm: true,
        breaks: true,
      }) as string;

      // Sanitize rendered HTML to protect against XSS while allowing tables, code, blockquotes, etc.
      return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'rel', 'class'],
      });
    } catch (err) {
      console.error('Markdown parse error:', err);
      return content;
    }
  }, [content]);

  return (
    <div
      className={`chat-markdown ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
