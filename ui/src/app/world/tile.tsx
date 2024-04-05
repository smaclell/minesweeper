import React, { MouseEvent, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from 'zustand';
import clsx from 'clsx';
import { Store, TileState } from '@/store';

const lookup: Record<number, { className: string; content: string }> = {
  [TileState.Hidden]: {
    className: 'unknown',
    content: '',
  },
  [TileState.Shown]: {
    className: 'revealed',
    content: ':(',
  },
  [TileState.Flag]: {
    className: 'flag',
    content: '🚩',
  },
  // TODO: (scope) Reveal all mines after a win/loss
  /*
  [TileState.Mine]: {
    className: '',
    content: '💣',
  },
  */
  [TileState.Explosion]: {
    className: 'explosion',
    content: '💥',
  },
};

export default React.memo(function Tile({
  x,
  y,
  store
}: {
  x: number;
  y: number;
  store: Store,
}) {

  const { data, update } = useStore(
    store,
    useShallow((state) => ({
      data: state.tiles[`${x},${y}`],
      update: state.update,
    })),
  );

  const clicking = useRef(false);

  // TODO: (scope) Ensure tiles are accessible
  const state = data?.state ?? TileState.Hidden;
  const { className, content } = lookup[state];

  let inside = content;
  let count = data?.count ?? 0;
  if (state === TileState.Shown) {
    inside = !data ? ':(' : count > 0 ? count.toString() : '';
  }

  const onClick = useCallback(async (e: MouseEvent) => {
    const state = e.type === 'contextmenu' || e.shiftKey || e.ctrlKey ? TileState.Flag : TileState.Shown;
    e.preventDefault();

    if (clicking.current) {
      return;
    }

    clicking.current = true;
    try {
      update(state, x, y);
    } finally {
      clicking.current = false;
    }
  }, [update, x, y]);

  return (
    <div
      className={clsx('tile', className)}
      data-x={x} data-y={y}
      data-count={state === TileState.Shown ? count : undefined}
      onClick={onClick}
      onContextMenu={onClick}
    >
      {inside}
    </div>
  );
});