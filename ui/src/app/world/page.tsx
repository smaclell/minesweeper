'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { loadWorld, loadTiles, updateTile } from '../../api';
import { WorldData, WorldState, createWorldStore } from '../../store';
import Game from './game';

function WorldView({ world }: { world: WorldData }) {
  const store = useMemo(() => {
    return createWorldStore(() => loadWorld(world.slug), updateTile, world);
  }, [world]);

  useEffect(() => {
    const { reload } = store.getState();
    reload(loadTiles);
  }, [store]);

  const { state, cleared, mines } = useStore(
    store,
    useShallow((state) => ({
      state: state.state,
      cleared: state.cleared,
      mines: state.mine_count,
    })),
  );

  return (
    <div>
      <div className="my-2">
        <a href="/">← go back</a>
      </div>
      <Game store={store} />
      <div className="my-4">
        <p>Cleared: {cleared}</p>
        <p>Mines: {mines}</p>
      </div>
      <div className="text-lg my-4">
        {state === WorldState.Playing ? (
          <>
            <p>Click to show a cell.</p>
            <p>Right click to 🚩 cells.</p>
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

  if (world) {
    return <WorldView world={world} />;
  } else {
    return <LoadingView />;
  }
}
