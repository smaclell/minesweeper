// import 'unfetch/polyfill';
import { generate } from 'random-words';
import { TileState } from './store';

type CreateRequest = {
  slug: string;
  width: number;
  height: number;
  mine_count: number;
  debug_flags?: string;
};

// TODO: Error handling
// TODO: Retries
// TODO: Assert the right data was shared

export async function createWorld(width: number, height: number, mines: number) {
  let retries = 5;

  const body: CreateRequest = {
    slug: '',
    width,
    height,
    mine_count: mines,
  };

  if (window.URLSearchParams) {
    const search = new window.URLSearchParams(window.location.search);
    const debug_flags = search.get('debug');
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
      // TODO: Sleep?
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

export async function loadWorld(slug: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/worlds/${slug}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });

  if (response.ok) {
    const world = await response.json();
    return { world };
  }

  throw new Error('Failed to load world');
}

export async function updateTile(state: TileState.Flag | TileState.Shown, slug: string, x: number, y: number) {
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

  throw new Error('Failed to update tile');
}