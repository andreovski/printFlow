import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();

  // Clear auth cookies
  cookieStore.delete('token');
  cookieStore.delete('token-client');

  return NextResponse.json({ success: true });
}
