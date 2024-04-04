import React, { MouseEvent, useCallback, useState } from 'react';
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
  const [clicking, setClicking] = useState(false);

  // TODO: Accessibilty
  const state = data?.state ?? TileState.Hidden;
  const { className, content } = lookup[state];

  let inside = content[state];
  let count = data?.count ?? 0;
  if (state === TileState.Shown) {
    inside = !data ? ':(' : count > 0 ? count.toString() : '';
  }

  const innerOnClick = useCallback(async (e: MouseEvent) => {
    const state = e.type === 'contextmenu' ? TileState.Flag : TileState.Shown;
    setClicking(true);
    try {
      onClick(state, x, y);
    } catch {
      setClicking(false);
    }
  }, [onClick, x, y]);

  return (
    <div
      className={clsx('tile', className)}
      data-x={x} data-y={y}
      data-count={state === TileState.Shown ? count : undefined}
      onClick={!clicking ? innerOnClick : undefined}
      onContextMenu={!clicking ? innerOnClick : undefined}
    >
      {inside}
    </div>
  );
});