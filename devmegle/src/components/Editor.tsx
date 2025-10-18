"use client";

import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface CodeEditorProps {
  sessionId: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ sessionId }) => {
  const [code, setCode] = useState("// some comment");
  const router = useRouter();

  useEffect(() => {
    const channel = supabase.channel(`session:${sessionId}`);

    channel
      .on('broadcast', { event: 'code-update' }, (payload) => {
        setCode(payload.payload.code);
      })
      .subscribe();

    const fetchInitialCode = async () => {
      const { data } = await supabase
        .from('codes')
        .select('content')
        .eq('session_id', sessionId)
        .single();
      if (data) {
        setCode(data.content || '');
      }
    };

    fetchInitialCode();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      const channel = supabase.channel(`session:${sessionId}`);
      channel.send({
        type: 'broadcast',
        event: 'code-update',
        payload: { code: value },
      });
      supabase
        .from('codes')
        .upsert({ session_id: sessionId, content: value })
        .then();
    }
  };

  return (
    <Editor
      height="100vh"
      defaultLanguage="javascript"
      value={code}
      onChange={handleEditorChange}
      theme="vs-dark"
    />
  );
};

export default CodeEditor;
