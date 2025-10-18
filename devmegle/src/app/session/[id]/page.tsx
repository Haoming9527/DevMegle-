"use client";

import { useState, use, useEffect } from 'react';
import CodeEditor from '@/components/Editor';
import SessionEndModal from '@/components/SessionEndModal';

export default function SessionPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    const featherScript = document.createElement('script');
    featherScript.src = 'https://unpkg.com/feather-icons';
    document.body.appendChild(featherScript);

    featherScript.onload = () => {
      (window as unknown as { feather: { replace: () => void } }).feather.replace();
    };

    return () => {
      document.body.removeChild(featherScript);
    }
  }, []);

  // Mock partner data
  const partner = {
    linkedin_handle: 'johndoe',
    slack_handle: 'U12345678',
    github_handle: 'johndoe',
    instagram_handle: 'johndoe',
  };

  const handleEndSession = () => {
    // In a real app, you'd get the latest code from the editor state
    const last20Lines = "mock code snippet";
    setCode(last20Lines);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
              <i data-feather="code" className="text-black w-4 h-4"></i>
            </div>
            <h1 className="text-xl font-bold text-white">CodeChaos Connect</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Session ID: {params.id}</span>
            <button onClick={handleEndSession} className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition flex items-center space-x-2">
              <span>End Session</span>
              <i data-feather="log-out" className="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex">
        <div className="flex-1">
          <CodeEditor sessionId={params.id} />
        </div>
        <aside className="w-80 bg-gray-800 p-4 border-l border-gray-700">
          <h2 className="text-xl font-bold mb-4">AI Assistants</h2>
          <div className="mb-4">
            <h3 className="font-semibold">Groq Copilot</h3>
            <p className="text-sm text-gray-400">Simulated message from Groq...</p>
          </div>
          <div>
            <h3 className="font-semibold">Gemini Visualizer</h3>
            <p className="text-sm text-gray-400">Simulated analysis from Gemini...</p>
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Session Controls</h2>
            <div className="flex flex-col space-y-2">
              <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
                Next Dev
              </button>
              <button className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
                Report
              </button>
            </div>
          </div>
        </aside>
      </main>

      <SessionEndModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessionId={params.id}
        partner={partner}
        codeSnippet={code}
      />
    </div>
  );
}
