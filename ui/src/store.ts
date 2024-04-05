import { create } from 'zustand';
import { produce } from 'immer';

export enum WorldState {
  Loading = 1,
  Playing = 2,
  Won = 3,
  Lost = 4,
}

export enum TileState {
  Hidden = 1,
  Shown = 2,
  Explosion = 3,
  Flag = 4,
}

export type TileData = {
  state: TileState;
  x: number;
  y: number;
  count: number;
}

export type WorldData = {
  slug: string;
  state: WorldState;
  width: number;
  height: number;
  cleared: number;
  mine_count: number;
}

type StoreData = {
  // TODO: Does this violate the requirements? I want to cache the state of the world
  tiles: Record<string, TileData>;
  reload(loader: (slug: string, url?: string | null) => Promise<{ next: string | null; results: TileData[] }>): Promise<void>;
  update(state: TileState.Flag | TileState.Shown, x: number, y: number): Promise<void>;
}

export type Store = ReturnType<typeof createWorldStore>;

export function createWorldStore(
  updater: (state: TileState.Flag | TileState.Shown, slug: string, x: number, y: number) => Promise<TileData>,
  world: WorldData,
  tiles: Record<string, TileData> = {},
) {
  const store = create<WorldData & StoreData>((set, get) => ({
    ...world,
    tiles,
    async reload(loader) {
      let next: string | null | undefined;
      let results: TileData[];
      do {
        ({ next, results } = await loader(world.slug, next));

        set(produce(state => {
          for (const tile of results) {
            state.tiles[`${tile.x},${tile.y}`] = tile;
          }
        }));
      } while(next);
    },
    async update(state, x, y) {
      const { update, width, height, slug } = get();
      const tile = await updater(state, slug, x, y);

      let expand = false;
      set(produce(state => {
        state.tiles[`${x},${y}`] = tile;
        if (tile.state === TileState.Explosion) {
          state.state = WorldState.Lost;
        } else if (tile.state === TileState.Shown) {
          state.cleared++;

          // TODO: Can this be cheated? The backend is still the source of truth
          if ((state.cleared + state.mine_count) >= state.width * state.height) {
            state.state = WorldState.Won;
          }

          // Auto expand if there are no nearby mines, stop at the edges or if already shown
          if (tile.count === 0) {
            expand = true;
          }
        }
      }));

      if (!expand) {
        return;
      }

      const check = (x: number, y: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) {
          return;
        }

        if (`${x},${y}` in get().tiles) {
          return;
        };

        update(TileState.Shown, x, y);
      }

      check(x - 1, y - 1);
      check(x - 1, y);
      check(x - 1, y + 1);

      check(x, y - 1);
      check(x, y + 1);

      check(x + 1, y + 1);
      check(x + 1, y);
      check(x + 1, y + 1);
    }
  }));

  return store;
}