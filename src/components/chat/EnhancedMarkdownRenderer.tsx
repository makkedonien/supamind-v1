import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface EnhancedMarkdownRendererProps {
  content: string;
  className?: string;
}

const EnhancedMarkdownRenderer: React.FC<EnhancedMarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {

  // Configure marked options for security and styling
  const configureMarked = () => {
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
    });
  };

  // Configure marked on component initialization
  React.useEffect(() => {
    configureMarked();
  }, []);

  // Parse and sanitize the markdown content
  const parseMarkdown = (markdown: string): string => {
    try {
      // Parse the markdown
      const result = marked.parse(markdown, { async: false }) as string;
      
      // Sanitize the HTML to prevent XSS attacks
      return DOMPurify.sanitize(result, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
        ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
      });
    } catch (error) {
      console.error('Error parsing markdown:', error);
      // Fallback to sanitized plain text if parsing fails
      return `<p>${DOMPurify.sanitize(markdown)}</p>`;
    }
  };

  const htmlContent = parseMarkdown(content);

  return (
    <>
      <style>{`
        .markdown-content strong {
          font-weight: bold !important;
        }
        .markdown-content em {
          font-style: italic !important;
        }
        .markdown-content p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        .markdown-content h1, .markdown-content h2, .markdown-content h3, 
        .markdown-content h4, .markdown-content h5, .markdown-content h6 {
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .markdown-content ul, .markdown-content ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
      `}</style>
      <div 
        className={`markdown-content prose prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </>
  );
};

export default EnhancedMarkdownRenderer;