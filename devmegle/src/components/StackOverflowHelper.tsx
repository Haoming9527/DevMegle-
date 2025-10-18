"use client";

import React, { useState } from 'react';

interface StackOverflowHelperProps {
  codeSnippet: string;
}

const StackOverflowHelper: React.FC<StackOverflowHelperProps> = ({ codeSnippet }) => {
  const [question, setQuestion] = useState('');

  const askAIAboutCodeSnippet = async (code: string, userQuestion: string) => {
    // In a real implementation, this would call the Groq or Gemini API
    console.log("Asking AI about:", { code, userQuestion });
    alert("AI summarization is a placeholder. Opening Stack Overflow instead.");
    const query = encodeURIComponent(`${userQuestion} ${code}`);
    window.open(`https://stackoverflow.com/search?q=${query}`, '_blank');
  };

  const handleAsk = () => {
    if (question.trim()) {
      askAIAboutCodeSnippet(codeSnippet, question);
    }
  };

  return (
    <div className="p-4 border border-gray-700 rounded-lg mt-4 bg-gray-800">
      <h3 className="font-bold mb-2 text-white">Need help?</h3>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
        placeholder="Ask a question about the code..."
      />
      <button
        onClick={handleAsk}
        className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
      >
        Ask AI / Stack Overflow
      </button>
    </div>
  );
};

export default StackOverflowHelper;
