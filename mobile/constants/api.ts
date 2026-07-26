const CODESPACE_NAME = process.env.CODESPACE_NAME || 'localhost';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  `https://${CODESPACE_NAME}-8000.app.github.dev/api/v1`;

export const WS_BASE_URL =
  process.env.EXPO_PUBLIC_WS_URL ||
  `wss://${CODESPACE_NAME}-8001.app.github.dev`;
