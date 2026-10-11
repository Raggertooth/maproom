import type { MindMap } from '../shared/types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...options?.headers },
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
    throw new Error(problem.error ?? response.statusText);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const api = {
  listMaps: () => request<MindMap[]>('/api/maps'),
  createMap: (title: string) => request<MindMap>('/api/maps', { method: 'POST', body: JSON.stringify({ title }) }),
  saveMap: (map: MindMap) => request<MindMap>(`/api/maps/${encodeURIComponent(map.id)}`, { method: 'PUT', body: JSON.stringify(map) }),
};
