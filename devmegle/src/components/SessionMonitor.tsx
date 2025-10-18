"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SessionMonitorProps {
  sessionId: string;
  onPartnerMatched: (partnerData: any) => void;
  onSessionEnded: () => void;
}

const SessionMonitor: React.FC<SessionMonitorProps> = ({ 
  sessionId, 
  onPartnerMatched, 
  onSessionEnded 
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    setIsMonitoring(true);

    // Set up real-time subscription for session updates
    const channel = supabase.channel(`session-monitor:${sessionId}`);

    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        const session = payload.new;
        
        if (session.status === 'active' && session.partner_id) {
          // Partner matched!
          onPartnerMatched({
            partnerId: session.partner_id,
            matchedAt: session.matched_at
          });
        } else if (session.status === 'ended') {
          // Session ended
          onSessionEnded();
        }
      })
      .subscribe();

    // Also poll for updates every 5 seconds as a fallback
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/meeting/session?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (data.success && data.session) {
          const session = data.session;
          
          if (session.status === 'active' && session.partner_id) {
            onPartnerMatched({
              partnerId: session.partner_id,
              matchedAt: session.matched_at
            });
          } else if (session.status === 'ended') {
            onSessionEnded();
          }
        }
      } catch (error) {
        console.error('Session polling error:', error);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      setIsMonitoring(false);
    };
  }, [sessionId, onPartnerMatched, onSessionEnded]);

  return null; // This component doesn't render anything
};

export default SessionMonitor;
