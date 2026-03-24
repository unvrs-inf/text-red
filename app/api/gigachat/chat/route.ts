import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, sendMessage } from '@/lib/gigachat-client';
import { ChatMessage, TokenUsage } from '@/lib/types';

interface ChatRouteBody {
  credentials: string;
  scope: string;
  clientId: string;
  model: string;
  sessionId: string;
  messages: ChatMessage[];
  fileId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRouteBody;
    const { credentials, scope, clientId, model, sessionId, messages, fileId } = body;

    if (!credentials || !scope || !model || !sessionId || !messages?.length) {
      return NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 });
    }

    const accessToken = await getAccessToken(credentials, scope);

    // Преобразуем ChatMessage[] в формат для GigaChat
    const gigaMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await sendMessage(
      accessToken,
      gigaMessages,
      fileId || null,
      model,
      sessionId,
      clientId
    );

    const choice = response.choices[0];
    const usage = response.usage;

    const tokenUsage: TokenUsage = {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      precachedTokens: usage.precached_prompt_tokens ?? 0,
    };

    return NextResponse.json({
      content: choice.message.content,
      tokenUsage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
