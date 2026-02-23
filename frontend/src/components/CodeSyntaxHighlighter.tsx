import React, { memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "../contexts/ThemeContext";

// Deep clone to avoid mutating the global styles, though overriding specific keys is fine
const customOneDark = { ...oneDark };
const customOneLight = { ...oneLight };

// Override the comment color to perfectly match light green for all languages
const COMMENT_COLOR = "#86efac"; // tailwind green-300

// Keys in prism styles that map to comments usually include "comment", "prolog", "doctype", "cdata"
if (customOneDark["comment"]) {
  customOneDark["comment"] = {
    ...customOneDark["comment"],
    color: COMMENT_COLOR,
  };
}
if (customOneLight["comment"]) {
  customOneLight["comment"] = {
    ...customOneLight["comment"],
    color: "#16a34a",
  }; // slightly darker for light mode to be readable
}
// Block comments or doctypes
["prolog", "doctype", "cdata", "block-comment"].forEach((key) => {
  if (customOneDark[key])
    customOneDark[key] = { ...customOneDark[key], color: COMMENT_COLOR };
  if (customOneLight[key])
    customOneLight[key] = { ...customOneLight[key], color: "#16a34a" };
});

interface Props {
  code: string;
  language?: string;
}

export const CodeSyntaxHighlighter: React.FC<Props> = memo(
  ({ code, language = "javascript" }) => {
    const { theme } = useTheme();

    return (
      <SyntaxHighlighter
        language={language}
        style={theme === "dark" ? customOneDark : customOneLight}
        customStyle={{
          margin: 0,
          padding: "1rem",
          backgroundColor: "transparent",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontSize: "0.8125rem",
          lineHeight: "1.6",
        }}
        codeTagProps={{
          style: {
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            fontWeight: "500",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    );
  },
);
