import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, code, commitMessage = 'DevMegle+ collaboration commit' } = await req.json();

    if (!sessionId || !code) {
      return NextResponse.json({ error: 'Session ID and code are required' }, { status: 400 });
    }

    // For MVP, we'll simulate Git repo creation
    // In production, this would integrate with Smithery MCP or GitHub API
    const repoData = {
      repoId: `devmegle_${sessionId}`,
      repoUrl: `https://github.com/devmegle-temp/${sessionId}`,
      branch: 'main',
      commitHash: `commit_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      commitMessage,
      files: {
        'main.js': code,
        'README.md': `# DevMegle+ Session ${sessionId}\n\nThis is a temporary repository created during a DevMegle+ collaboration session.\n\n## Session Details\n- Session ID: ${sessionId}\n- Created: ${new Date().toISOString()}\n- Status: Active\n\n## Code\n\`\`\`javascript\n${code}\n\`\`\``
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      repo: repoData,
      message: 'Temporary Git repository created successfully'
    });

  } catch (error) {
    console.error('Git repo creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create Git repository',
      fallback: 'Code is being saved locally. Git integration will be available shortly.'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Simulate fetching repo status
    const repoData = {
      repoId: `devmegle_${sessionId}`,
      repoUrl: `https://github.com/devmegle-temp/${sessionId}`,
      branch: 'main',
      lastCommit: `commit_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    return NextResponse.json({
      success: true,
      repo: repoData
    });

  } catch (error) {
    console.error('Git repo fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch repository status' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Simulate repo deletion
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Temporary repository deleted successfully'
    });

  } catch (error) {
    console.error('Git repo deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 });
  }
}
