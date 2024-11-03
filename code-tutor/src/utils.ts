import * as vscode from 'vscode';
import { MAX_TOKENS, TOKEN_SIZE } from './constants';

export function calculateTokens(text: string): number {
  return Math.ceil(text.length / TOKEN_SIZE);
}

export function isTextPart(part: any): part is vscode.LanguageModelTextPart {
  return 'text' in part && typeof part.text === 'string';
}

export function calculateTokensFromParts(parts: (vscode.LanguageModelTextPart | vscode.LanguageModelToolResultPart | vscode.LanguageModelToolCallPart)[]): number {
  let totalLength = 0;
  for (const part of parts) {
    if (isTextPart(part)) {
      totalLength += part.value.length;
    }
  }
  return Math.ceil(totalLength / TOKEN_SIZE);
}

export function trimHistoryIfNeeded(history: vscode.LanguageModelChatMessage[], newMessage: string, prompt: string): vscode.LanguageModelChatMessage[] {
  let totalTokens = calculateTokens(prompt) + calculateTokens(newMessage);
  const trimmedHistory = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const message = history[i];
    const messageTokens = calculateTokensFromParts(message.content);

    if (totalTokens + messageTokens > MAX_TOKENS) {
      break;
    }

    totalTokens += messageTokens;
    trimmedHistory.unshift(message);
  }

  return trimmedHistory;
}
