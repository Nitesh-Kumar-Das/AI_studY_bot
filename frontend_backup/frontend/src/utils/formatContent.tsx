import React from 'react';

/**
 * Utility functions for formatting and rendering content
 */

/**
 * Formats summary content based on summary type
 * @param content - Raw content string
 * @param summaryType - Type of summary (brief, detailed, key-points, flashcards)
 * @returns Formatted content for rendering
 */
export function formatSummaryContent(content: string, summaryType: string): string {
  if (summaryType === 'key-points') {
    return formatKeyPointsContent(content);
  }
  
  return content;
}

/**
 * Formats key-points content to ensure proper bullet point display
 * @param content - Raw key-points content
 * @returns Formatted content with proper bullet points
 */
function formatKeyPointsContent(content: string): string {
  // Replace bullet points with proper HTML list items
  let formatted = content
    // Replace bullet characters with HTML list items
    .replace(/•\s*\*\*(.*?)\*\*\s*-\s*(.*?)$/gm, '• **$1** - $2')
    .replace(/•\s*(.*?)$/gm, '• $1')
    // Ensure proper line breaks for readability
    .replace(/\n\n/g, '\n\n')
    .replace(/\n•/g, '\n\n•');
    
  return formatted;
}

/**
 * Checks if content should be rendered as markdown
 * @param content - Content string
 * @returns True if content contains markdown elements
 */
export function shouldRenderAsMarkdown(content: string): boolean {
  // Check for common markdown patterns
  const markdownPatterns = [
    /#{1,6}\s/,           // Headers
    /\*\*(.*?)\*\*/,      // Bold text
    /\*(.*?)\*/,          // Italic text
    /^\s*•\s/m,           // Bullet points
    /^\s*-\s/m,           // Dash bullet points
    /^\s*\d+\.\s/m,       // Numbered lists
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content));
}

/**
 * Custom components for react-markdown
 */
export const markdownComponents = {
  // Custom bullet point rendering
  p: ({ children, ...props }: any) => {
    const content = children?.toString() || '';
    
    // Check if this paragraph contains bullet points
    if (content.includes('•')) {
      const lines = content.split('\n').filter((line: string) => line.trim());
      const bulletLines = lines.filter((line: string) => line.trim().startsWith('•'));
      const nonBulletLines = lines.filter((line: string) => !line.trim().startsWith('•'));
      
      return (
        <div className="space-y-2">
          {nonBulletLines.length > 0 && (
            <p className="text-gray-200 leading-relaxed mb-3">{nonBulletLines.join('\n')}</p>
          )}
          {bulletLines.length > 0 && (
            <ul className="space-y-2 pl-4">
              {bulletLines.map((line: string, index: number) => {
                const cleanLine = line.replace(/^\s*•\s*/, '').trim();
                return (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-blue-400 text-lg leading-none mt-1">•</span>
                    <span className="text-gray-200 leading-relaxed flex-1">{cleanLine}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    }
    
    return <p className="text-gray-200 leading-relaxed mb-3" {...props}>{children}</p>;
  },
  
  // Enhanced headers
  h1: ({ children, ...props }: any) => (
    <h1 className="text-2xl font-bold text-white mb-4 border-b border-blue-400/30 pb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-xl font-semibold text-blue-300 mb-3 mt-6" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-lg font-semibold text-purple-300 mb-2 mt-4" {...props}>
      {children}
    </h3>
  ),
  
  // Enhanced lists
  ul: ({ children, ...props }: any) => (
    <ul className="space-y-2 pl-4 mb-4" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }: any) => (
    <li className="flex items-start space-x-3" {...props}>
      <span className="text-blue-400 text-lg leading-none mt-1">•</span>
      <span className="text-gray-200 leading-relaxed flex-1">{children}</span>
    </li>
  ),
  
  // Enhanced strong/bold text
  strong: ({ children, ...props }: any) => (
    <strong className="text-blue-300 font-semibold" {...props}>{children}</strong>
  ),
  
  // Enhanced emphasis/italic text
  em: ({ children, ...props }: any) => (
    <em className="text-purple-300 italic" {...props}>{children}</em>
  ),
  
  // Code blocks
  code: ({ children, ...props }: any) => (
    <code className="bg-gray-800/50 text-green-300 px-2 py-1 rounded text-sm" {...props}>
      {children}
    </code>
  ),
  
  // Block quotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-blue-400/50 pl-4 py-2 bg-blue-500/10 rounded-r-lg mb-4" {...props}>
      {children}
    </blockquote>
  ),
};
