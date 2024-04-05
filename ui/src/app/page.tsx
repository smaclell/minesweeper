'use client'
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createWorld } from '@/api';

// TODO: (refactor) update to have simple clean routes

export default function Home() {
  const router = useRouter();

  const create = useCallback(async (width: number, height: number, mines: number) => {
    const { slug } = await createWorld(width, height, mines);

    if (!slug) {
      alert('Something went wrong');
      return;
    }
    router.push(`/world/?slug=${slug}`);
  }, [router]);

  return (
    <>
      <h1 className="text-lg">Minesweeper</h1>
      <p>How hard would you like it to be?</p>
      <div className="flex flex-col items-start justify-center">
        <button onClick={() => create(8, 8, 5)}>
          Easy 😀
        </button>
        <button onClick={() => create(12, 12, 20)}>
          Medium 😮
        </button>
        <button onClick={() => create(16, 16, 64)}>
          Hard 😨
        </button>
      </div>
    </>
  );
}
