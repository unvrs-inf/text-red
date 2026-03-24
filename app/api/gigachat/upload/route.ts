import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, uploadFile } from '@/lib/gigachat-client';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const credentials = formData.get('credentials') as string | null;
    const scope = formData.get('scope') as string | null;
    const clientId = formData.get('clientId') as string | null;

    if (!file || !credentials || !scope || !clientId) {
      return NextResponse.json({ error: 'file, credentials, scope и clientId обязательны' }, { status: 400 });
    }

    const accessToken = await getAccessToken(credentials, scope);
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(accessToken, buffer, file.name, file.type, clientId);

    return NextResponse.json({ fileId: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
