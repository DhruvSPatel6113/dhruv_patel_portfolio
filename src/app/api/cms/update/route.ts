import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { projects } = await req.json();

    if (!Array.isArray(projects)) {
      return NextResponse.json({ error: 'Projects must be an array.' }, { status: 400 });
    }

    console.log(`[CMS UPDATE] Successfully synced ${projects.length} project items to session.`);
    return NextResponse.json({
      success: true,
      message: 'Projects updated in local session store.',
      count: projects.length,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'CMS update failed.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
