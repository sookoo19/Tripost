import { Head, Link } from '@inertiajs/react';

export default function Show({ user, countries }) {
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
              </div>
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
    </div>
  );
}
