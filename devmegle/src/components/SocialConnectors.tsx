"use client";

import React from 'react';

interface SocialConnectorsProps {
  sessionId: string;
  partner: {
    linkedin_handle?: string;
    slack_handle?: string;
    github_handle?: string;
    instagram_handle?: string;
  };
}

const SocialConnectors: React.FC<SocialConnectorsProps> = ({ sessionId, partner }) => {
  const logConnection = async (connector: string) => {
    await fetch('/api/logConnection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        fromUser: 'current_user_placeholder', // Replace with actual user ID
        toUser: 'partner_user_placeholder', // Replace with actual partner ID
        connector,
      }),
    });
  };

  const connectViaLinkedIn = () => {
    if (partner.linkedin_handle) {
      window.open(`https://www.linkedin.com/in/${partner.linkedin_handle}`, '_blank');
      logConnection('linkedin');
    }
  };

  const connectViaSlack = () => {
    if (partner.slack_handle) {
      navigator.clipboard.writeText(partner.slack_handle);
      alert('Slack handle copied to clipboard!');
      logConnection('slack');
    }
  };

  const connectViaGitHub = () => {
    if (partner.github_handle) {
      window.open(`https://github.com/${partner.github_handle}`, '_blank');
      logConnection('github');
    }
  };

  const connectViaInstagram = () => {
    if (partner.instagram_handle) {
      window.open(`https://www.instagram.com/${partner.instagram_handle}`, '_blank');
      logConnection('instagram');
    }
  };

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
      <h3 className="font-bold mb-2 text-white">Keep in touch?</h3>
      <div className="flex flex-col space-y-2">
        <button onClick={connectViaLinkedIn} className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition">Connect on LinkedIn</button>
        <button onClick={connectViaSlack} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Invite via Slack</button>
        <button onClick={connectViaGitHub} className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-black transition">Follow on GitHub</button>
        <button onClick={connectViaInstagram} className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition">Message on Instagram</button>
      </div>
    </div>
  );
};

export default SocialConnectors;
