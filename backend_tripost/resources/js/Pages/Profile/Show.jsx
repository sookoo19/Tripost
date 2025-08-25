import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({ user, countries }) {
  const [showModal, setShowModal] = useState(false);

  const getCountry = code => countries.find(c => c.code === code);
  // 訪問国の絵文字リストを事前に作成
  const visitedCountryImages =
    user.visited_countries && user.visited_countries.length > 0
      ? [...user.visited_countries]
          .map(code => getCountry(code))
          .filter(country => country) // null除外
          .sort((a, b) => a.name.localeCompare(b.name, 'ja')) // 国名であいうえお順
          .map(country => <span key={country.code}>{country.image}</span>)
      : null;

  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <Head title='Profile' />
      <div className='w-full'>
        {/*ヘッダー*/}
        <Link href='/'>
          <img
            src='/images/header.svg'
            alt='header'
            className='w-full h-auto block object-cover'
          />
        </Link>
      </div>
      <div className='max-w-md mx-auto bg-white px-8 relative'>
        <div className='flex flex-col'>
          <div className='flex flex-row flex-wrap justify-start'>
            {/*プロフィール画像*/}
            <div className='w-16 xs:w-20 h-16 xs:h-20 rounded-full overflow-hidden bg-gray-100 mb-4 flex items-center justify-center'>
              {user.profile_image ? (
                <img
                  src={`/storage/${user.profile_image}`}
                  alt='プロフィール画像'
                  className='object-cover w-full h-full'
                  draggable={false}
                />
              ) : (
                <span className='text-gray-400 text-6xl'>👤</span>
              )}
            </div>
            <div className='flex flex-col ml-3'>
              <div className='flex flex-row items-center'>
                {/*ユーザーID*/}
                <div className='text-lg font-bold xs:mt-3'>
                  @{user.displayid}
                </div>
                {/*設定アイコン*/}
                <button
                  type='button'
                  className='opacity-50 h-8 w-8 absolute right-4 z-50 cursor-pointer'
                  onClick={() => setShowModal(true)}
                  aria-label='設定モーダルを開く'
                >
                  <img
                    src='/images/uil--setting.svg'
                    alt='setting'
                    className='h-8 w-8'
                    draggable={false}
                  />
                </button>
              </div>
              {/*モーダル*/}
              {showModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
                  <div className='bg-white rounded-lg p-6 shadow-lg min-w-[250px]'>
                    <div className='mb-4 text-lg font-bold'>設定メニュー</div>
                    <Link href='auth/confirm-password'>
                      <div className='mb-2 text-lg font-normal'>
                        パスワード設定
                      </div>
                    </Link>
                    <div className='mb-4 text-lg font-normal'>
                      このアプリについて
                    </div>
                    <button
                      type='button'
                      className='mb-4 text-lg text-red-500 font-semibold w-full text-left'
                      onClick={() => {
                        if (window.confirm('本当にログアウトしますか？')) {
                          router.post('/auth/logout');
                        }
                      }}
                    >
                      ログアウト
                    </button>
                    <button
                      className='mt-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600'
                      onClick={() => setShowModal(false)}
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              )}
              {/*ユーザー名*/}
              <div className='text-2xl font-bold'>{user.name}</div>
            </div>
            <div className='mt-1'>
              {/*フォロー数、フォロワー数、投稿数*/}
              <span className='text-base font-bold'>1</span>
              <span className='text-xs xs:text-sm'>タビ</span>
              <span className='ml-3 text-base font-bold'>1</span>
              <span className='text-xs xs:text-sm'>フォロワー</span>
              <span className='ml-3 text-base font-bold'>1</span>
              <span className='text-xs xs:text-sm'>フォロー</span>
            </div>
          </div>
          {/*自己紹介文*/}
          <div className='mt-3 font-normal text-sm'>
            {user.bio &&
              user.bio.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
          </div>
          {/*訪れた国*/}
          <div className='mt-2 flex flex-wrap gap-1'>
            {visitedCountryImages}
          </div>
        </div>
      </div>
      <div className='mt-3'>
        <Link href='/profile/edit'>
          <button
            className='shadow-md inline-flex items-center rounded-2xl border border-transparent bg-white px-2 xs:px-4 py-2 text-xs xs:text-sm font-semibold uppercase tracking-widest text-black transition duration-150 ease-in-out hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
            disabled={false}
          >
            プロフィールを編集
          </button>
        </Link>
        <button
          className=' ml-4 shadow-md inline-flex items-center rounded-2xl border border-transparent bg-white px-2 xs:px-4 py-2 text-xs xs:text-sm font-semibold uppercase tracking-widest text-black transition duration-150 ease-in-out hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
          disabled={false}
        >
          プロフィールを共有
        </button>
      </div>
    </div>
  );
}
