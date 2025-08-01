import React from 'react';
import { marked } from 'marked';

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
      sanitize: false, // We'll rely on DOMPurify or built-in browser security
      smartLists: true,
      smartypants: true, // Smart quotes and dashes
    });

    // Custom renderer for better styling integration
    const renderer = new marked.Renderer();
    
    // Override heading renderer to use appropriate classes
    renderer.heading = (text: string, level: number) => {
      const classes = {
        1: 'text-2xl font-bold mb-4 mt-6',
        2: 'text-xl font-semibold mb-3 mt-5',
        3: 'text-lg font-semibold mb-2 mt-4',
        4: 'text-base font-semibold mb-2 mt-3',
        5: 'text-sm font-semibold mb-1 mt-2',
        6: 'text-xs font-semibold mb-1 mt-2'
      }[level] || 'font-semibold';
      
      return `<h${level} class="${classes}">${text}</h${level}>`;
    };

    // Override paragraph renderer
    renderer.paragraph = (text: string) => {
      return `<p class="mb-4 leading-relaxed">${text}</p>`;
    };

    // Override list renderer
    renderer.list = (body: string, ordered: boolean) => {
      const tag = ordered ? 'ol' : 'ul';
      const classes = ordered 
        ? 'list-decimal list-inside mb-4 space-y-1 ml-4' 
        : 'list-disc list-inside mb-4 space-y-1 ml-4';
      return `<${tag} class="${classes}">${body}</${tag}>`;
    };

    // Override list item renderer
    renderer.listitem = (text: string) => {
      return `<li class="leading-relaxed">${text}</li>`;
    };

    // Override blockquote renderer
    renderer.blockquote = (quote: string) => {
      return `<blockquote class="border-l-4 border-gray-300 pl-4 py-2 mb-4 italic text-gray-700 bg-gray-50 rounded-r">${quote}</blockquote>`;
    };

    // Override code block renderer
    renderer.code = (code: string, language?: string) => {
      return `<pre class="bg-gray-100 rounded-lg p-4 mb-4 overflow-x-auto"><code class="text-sm font-mono">${code}</code></pre>`;
    };

    // Override inline code renderer
    renderer.codespan = (code: string) => {
      return `<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">${code}</code>`;
    };

    // Override link renderer
    renderer.link = (href: string, title: string | null, text: string) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
    };

    // Override strong (bold) renderer
    renderer.strong = (text: string) => {
      return `<strong class="font-bold">${text}</strong>`;
    };

    // Override em (italic) renderer
    renderer.em = (text: string) => {
      return `<em class="italic">${text}</em>`;
    };

    // Override horizontal rule renderer
    renderer.hr = () => {
      return `<hr class="border-t border-gray-300 my-6" />`;
    };

    marked.setOptions({ renderer });
  };

  // Configure marked on component initialization
  React.useEffect(() => {
    configureMarked();
  }, []);

  // Parse and sanitize the markdown content
  const parseMarkdown = (markdown: string): string => {
    try {
      // Parse the markdown
      const html = marked.parse(markdown);
      
      // Return the HTML string
      // Note: In a production environment, consider using DOMPurify here:
      // return DOMPurify.sanitize(html);
      return html;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      // Fallback to plain text if parsing fails
      return `<p>${markdown}</p>`;
    }
  };

  const htmlContent = parseMarkdown(content);

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default EnhancedMarkdownRenderer;