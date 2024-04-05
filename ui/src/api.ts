import { generate } from 'random-words';
import { TileData, TileState, WorldData } from './store';

type CreateRequest = {
  slug: string;
  width: number;
  height: number;
  mine_count: number;
  debug_flags?: string;
};

// TODO: (scope) Assert the right data was shared
// TODO: (refactor) This file has lots of repeated patterns, consider using a fetch wrapper
// TODO: (refactor) Consider further improving the handling and retries

export async function createWorld(width: number, height: number, mines: number): Promise<WorldData> {
  let retries = 5;

  const body: CreateRequest = {
    slug: '',
    width,
    height,
    mine_count: mines,
  };

  if (process.env.NODE_ENV === 'development') {
    const search = new URLSearchParams(window.location.search);
    const debug_flags = search.get('debug_flags');
    if (debug_flags) {
      body.debug_flags = debug_flags;
    }
  }

  do {
    const slug = generate({ exactly: 3, join: '-' });
    body.slug = slug;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/worlds/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok && response.status === 409) {
      retries -= 1;
    } else if (response.ok) {
      const world = await response.json();
      return world;
    } else {
      response.json().then(j => console.error(j));
      throw new Error('Failed to create world');
    }
  } while (retries > 0);

  throw new Error('Failed to create world after 5 tries');
}

export async function loadWorld(slug: string): Promise<WorldData> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/worlds/${slug}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });

  if (response.ok) {
    const world = await response.json();
    return world;
  }

  throw new Error('Failed to load world');
}

export async function loadTiles(slug: string, url: string | null = 'initial'): Promise<{ next: string | null; results: TileData[] }> {
  if (!url) {
    return { next: null, results: [] };
  }

  if (url === 'initial') {
    url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/worlds/${slug}/tiles/`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });

  if (response.ok) {
    const { next, results } = await response.json();
    return { next, results };
  }

  throw new Error('Failed to load tiles');
}

export async function updateTile(state: TileState.Flag | TileState.Shown, slug: string, x: number, y: number): Promise<TileData | undefined> {
  for (let retries = 5; retries > 0; retries--) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/worlds/${slug}/tiles/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ state, x, y })
    });

    if (response.ok) {
      const tile = response.json();
      return tile;
    }

    if (response.status === 404) {
      return undefined;
    }
  }

  throw new Error('Failed to update tile');
}