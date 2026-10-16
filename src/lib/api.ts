import { User } from 'firebase/auth';

/**
 * A wrapper around fetch that automatically gets the Firebase user token
 * and attaches it to the Authorization header.
 * 
 * @param user The current Firebase user object
 * @param input The API endpoint to fetch (e.g., '/api/links')
 * @param init Additional fetch options (method, body, etc.)
 */
export async function fetchWithAuth(user: User | null, input: string, init?: RequestInit): Promise<Response> {
  if (!user) {
    throw new Error("Must be logged in to make this request");
  }

  const token = await user.getIdToken();
  const headers = new Headers(init?.headers);

  // Set default content-type if there is a body and it's not FormData
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
