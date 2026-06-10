import type { OllamaChatMessage } from '../ollama/ollama.types';

export type TranscriptLine =
  | {
      type: 'session';
      id: string;
      sessionKey: string;
      timestamp: string;
    }
  | {
      type: 'message';
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: number;
    };

export function createSessionHeader(sessionId: string, sessionKey: string): TranscriptLine {
  return {
    type: 'session',
    id: sessionId,
    sessionKey,
    timestamp: new Date().toISOString(),
  };
}

export function createMessageLine(
  role: 'user' | 'assistant' | 'system',
  content: string,
): TranscriptLine {
  return {
    type: 'message',
    role,
    content,
    timestamp: Date.now(),
  };
}

export function parseTranscriptLine(raw: string): TranscriptLine | null {
  try {
    const parsed = JSON.parse(raw) as TranscriptLine;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if (parsed.type === 'session' || parsed.type === 'message') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function transcriptToChatMessages(
  lines: TranscriptLine[],
  limit: number,
): OllamaChatMessage[] {
  const messages = lines
    .filter((line): line is Extract<TranscriptLine, { type: 'message' }> => line.type === 'message')
    .map((line) => ({
      role: line.role,
      content: line.content,
    }));

  if (limit <= 0 || messages.length <= limit) {
    return messages;
  }
  return messages.slice(-limit);
}
