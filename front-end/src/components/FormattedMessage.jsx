import React from 'react';

const FormattedMessage = ({ content, darkMode }) => {
  const renderFormattedContent = (text) => {
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, pIndex) => {
 
        const isListStart = /^(\d+\.|[-*•])/.test(paragraph.trim());
      
      if (isListStart) {
        const listItems = paragraph.split('\n').filter(line => line.trim());
        return (
          <ul key={pIndex} className={`mb-3 ml-4 space-y-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {listItems.map((item, iIndex) => {
              const cleanItem = item.replace(/^(\d+\.|[-*•])\s*/, '');
              const renderedItem = renderInlineContent(cleanItem, darkMode);
              return (
                <li key={iIndex} className="flex gap-2">
                  <span className={`flex-shrink-0 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {item.match(/^\d+\./)?.[0] || '•'}
                  </span>
                  <span className="flex-1">{renderedItem}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      const renderedContent = renderInlineContent(paragraph, darkMode);
      return (
        <p key={pIndex} className={`mb-3 leading-relaxed ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {renderedContent}
        </p>
      );
    });
  };

  const renderInlineContent = (text, darkMode) => {
    const parts = [];
    let lastIndex = 0;
    
     const regex = /\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
       
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      
      if (match[1]) {
        
        parts.push({ type: 'bold', content: match[1] });
      } else if (match[2]) {
        
        parts.push({ type: 'bold', content: match[2] });
      } else if (match[3]) {
         
        parts.push({ type: 'code', content: match[3] });
      }
      
      lastIndex = regex.lastIndex;
    }
    
 
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }
    
    return parts.map((part, idx) => {
      if (part.type === 'bold') {
        return (
          <strong key={idx} className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
            {part.content}
          </strong>
        );
      }
      
      if (part.type === 'code') {
        return (
          <code 
            key={idx}
            className={`px-2 py-1 rounded text-sm font-mono ${
              darkMode 
                ? 'bg-gray-700 text-purple-300' 
                : 'bg-gray-300 text-purple-700'
            }`}
          >
            {part.content}
          </code>
        );
      }
      
      return <span key={idx}>{part.content}</span>;
    });
  };

  return (
    <div className="message-content">
      {renderFormattedContent(content)}
    </div>
  );
};

export default FormattedMessage;
