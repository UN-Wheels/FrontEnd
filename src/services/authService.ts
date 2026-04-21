export interface PublicUser {
  name?: string;
  email: string;
}

export async function getUserByEmail(email: string): Promise<PublicUser | null> {
  try {
    const res = await fetch(`/api/auth/users/${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
