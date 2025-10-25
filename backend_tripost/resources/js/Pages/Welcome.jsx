import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
  return (
    <>
      <Head title='ようこそ' />
      <div className='min-h-screen flex flex-col relative overflow-hidden'>
        {/* 背景画像（画面幅に応じて画像を切替） */}
        <div className='absolute inset-0 z-0'>
          <picture className='w-full h-full block'>
            {/* lg以上（>=1024px）：welcome_desktop */}
            <source
              media='(min-width:1024px)'
              srcSet='/images/welcome_desktop.svg'
            />
            {/* sm以上（>=640px）：welcome_tablet */}
            <source
              media='(min-width:640px)'
              srcSet='/images/welcome_tablet.svg'
            />
            {/* それ以下：welcome_mobile（デフォルト） */}
            <img
              src='/images/welcome_mobile.svg'
              alt='welcome'
              className='w-full h-full object-cover pointer-events-none select-none'
              draggable={false}
            />
          </picture>
        </div>

        {/* コンテンツ */}
        <div className='relative z-10 flex-1 flex flex-col'>
          {/* 必要に応じて上部コンテンツ */}
        </div>

        {/* フッターボタン（画面下部に配置：常に縦積み） */}
        <div className='mt-auto mb-56 lg:mb-40 flex flex-col items-center z-50 px-4 space-y-3'>
          <Link
            href='/auth/register'
            className='text-lg sm:text-2xl w-full max-w-xs sm:max-w-sm md:max-w-md px-6 py-3 bg-black text-white font-bold rounded-full shadow-xl text-base sm:text-lg hover:scale-105 transition-transform duration-200 ease-in-out text-center'
          >
            登録 / ログインはこちら
          </Link>
          <Link
            href={route('posts.index')}
            className='text-sm sm:text-lg underline text-center text-gray-800'
          >
            ゲストログイン
          </Link>
        </div>
      </div>
    </>
  );
}
