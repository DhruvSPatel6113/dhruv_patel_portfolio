import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.content && typeof body.content === 'object') {
      return NextResponse.json({
        success: true,
        message: 'Full site content updated in session.',
      });
    }

    if (Array.isArray(body.projects)) {
      return NextResponse.json({
        success: true,
        message: 'Projects updated in session.',
        count: body.projects.length,
      });
    }

    return NextResponse.json({ error: 'Invalid CMS payload.' }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'CMS update failed.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
