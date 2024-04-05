import React, { MouseEvent, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { TileData, TileState } from '@/store';

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
  // TODO: Reveal all mines after a win/loss
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
  data,
  x,
  y,
  onClick // TODO: Clicks
}: {
  data: TileData | undefined;
  x: number;
  y: number;
  onClick: (state: TileState.Flag | TileState.Shown, x: number, y: number) => Promise<void>;
}) {
  const clicking = useRef(false);

  // TODO: Accessibilty
  const state = data?.state ?? TileState.Hidden;
  const { className, content } = lookup[state];

  let inside = content;
  let count = data?.count ?? 0;
  if (state === TileState.Shown) {
    inside = !data ? ':(' : count > 0 ? count.toString() : '';
  }

  const innerOnClick = useCallback(async (e: MouseEvent) => {
    const state = e.type === 'contextmenu' || e.shiftKey || e.ctrlKey ? TileState.Flag : TileState.Shown;
    e.preventDefault();

    if (clicking.current) {
      return;
    }

    clicking.current = true;
    try {
      onClick(state, x, y);
    } finally {
      clicking.current = false;
    }
  }, [onClick, x, y]);

  return (
    <div
      className={clsx('tile', className)}
      data-x={x} data-y={y}
      data-count={state === TileState.Shown ? count : undefined}
      onClick={innerOnClick}
      onContextMenu={innerOnClick}
    >
      {inside}
    </div>
  );
});