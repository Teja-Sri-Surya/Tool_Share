import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  name: string;
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function makeAuthenticatedRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get token from cookies (this will be handled by the browser automatically)
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

export function getAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}