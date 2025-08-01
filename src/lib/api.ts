
// src/lib/api.ts
export async function fetchTools() {
    const res = await fetch('http://192.168.1.43:8000/api/tools/');
    if (!res.ok) throw new Error('Failed to fetch tools');
    return res.json();
  }
  