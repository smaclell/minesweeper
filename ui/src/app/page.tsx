'use client'
import { useCallback } from "react";
import { generate } from 'random-words';

export default function Home() {
  const createWorld = useCallback((width: number, height: number, mines: number) => {
    const slug = generate({ exactly: 3, join: '-' });
    console.log(width, height, mines, slug);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="flex flex-col items-center justify-center">
          <button onClick={() => createWorld(8, 8, 5)}>
            Easy 😀
          </button>
          <button onClick={() => createWorld(12, 12, 20)}>
            Medium 😮
          </button>
          <button onClick={() => createWorld(16, 16, 64)}>
            Hard 😨
          </button>
        </div>
      </div>
    </main>
  );
}
