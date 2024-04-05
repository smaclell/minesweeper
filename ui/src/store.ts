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
  tiles: Record<string, TileData>;
  reload(loader: (slug: string, url?: string | null) => Promise<{ next: string | null; results: TileData[] }>): Promise<void>;
  update(state: TileState.Flag | TileState.Shown, x: number, y: number): Promise<void>;
}

export type Store = ReturnType<typeof createWorldStore>;

export function createWorldStore(
  refresh: () => Promise<WorldData>,
  updater: (state: TileState.Flag | TileState.Shown, slug: string, x: number, y: number) => Promise<TileData | undefined>,
  world: WorldData,
  tiles: Record<string, TileData> = {},
) {
  const { slug, width, height } = world;

  const store = create<WorldData & StoreData>((set, get) => {
    const refreshWorld = async () => {
      const updated = await refresh();
      set(state => ({
        ...state,
        ...updated,
      }));
    };

    // Only expand if there are no nearby mines, stop at the edges or if already shown
    const autoExpand = async (tile: TileData) => {
      const expand = tile.state === TileState.Shown && tile.count === 0;
      if (!expand) {
        return;
      }

      const { x, y } = tile;
      await Promise.allSettled([
        check(x - 1, y - 1),
        check(x - 1, y),
        check(x - 1, y + 1),

        check(x, y - 1),
        check(x, y + 1),

        check(x + 1, y - 1),
        check(x + 1, y),
        check(x + 1, y + 1),
      ]);
    }

    const check = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return;
      }

      if (`${x},${y}` in get().tiles) {
        return;
      };

      return innerUpdate(TileState.Shown, x, y, false);
    };

    const innerUpdate = async (state: TileState.Flag | TileState.Shown, x: number, y: number, rootUpdate: boolean) => {
        const tile = await updater(state, slug, x, y);
        if (!tile) {
          return;
        }

        set(produce(state => {
          state.tiles[`${x},${y}`] = tile;
        }));

        await autoExpand(tile);
        if (rootUpdate) {
          await refreshWorld();
        }
      };

    return ({
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
        return innerUpdate(state, x, y, true);
      },
    });
  });

  return store;
}