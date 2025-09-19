import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import BottomNav from '@/Components/BottomNav';

export default function Show({ user, countries, posts }) {
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

  // Inertia の paginator に合わせて安全に取得
  const items = posts?.data ?? posts ?? [];

  // 日時表示用フォーマット（1日未満→分/時間前、1日以上→日付）
  const formatDate = s => {
    if (!s) return '';
    try {
      const d = new Date(s);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;

      if (diff < day) {
        const mins = Math.floor(diff / minute);
        if (mins < 1) return 'たった今';
        if (mins < 60) return `${mins}分前`;
        const hrs = Math.floor(diff / hour);
        return `${hrs}時間前`;
      }

      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const dd = d.getDate();

      if (y === now.getFullYear()) {
        return `${m}月${dd}日`;
      }
      return `${y}年${m}月${dd}日`;
    } catch (error) {
      return s;
    }
  };

  const firstPhotoUrl = post => {
    if (post.photos_urls && post.photos_urls[0]) return post.photos_urls[0];
    if (post.photos && post.photos[0]) return `/storage/${post.photos[0]}`;
    return;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('tripost_reload_on_back') === '1') {
      sessionStorage.removeItem('tripost_reload_on_back');
      // Inertia 経由でサーバから再取得
      router.reload();
    }
  }, []);

  const handleShareClick = useCallback(() => {
    const url = window.location.origin + window.location.pathname;

    void (async () => {
      if (navigator.share) {
        // Web share API
        try {
          await navigator.share({
            url,
          });
        } catch (error) {
          console.error('共有に失敗しました:', error);
        }
      } else {
        // Web Share APIが使えないブラウザの処理
        try {
          await navigator.clipboard.writeText(url);
          alert('URLをコピーしました');
        } catch (error) {
          console.error('URLのコピーに失敗しました:', error);
        }
      }
    })();
  }, []);

  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <Head title='Profile' />
      <div className='w-full'>
        {/*ヘッダー*/}
        <Link href={route('posts.index')}>
          <img
            src='/images/header.svg'
            alt='header'
            className='w-full h-auto block object-cover'
          />
        </Link>
      </div>
      <div className='max-w-md mx-auto bg-white px-8 mt-6 relative'>
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
                    <div className='mb-4 text-lg font-bold'>メニュー</div>
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
              <span className='text-base font-bold'>
                {user.posts_count ?? 0}
              </span>
              <span className='text-xs xs:text-sm'>タビ</span>
              <Link href={route('follower.index', { user: user.id })}>
                <span className='ml-3 text-base font-bold'>
                  {user.followers_count ?? 0}
                </span>
                <span className='text-xs xs:text-sm'>フォロワー</span>
              </Link>
              <Link href={route('following.index', { user: user.id })}>
                <span className='ml-3 text-base font-bold'>
                  {user.following_count ?? 0}
                </span>
                <span className='text-xs xs:text-sm'>フォロー</span>
              </Link>
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
      <div className='mt-3 mb-4'>
        <Link href={route('profile.edit')}>
          <button
            className='shadow inline-flex items-center rounded-2xl border border-gray-100 border-transparent bg-white px-2 xs:px-4 py-2 text-xs xs:text-sm font-semibold uppercase tracking-widest text-black transition duration-150 ease-in-out hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
            disabled={false}
          >
            プロフィールを編集
          </button>
        </Link>
        <button
          className=' ml-4 shadow inline-flex items-center rounded-2xl border border-gray-100 border-transparent bg-white px-2 xs:px-4 py-2 text-xs xs:text-sm font-semibold uppercase tracking-widest text-black transition duration-150 ease-in-out hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
          disabled={false}
          onClick={handleShareClick}
        >
          プロフィールを共有
        </button>
      </div>

      <div className='w-full overflow-hidden bg-white'>
        <div className='max-w-xl mx-auto p-4 pb-24'>
          {items.map(post => (
            <div
              key={post.id}
              className='bg-white rounded-xl shadow-md mb-6 overflow-hidden border'
            >
              <div className='flex items-center px-4 py-3'>
                <Link href={route('users.profile', post.user.id)}>
                  <img
                    src={
                      post.user.profile_image_url ||
                      '/images/default-avatar.png'
                    }
                    alt='avatar'
                    className='w-5 h-5 rounded-full object-cover'
                  />
                </Link>
                <div className='ml-1'>
                  <Link
                    href={route('users.profile', post.user.id)}
                    className='font-semibold text-sm'
                  >
                    @{post.user.displayid}
                  </Link>
                </div>
                <div className='text-sm font-bold ml-auto flex flex-row items-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width={28}
                    height={28}
                    viewBox='0 0 24 24'
                  >
                    <path
                      fill='#fcf16eff'
                      d='m12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53z'
                    ></path>
                  </svg>
                  {post.likes_count}
                </div>
              </div>

              <Link href={route('posts.show', post.id)}>
                <div className='relative w-full aspect-square bg-gray-100'>
                  <img
                    src={firstPhotoUrl(post)}
                    alt={post.title || 'photo'}
                    className='w-full h-full object-cover'
                    loading='lazy'
                  />
                </div>
              </Link>

              <div className='px-4 py-3'>
                <h2 className='text-xl font-bold text-gray-700'>
                  {post.title}
                </h2>
                <p className='text-sm text-gray-700 line-clamp-2'>
                  {post.subtitle || post.excerpt || ''}
                </p>
                <div className='text-xs text-gray-500'>
                  {formatDate(post.created_at)}
                </div>
              </div>
            </div>
          ))}

          {/* ページネーション */}
          {posts?.links && (
            <nav className='mt-4 flex justify-center space-x-2 text-sm'>
              {posts.links.map((ln, i) =>
                ln.url ? (
                  <Link
                    key={i}
                    href={ln.url}
                    className={ln.active ? 'font-semibold' : 'text-gray-600'}
                  >
                    {/* label に HTML が入る場合があるので safe に表示 */}
                    <span dangerouslySetInnerHTML={{ __html: ln.label }} />
                  </Link>
                ) : (
                  <span
                    key={i}
                    className='text-gray-400'
                    dangerouslySetInnerHTML={{ __html: ln.label }}
                  />
                )
              )}
            </nav>
          )}
        </div>
      </div>
      {/* 右下の浮遊プラスボタン（新規投稿） */}
      <Link
        href={route('posts.create')}
        aria-label='新規投稿'
        className='fixed right-5 bottom-20 z-10'
      >
        <button
          type='button'
          className='w-14 h-14 md:w-16 md:h-16 rounded-full bg-yellow-300 hover:bg-yellow-400 text-white flex items-center justify-center shadow-lg border-2 border-white focus:outline-none'
        >
          <svg
            className='w-7 h-7'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden
          >
            <rect width='24' height='24' rx='12' fill='transparent' />
            <path
              d='M12 7v10M7 12h10'
              stroke='currentColor'
              strokeWidth='4'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </button>
      </Link>
      <BottomNav />
    </div>
  );
}
