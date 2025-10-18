"use client";

import React from 'react';
import SocialConnectors from './SocialConnectors';
import StackOverflowHelper from './StackOverflowHelper';

interface SessionEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  partner: {
    linkedin_handle?: string;
    slack_handle?: string;
    github_handle?: string;
    instagram_handle?: string;
  };
  codeSnippet: string;
}

const SessionEndModal: React.FC<SessionEndModalProps> = ({ isOpen, onClose, sessionId, partner, codeSnippet }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-lg max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Session Ended</h2>
        <SocialConnectors sessionId={sessionId} partner={partner} />
        <StackOverflowHelper codeSnippet={codeSnippet} />
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 w-full transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SessionEndModal;
