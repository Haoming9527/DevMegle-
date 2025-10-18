"use client";

import { useState, use, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CodeEditor from '@/components/Editor';
import SessionEndModal from '@/components/SessionEndModal';
import SessionMonitor from '@/components/SessionMonitor';
import AIChat from '@/components/AIChat';

interface SessionData {
  id: string;
  status: 'waiting' | 'active' | 'ended';
  partner_id?: string;
  partner?: {
    created_by: string;
    preferences?: any;
  };
  code?: {
    content: string;
    language: string;
  };
  created_at: string;
  matched_at?: string;
}

export default function SessionPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const featherScript = document.createElement('script');
    featherScript.src = 'https://unpkg.com/feather-icons';
    document.body.appendChild(featherScript);

    featherScript.onload = () => {
      // Check if feather is available before calling replace
      if (window.feather && typeof window.feather.replace === 'function') {
        window.feather.replace();
      }
    };

    // Check if we're in waiting mode
    const waiting = searchParams.get('waiting') === 'true';
    setIsWaiting(waiting);

    // Fetch session data
    fetchSessionData();

    return () => {
      if (document.body.contains(featherScript)) {
        document.body.removeChild(featherScript);
      }
    }
  }, [params.id, searchParams]);

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/meeting/session?sessionId=${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setSessionData(data.session);
        if (data.session.code) {
          setCode(data.session.code.content);
        }
        
        // If we were waiting and now have a partner, update state
        if (data.session.status === 'active' && isWaiting) {
          setIsWaiting(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch session data:', error);
    }
  };


  const commitToGit = async () => {
    try {
      const response = await fetch('/api/git/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: params.id,
          code: code,
          commitMessage: `DevMegle+ collaboration - ${new Date().toLocaleString()}`
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Code committed to temporary repo: ${data.repo.repoUrl}`);
      } else {
        alert(data.fallback || 'Failed to commit to Git');
      }
    } catch (error) {
      console.error('Git commit failed:', error);
      alert('Failed to commit to Git');
    }
  };

  const handleEndSession = async () => {
    try {
      // End the session
      await fetch(`/api/meeting/session?sessionId=${params.id}`, {
        method: 'DELETE'
      });
      
      // Get the latest code for the modal
      const last20Lines = code.split('\n').slice(-20).join('\n');
      setCode(last20Lines);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to end session:', error);
      alert('Failed to end session properly');
    }
  };

  const handleNextDev = () => {
    if (confirm('Are you sure you want to find a new partner? This will end the current session.')) {
      handleEndSession();
      router.push('/');
    }
  };

  const handleReport = () => {
    if (confirm('Report this session? This will end the session and flag it for review.')) {
      // In production, this would call a report API
      alert('Session reported. Thank you for helping keep DevMegle+ safe.');
      handleEndSession();
    }
  };

  const handlePartnerMatched = (partnerData: any) => {
    setIsWaiting(false);
    // Refresh session data to get partner info
    fetchSessionData();
  };

  const handleSessionEnded = () => {
    alert('Your partner has ended the session.');
    router.push('/');
  };

  // Mock partner data for social connectors
  const partner = {
    linkedin_handle: sessionData?.partner?.created_by || 'anonymous',
    slack_handle: 'U12345678',
    github_handle: sessionData?.partner?.created_by || 'anonymous',
    instagram_handle: 'anonymous',
  };

  // Show waiting screen if no partner yet
  if (isWaiting || (sessionData && sessionData.status === 'waiting')) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex flex-col">
        <header className="bg-gray-800 border-b border-gray-700 py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
                <i data-feather="code" className="text-black w-4 h-4"></i>
              </div>
              <h1 className="text-xl font-bold text-white">DevMegle+</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Session ID: {params.id}</span>
              <button onClick={() => router.push('/')} className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition flex items-center space-x-2">
                <span>Cancel</span>
                <i data-feather="x" className="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <i data-feather="users" className="text-black w-12 h-12"></i>
            </div>
            <h2 className="text-3xl font-bold mb-4">Finding Your Coding Partner...</h2>
            <p className="text-gray-400 mb-8">We're searching for another developer to pair with you</p>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-lime-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-sm text-gray-500 mt-4">This usually takes less than 30 seconds</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
              <i data-feather="code" className="text-black w-4 h-4"></i>
            </div>
            <h1 className="text-xl font-bold text-white">DevMegle+</h1>
            {sessionData?.partner && (
              <span className="text-sm text-gray-400 ml-4">
                Paired with: {sessionData.partner.created_by}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={commitToGit} className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition flex items-center space-x-2">
              <span>Commit to Git</span>
              <i data-feather="git-commit" className="w-4 h-4"></i>
            </button>
            <span className="text-sm text-gray-400">Session: {params.id}</span>
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
        <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* AI Chat Section */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold mb-2 flex items-center">
                <i data-feather="cpu" className="w-5 h-5 mr-2"></i>
                AI Copilot
              </h2>
              <p className="text-sm text-gray-400">Chat with Groq AI for code help</p>
            </div>
            <div className="flex-1">
              <AIChat sessionId={params.id} currentCode={code} />
            </div>
          </div>

          {/* Session Controls */}
          <div className="p-4 border-t border-gray-700">
            <h3 className="font-semibold mb-3">Session Controls</h3>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={handleNextDev}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition text-sm"
              >
                Next Dev
              </button>
              <button 
                onClick={handleReport}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition text-sm"
              >
                Report
              </button>
            </div>
            
            {/* Session Info */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h4 className="font-semibold mb-2 text-sm">Session Info</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Status: {sessionData?.status || 'Loading...'}</p>
                <p>Started: {sessionData?.created_at ? new Date(sessionData.created_at).toLocaleTimeString() : 'Unknown'}</p>
                {sessionData?.matched_at && (
                  <p>Matched: {new Date(sessionData.matched_at).toLocaleTimeString()}</p>
                )}
              </div>
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

      {/* Real-time session monitoring */}
      <SessionMonitor
        sessionId={params.id}
        onPartnerMatched={handlePartnerMatched}
        onSessionEnded={handleSessionEnded}
      />
    </div>
  );
}
