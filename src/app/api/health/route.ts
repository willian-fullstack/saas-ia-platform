import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: error }, { status: 500 });
  }
} 