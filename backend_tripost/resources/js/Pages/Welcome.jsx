import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
  return (
    <>
      <Head title='Tripost' />
      <div className='min-h-screen relative bg-yellow-400'>
        {/* 背景画像 */}
        <img
          src='/images/main_tripost.png'
          alt='welcome'
          className='absolute inset-0 w-full h-full object-cover'
          draggable={false}
        />

        {/* 中央のキャッチ */}
        <div className='relative z-10 flex flex-col items-center justify-center min-h-screen px-5 text-center'>
          <h2 className='text-white text-2xl xs:text-3xl sm:text-4xl font-bold drop-shadow-lg ml-1 mb-3'>
            旅の計画も、思い出も。
            <br />
            みんなとシェアしよう。
          </h2>
          <p className='text-white/90 text-lg sm:text-xl mb-80  drop-shadow'>
            Tripost — タビを、手軽に
          </p>

          {/* 大きな中央ボタン（黒いピル） */}
          <Link
            href='/auth/register'
            className='mt-6 mb-3 z-20 px-8 py-4 bg-black text-white font-bold rounded-full shadow-xl text-lg max-w-xs w-full hover:scale-105 transition-transform duration-200 ease-in-out inline-block text-center'
          >
            登録 / ログインはこちら
          </Link>
          <Link href={route('posts.index')} className='underline'>
            ゲストで利用する
          </Link>
        </div>
      </div>
    </>
  );
}
