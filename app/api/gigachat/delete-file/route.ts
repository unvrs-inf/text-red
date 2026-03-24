import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, deleteFile } from '@/lib/gigachat-client';

export async function POST(req: NextRequest) {
  try {
    const { credentials, scope, clientId, fileId } = await req.json();

    if (!credentials || !scope || !clientId || !fileId) {
      return NextResponse.json({ error: 'credentials, scope, clientId и fileId обязательны' }, { status: 400 });
    }

    const accessToken = await getAccessToken(credentials, scope);
    await deleteFile(accessToken, fileId, clientId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
