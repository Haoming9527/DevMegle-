"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Dynamically load Vanta.js and Feather Icons scripts
    const threeScript = document.createElement('script');
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    document.body.appendChild(threeScript);

    threeScript.onload = () => {
      const vantaScript = document.createElement('script');
      vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js';
      document.body.appendChild(vantaScript);

      vantaScript.onload = () => {
        (window as unknown as { VANTA: { GLOBE: (options: unknown) => void } }).VANTA.GLOBE({
          el: "#vanta-bg",
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0x84cc16,
          backgroundColor: 0xffffff,
          size: 0.8
        });
      };
    };

    const featherScript = document.createElement('script');
    featherScript.src = 'https://unpkg.com/feather-icons';
    document.body.appendChild(featherScript);

    featherScript.onload = () => {
      // Check if feather is available before calling replace
      if (window.feather && typeof window.feather.replace === 'function') {
        window.feather.replace();
      }
    };

    return () => {
      // In a real app, you'd want to handle script removal more carefully
    }
  }, []);

  const handlePairMe = async () => {
    try {
      // Show loading state
      const button = document.querySelector('button');
      if (button) {
        button.disabled = true;
        button.innerHTML = '<i data-feather="loader" class="w-6 h-6 animate-spin"></i><span>Finding Partner...</span>';
      }

      // Create meeting session
      const response = await fetch('/api/meeting/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous', // In production, get from auth
          preferences: {
            languages: ['javascript', 'typescript', 'python'],
            experience: 'intermediate'
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.matched) {
          // Instantly matched - go to session
          router.push(`/session/${data.session.id}`);
        } else {
          // Waiting for partner - show waiting screen
          router.push(`/session/${data.session.id}?waiting=true`);
        }
      } else {
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Pairing error:', error);
      alert('Failed to find a partner. Please try again.');
      
      // Reset button
      const button = document.querySelector('button');
      if (button) {
        button.disabled = false;
        button.innerHTML = '<i data-feather="zap" class="w-6 h-6"></i><span>Pair Me Instantly</span>';
      }
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div id="vanta-bg" className="absolute top-0 left-0 w-full h-full z-[-1] opacity-30"></div>
      
      <header className="border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
              <i data-feather="code" className="text-black w-4 h-4"></i>
            </div>
            <h1 className="text-xl font-bold text-black">CodeChaos Connect</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#" className="text-gray-700 hover:text-lime-500 font-medium">How It Works</a></li>
              <li><a href="#" className="text-gray-700 hover:text-lime-500 font-medium">Hack Mode</a></li>
              <li><a href="#" className="text-gray-700 hover:text-lime-500 font-medium">AI Features</a></li>
            </ul>
          </nav>
          <button className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition flex items-center space-x-2">
            <span>Sign In</span>
            <i data-feather="log-in" className="w-4 h-4"></i>
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-black mb-6">Find Your <span className="text-lime-500">Coding Partner</span> in One Click</h1>
            <p className="text-xl text-gray-600 mb-10">Random developer matching with live Git repos and AI copilots. Pair, code, and create something unexpected.</p>
            
            <div className="flex flex-col space-y-6 items-center">
              <button onClick={handlePairMe} className="bg-lime-500 text-black px-8 py-4 rounded-full text-xl font-bold glow glow-hover hover:bg-lime-400 transition-all transform hover:scale-105 flex items-center space-x-3">
                <i data-feather="zap" className="w-6 h-6"></i>
                <span>Pair Me Instantly</span>
              </button>
              
              <div className="flex space-x-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center w-40">
                  <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i data-feather="git-branch" className="text-lime-500 w-5 h-5"></i>
                  </div>
                  <p className="font-medium text-sm">Live Git Sync</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center w-40">
                  <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i data-feather="cpu" className="text-lime-500 w-5 h-5"></i>
                  </div>
                  <p className="font-medium text-sm">AI Copilots</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center w-40">
                  <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i data-feather="clock" className="text-lime-500 w-5 h-5"></i>
                  </div>
                  <p className="font-medium text-sm">Ephemeral</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-lime-500 rounded-full"></div>
              <span className="text-sm text-gray-600">© 2023 CodeChaos Connect</span>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-lime-500"><i data-feather="github"></i></a>
              <a href="#" className="text-gray-600 hover:text-lime-500"><i data-feather="twitter"></i></a>
              <a href="#" className="text-gray-600 hover:text-lime-500"><i data-feather="discord"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
