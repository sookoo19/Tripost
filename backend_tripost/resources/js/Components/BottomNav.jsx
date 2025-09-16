import { Link } from '@inertiajs/react';

export default function BottomNav() {
  return (
    <div className='fixed bottom-0 left-0 w-full bg-gray-50 z-50 grid grid-cols-4 items-center justify-items-center py-2 border-t'>
      <Link href={route('posts.index')} aria-label='投稿一覧'>
        <img
          src='/images/home _button.svg'
          alt='home'
          className='h-10 w-10'
          draggable={false}
        />
      </Link>
      <Link href={route('posts.search')} aria-label='投稿検索'>
        <img
          src='/images/researh_button.svg'
          alt='research'
          className='h-10 w-10'
          draggable={false}
        />
      </Link>
      <Link href={route('posts.index')} aria-label='ダミー'>
        <img
          src='/images/home _button.svg'
          alt='home'
          className='h-10 w-10'
          draggable={false}
        />
      </Link>
      <Link href={route('profile.show')} aria-label='プロフィール画面'>
        <img
          src='/images/profile _button.svg'
          alt='profile'
          className='h-10 w-10'
          draggable={false}
        />
      </Link>
    </div>
  );
}
