import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get partner details if matched
    let partner = null;
    if (session.partner_id) {
      const { data: partnerData } = await supabase
        .from('sessions')
        .select('created_by, preferences')
        .eq('id', session.partner_id)
        .single();
      
      partner = partnerData;
    }

    // Get current code content
    const { data: codeData } = await supabase
      .from('codes')
      .select('content, language')
      .eq('session_id', sessionId)
      .single();

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        partner,
        code: codeData
      }
    });

  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { sessionId, updates } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session: data
    });

  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // End session for both participants
    const { data: session } = await supabase
      .from('sessions')
      .select('partner_id')
      .eq('id', sessionId)
      .single();

    if (session?.partner_id) {
      await supabase
        .from('sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', session.partner_id);
    }

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
