import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ToLoginModal from '@/Components/ToLoginModal';

export default function BottomNav() {
  const page = usePage();
  const user = page.props?.auth?.user;
  const [showModal, setShowModal] = useState(false);
  const [toLoginModalOpen, setToLoginModalOpen] = useState(false);

  return (
    <div className='fixed bottom-0 left-0 w-full bg-gray-50 z-10 grid grid-cols-4 items-center justify-items-center py-2 border-t'>
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

      <button
        onClick={
          user ? () => setShowModal(true) : () => setToLoginModalOpen(true)
        }
      >
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
      </button>
      {/*モーダル*/}
      {showModal && (
        <button
          onClick={() => setShowModal(false)}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10'
        >
          <div className='bg-white rounded-lg p-4 pb-6 shadow-lg min-w-[300px]'>
            <button
              type='button'
              aria-label='閉じる'
              className='flex ml-auto rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none'
              onClick={() => setShowModal(false)}
            >
              <svg
                className='h-6 w-6'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
            <div className='ml-4 text-left mb-4 text-lg font-bold text-gray-700 hover:text-black'>
              <Link href={route('posts.create')} aria-label='投稿作成'>
                タビ新規作成
              </Link>
            </div>
            <div className='ml-4 text-left text-lg font-bold text-gray-700 hover:text-black'>
              <Link href={route('posts.draft')} aria-label='投稿下書き'>
                下書き一覧
              </Link>
            </div>
          </div>
        </button>
      )}
      {user ? (
        <Link href={route('profile.show')} aria-label='プロフィール画面'>
          <img
            src='/images/profile _button.svg'
            alt='profile'
            className='h-10 w-10'
            draggable={false}
          />
        </Link>
      ) : (
        <button type='button' onClick={() => setToLoginModalOpen(true)}>
          <img
            src='/images/profile _button.svg'
            alt='profile'
            className='h-10 w-10'
            draggable={false}
          />
        </button>
      )}
      {/* 未ログイン時に投稿クリックで表示するモーダル */}
      <ToLoginModal
        show={toLoginModalOpen}
        closeModal={() => setToLoginModalOpen(false)}
      />
    </div>
  );
}
