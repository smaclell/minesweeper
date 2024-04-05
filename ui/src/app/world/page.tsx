
'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { loadWorld, loadTiles, updateTile } from '../../api';
import { WorldData, WorldState, createWorldStore } from '../../store';
import { useStore } from 'zustand';
import Tile from './tile';

function WorldView({ world }: { world: WorldData }) {
  const store = useMemo(() => {
    return createWorldStore(() => loadWorld(world.slug), updateTile, world);
  }, [world]);

  useEffect(() => {
    const { reload } = store.getState()
    reload(loadTiles)
  }, [store]);

  // TODO: (fix) Memoize and pass it down
  const { state, cleared, mine_count, tiles, update } = useStore(store);

  // TODO: (scope) update to have simple clean routes

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
      <div className="my-2">
        <a href="/">← go back</a>
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
      <div className="my-4">
        <p>Cleared: {cleared}</p>
        <p>Mines: {mine_count}</p>
      </div>
      <div className="text-lg my-4">
        {state === WorldState.Playing ? (
          <>
            <p>Click to show a cell.</p>
            <p>Right click to place a 🚩.</p>
            <p>Good luck!</p>
          </>
        ) : null}
        {state === WorldState.Won ? (<p>🎉🎉🎉 You Won! 🎉🎉🎉</p>) : null}
        {state === WorldState.Lost ? (<p>🔥🔥🔥 You Lost! 🔥🔥🔥</p>) : null}
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
      window.location.href = '/';
      return;
    }

    let accept = true;
    loadWorld(slug).then((world) => {
      if (accept) {
        setWorld(world);
      }
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
