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
    const expansion = new Map<string, { x: number; y: number }>();
    const autoExpand = async (tile: TileData, rootUpdate: boolean) => {
      const expand = tile.state === TileState.Shown && tile.count === 0;
      if (!expand) {
        return;
      }

      const { x, y } = tile;
      check(x - 1, y - 1);
      check(x - 1, y);
      check(x - 1, y + 1);

      check(x, y - 1);
      check(x, y + 1);

      check(x + 1, y - 1);
      check(x + 1, y);
      check(x + 1, y + 1);

      if (!rootUpdate) {
        return;
      }

      while (expansion.size > 0) {
        const promises: Promise<void>[] = [];
        const values = Array.from(expansion.values());
        values.forEach(({ x, y }) => {
          promises.push(innerUpdate(TileState.Shown, x, y, false));
        });

        await Promise.allSettled(promises);
        values.forEach(({ x, y }) => {
          expansion.delete(`${x},${y}`);
        });
      }
    }

    const check = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return;
      }

      const key = `${x},${y}`;
      if (key in get().tiles || expansion.has(key)) {
        return;
      };

      expansion.set(key, { x, y });
    };

    const innerUpdate = async (state: TileState.Flag | TileState.Shown, x: number, y: number, rootUpdate: boolean) => {
        const tile = await updater(state, slug, x, y);
        if (!tile) {
          return;
        }

        set(produce(state => {
          state.tiles[`${x},${y}`] = tile;
        }));

        await autoExpand(tile, rootUpdate);
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
      // TODO: (scope) queue updates to prioritize user inputs over automatically clearing the board
      async update(state, x, y) {
        return innerUpdate(state, x, y, true);
      },
    });
  });

  return store;
}