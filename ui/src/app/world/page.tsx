
'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { loadWorld, updateTile } from '../../api';
import { WorldData, WorldState, createWorldStore } from '../../store';
import { useStore } from 'zustand';
import Tile from './tile';

function Grid() {

}

function WorldView({ world }: { world: WorldData }) {
  const store = useMemo(() => {
    return createWorldStore(updateTile, world);
  }, [world]);

  // Memoize and pass it down
  const { tiles, update } = useStore(store);

  // TODO: Fix the routes

  const { positions, style } = useMemo(() => {
    const style: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${world.width}, 32px)`,
      gridTemplateRows: `repeat(${world.height}, 32px)`,
      gridAutoFlow: 'column',
    };

    const positions: [x: number, y: number, key: string][] = [];
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        positions.push([x, y, `${x},${y}`]);
      }
    }

    return { positions, style }
  }, [world.width, world.height]);

  return (
    <div>
      <div>
        <h1>{world?.slug}</h1>
        <p>Cleared: {world.cleared}</p>
        <p>Mines: {world.mine_count}</p>

        {world.state === WorldState.Won ? (<p className="text-lg">🎉🎉🎉 You Won! 🎉🎉🎉</p>) : null}
        {world.state === WorldState.Lost ? (<p className="text-lg">🔥🔥🔥 You Lost! 🔥🔥🔥</p>) : null}
      </div>
      <div className="world" style={style}>
        {positions.map(([x, y, key]) => (
          <Tile
            key={key}
            x={x}
            y={y}
            data={tiles[key]}
            onClick={update}
          />
        ))}
      </div>
    </div>
  )
}

function LoadingView() {
  return (
    <div>Loading...</div>
  );
}

export default function WorldPage() {

  const [world, setWorld] = useState<WorldData | undefined>();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug || !/^[a-z]+-[a-z]+-[a-z]+$/.test(slug)) {
      // TODO: Throw/go back to the main page
      throw new Error('bad slug doug')
    }

    let accept = true;
    loadWorld(slug).then(({ world }) => {
      if (!accept) {
        return;
      }

      setWorld(world);
    });

    return () => {
      accept = false;
    }
  }, [setWorld]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        {world? <WorldView world={world} /> : <LoadingView />}
      </div>
    </main>
  );
}
