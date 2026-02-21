// config.ts
export const API_BASE_URL = (import.meta as any).env?.PROD
    ? 'https://devoffs-live.onrender.com'
    : 'http://localhost:3000';
