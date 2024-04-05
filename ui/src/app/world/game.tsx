'use client'
import React, { useMemo } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Store } from '../../store';
import Tile from './tile';

export default React.memo(function Game({ store }: { store: Store }) {
  const { width, height } = useStore(
    store,
    useShallow((state) => ({ width: state.width, height: state.height })),
  );

  const { positions, style } = useMemo(() => {
    const style: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${width}, 32px)`,
      gridTemplateRows: `repeat(${height}, 32px)`,
      gridAutoFlow: 'column',
    };

    const positions: [x: number, y: number, key: string][] = [];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        positions.push([x, y, `${x},${y}`]);
      }
    }

    return { positions, style };
  }, [width, height]);

  return (
    <div className="game" style={style}>
      {positions.map(([x, y, key]) => (
        <Tile
          key={key}
          x={x}
          y={y}
          store={store}
        />
      ))}
    </div>
  );
});
