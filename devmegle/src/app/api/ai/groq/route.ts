import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, code, message, type = 'chat' } = await req.json();

    if (!sessionId || !code) {
      return NextResponse.json({ error: 'Session ID and code are required' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    let prompt = '';
    let systemPrompt = '';

    if (type === 'chat') {
      systemPrompt = `You are an AI coding assistant helping developers collaborate in real-time. 
      You're part of DevMegle+, a platform where random developers pair up to code together.
      Be helpful, concise, and encourage collaboration. Focus on code quality and best practices.`;
      
      prompt = `Current code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nDeveloper message: ${message || 'No specific message'}\n\nProvide helpful suggestions or answer their question.`;
    } else if (type === 'suggest') {
      systemPrompt = `You are an AI code reviewer and suggester. Analyze the code and provide helpful suggestions for improvement, bug fixes, or optimization.`;
      prompt = `Analyze this code and provide suggestions:\n\`\`\`javascript\n${code}\n\`\`\``;
    } else if (type === 'explain') {
      systemPrompt = `You are an AI code explainer. Help developers understand what the code does and how it works.`;
      prompt = `Explain this code:\n\`\`\`javascript\n${code}\n\`\`\``;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'No response generated';

    return NextResponse.json({
      success: true,
      response: aiResponse,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Groq AI error:', error);
    return NextResponse.json({ 
      error: 'AI service temporarily unavailable',
      fallback: 'AI suggestions are temporarily unavailable. Keep coding!'
    }, { status: 500 });
  }
}
