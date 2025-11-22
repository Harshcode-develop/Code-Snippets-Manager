import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const CodeSyntaxHighlighter = React.memo(({ code, language = 'javascript' }) => {
    return (
        <SyntaxHighlighter 
            language={language} 
            style={vscDarkPlus}
            customStyle={{ 
                margin: 0, 
                padding: '1rem', 
                backgroundColor: 'transparent',
                whiteSpace: 'pre-wrap',  // Wrap long lines
                wordBreak: 'break-all', // Break long words
            }}
            codeTagProps={{ 
                style: { 
                    fontFamily: 'monospace', 
                    fontSize: '0.875rem' 
                } 
            }}
        >
            {code}
        </SyntaxHighlighter>
    );
});
