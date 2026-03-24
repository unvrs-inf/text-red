import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/gigachat-client';

export async function POST(req: NextRequest) {
  try {
    const { credentials, scope } = await req.json();
    if (!credentials || !scope) {
      return NextResponse.json({ success: false, error: 'credentials и scope обязательны' }, { status: 400 });
    }
    await getAccessToken(credentials, scope);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
