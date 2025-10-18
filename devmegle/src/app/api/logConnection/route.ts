import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { sessionId, fromUser, toUser, connector } = await req.json();

  if (!sessionId || !fromUser || !toUser || !connector) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('connection_logs')
    .insert([{ session_id: sessionId, from_user: fromUser, to_user: toUser, connector }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}
