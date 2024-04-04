'use client'
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createWorld } from '@/api';

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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="flex flex-col items-center justify-center">
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
      </div>
    </main>
  );
}
