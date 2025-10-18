import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  try {
    const { userId, preferences } = await req.json();

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session in database
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        id: sessionId,
        created_by: userId || 'anonymous',
        status: 'waiting',
        preferences: preferences || {},
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }])
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Initialize code editor with default content
    const { error: codeError } = await supabase
      .from('codes')
      .insert([{
        session_id: sessionId,
        content: '// Welcome to DevMegle+!\n// Start coding with your random partner...\n\nfunction hello() {\n  console.log("Hello, DevMegle!");\n}',
        language: 'javascript'
      }]);

    if (codeError) {
      console.error('Code initialization error:', codeError);
    }

    // Try to find a matching partner immediately
    const { data: waitingSessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'waiting')
      .neq('id', sessionId)
      .limit(1);

    if (waitingSessions && waitingSessions.length > 0) {
      const partnerSession = waitingSessions[0];
      
      // Update both sessions to active
      await supabase
        .from('sessions')
        .update({ 
          status: 'active',
          partner_id: partnerSession.id,
          matched_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      await supabase
        .from('sessions')
        .update({ 
          status: 'active',
          partner_id: sessionId,
          matched_at: new Date().toISOString()
        })
        .eq('id', partnerSession.id);

      return NextResponse.json({
        success: true,
        session: {
          ...session,
          status: 'active',
          partner_id: partnerSession.id,
          matched_at: new Date().toISOString()
        },
        matched: true,
        partner: {
          id: partnerSession.id,
          created_by: partnerSession.created_by
        }
      });
    }

    return NextResponse.json({
      success: true,
      session,
      matched: false
    });

  } catch (error) {
    console.error('Meeting creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
