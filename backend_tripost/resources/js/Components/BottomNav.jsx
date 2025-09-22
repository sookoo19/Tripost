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
      <Link href={route('posts.create')} aria-label='投稿作成'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width={50}
          height={50}
          viewBox='0 0 21 21'
        >
          <g
            fill='none'
            fillRule='evenodd'
            stroke='#303947ff'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
          >
            <path d='M10 4.5H5.5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V11'></path>
            <path d='M17.5 3.467a1.46 1.46 0 0 1-.017 2.05L10.5 12.5l-3 1l1-3l6.987-7.046a1.41 1.41 0 0 1 1.885-.104zm-2 2.033l.953 1'></path>
          </g>
        </svg>
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
