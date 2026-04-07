import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import BottomNav from '@/Components/BottomNav';
import axios from 'axios';

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
    // 常に /profile/{user} の共有用 URL を生成（Ziggy の route ヘルパーを使用）
    // 第3引数 true を付けると絶対 URL が返る（例: https://mytripost.com/profile/3）
    const url = route('users.profile', { user: user.displayid }, true);

    void (async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${user.name}さんのプロフィール`,
            url,
          });
        } catch (error) {
          console.error('共有に失敗しました:', error);
        }
      } else {
        try {
          await navigator.clipboard.writeText(url);
          alert('共有用URLをコピーしました');
        } catch (error) {
          console.error('URLのコピーに失敗しました:', error);
        }
      }
    })();
  }, [user]);

  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <Head title='プロフィール' />
      <div className='w-full'>
        {/*ヘッダー*/}
        <Link href={route('posts.index')}>
          <picture>
            <source media='(min-width:1024px)' srcSet='/images/header_lg.svg' />
            <img
              src='/images/header.svg'
              alt='header'
              className='w-full h-auto block object-cover'
            />
          </picture>
        </Link>
      </div>
      <div className='max-w-md mx-auto bg-white px-8 mt-6 relative'>
        <div className='flex flex-col'>
          <div className='flex flex-row flex-wrap justify-start'>
            {/*プロフィール画像*/}
            <div className='w-16 xs:w-20 h-16 xs:h-20 rounded-full overflow-hidden bg-gray-100 mb-4 flex items-center justify-center'>
              {user.profile_image ? (
                <img
                  src={
                    user.profile_image_url || `/storage/${user.profile_image}`
                  }
                  alt='プロフィール画像'
                  className='object-cover w-full h-full'
                  draggable={false}
                />
              ) : (
                <img
                  src='/images/defalt_profile.jpg'
                  alt='プロフィール画像'
                  className='object-cover w-full h-full'
                  draggable={false}
                />
              )}
            </div>
            <div className='flex flex-col ml-3'>
              <div className='flex flex-row items-center'>
                {/*ユーザーID*/}
                <div className='text-lg font-bold xs:mt-3 max-w-[10rem] xs:max-w-[12rem] sm:max-w-[18rem] whitespace-normal break-words break-all'>
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
                <div className='fixed inset-0 z-50 flex items-center justify-center'>
                  <button
                    type='button'
                    className='absolute inset-0 bg-black bg-opacity-10'
                    onClick={() => setShowModal(false)}
                    aria-label='閉じる'
                  />
                  <div
                    className='bg-white rounded-lg p-6 shadow-lg min-w-[250px] relative'
                    role='dialog'
                    aria-modal='true'
                    aria-labelledby='profile-modal-title'
                    onClick={e => e.stopPropagation()}
                  >
                    <div className='flex flex-row'>
                      <button
                        type='button'
                        className='flex ml-auto rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none'
                        onClick={() => setShowModal(false)}
                        aria-label='閉じる'
                      >
                        <span className='sr-only'>閉じる</span>
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
                    </div>
                    <h2 id='profile-modal-title' className='sr-only'>
                      設定
                    </h2>
                    <Link href={route('posts.mylikes')}>
                      <div className='mb-4 text-lg text-gray-700 font-semibold w-full text-left'>
                        いいねしたタビ
                      </div>
                    </Link>
                    <Link href={route('posts.unpublic')}>
                      <div className='mb-4 text-lg text-gray-700 font-semibold w-full text-left'>
                        非公開タビ
                      </div>
                    </Link>
                    <a
                      href='/terms'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-left mb-4 text-lg text-gray-700 font-semibold'
                    >
                      このアプリについて
                    </a>
                    <Link href={route('contact.form')}>
                      <div className='my-4 text-lg text-gray-700 font-semibold w-full text-left'>
                        お問い合わせ
                      </div>
                    </Link>
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
                    <Link href={route('profile.destroy_confirm')}>
                      <div className='text-left mb-4 text-lg text-red-500 font-semibold'>
                        アカウントを消去する
                      </div>
                    </Link>
                  </div>
                </div>
              )}
              {/*ユーザー名*/}
              <div className='text-xl sm:text-2xl font-bold max-w-[10rem] xs:max-w-[12rem] sm:max-w-[18rem] whitespace-normal break-words break-all'>
                {user.name}
              </div>
            </div>
            <div className='mt-1 w-full'>
              {/*フォロー数、フォロワー数、投稿数*/}
              <span className='text-base font-bold'>
                {user.posts_count ?? 0}
              </span>
              <span className='text-xs xs:text-sm'>タビ</span>
              <Link href={route('follower.index', { user: user.displayid })}>
                <span className='ml-3 text-base font-bold'>
                  {user.followers_count ?? 0}
                </span>
                <span className='text-xs xs:text-sm'>フォロワー</span>
              </Link>
              <Link href={route('following.index', { user: user.displayid })}>
                <span className='ml-3 text-base font-bold'>
                  {user.following_count ?? 0}
                </span>
                <span className='text-xs xs:text-sm'>フォロー</span>
              </Link>
            </div>
          </div>
          {/*自己紹介文*/}
          <div className='mt-3 font-normal text-sm lg:text-base'>
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
          className='ml-4 shadow inline-flex items-center rounded-2xl border border-gray-100 border-transparent bg-white px-2 xs:px-4 py-2 text-xs xs:text-sm font-semibold uppercase tracking-widest text-black transition duration-150 ease-in-out hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
          disabled={false}
          onClick={handleShareClick}
        >
          プロフィールを共有
        </button>
      </div>

      <div className='w-full overflow-hidden bg-white'>
        <div className='max-w-xl mx-auto p-4 pb-24'>
          {items.length === 0 && (
            <div className='text-center text-gray-500 py-12'>
              投稿したタビはありません
            </div>
          )}
          {items.map(post => (
            <div
              key={post.id}
              className='bg-white rounded-xl shadow-md mb-6 overflow-hidden border'
            >
              <div className='flex items-center px-4 py-3'>
                <Link href={route('profile.show')}>
                  <img
                    src={
                      post.user.profile_image_url ||
                      '/images/defalt_profile.jpg'
                    }
                    alt='avatar'
                    className='w-5 h-5 lg:h-8 lg:w-8 rounded-full object-cover'
                  />
                </Link>
                <div className='ml-1'>
                  <Link
                    href={route('profile.show')}
                    className='font-semibold text-sm lg:text-lg'
                  >
                    @{post.user.displayid}
                  </Link>
                </div>
                <div className='text-sm lg:text-lg font-bold ml-auto flex flex-row items-center'>
                  <button
                    type='button'
                    className='text-gray-600 hover:text-blue-500 transition-colors duration-150'
                    onClick={() => {
                      // 公開確認ダイアログ
                      if (!window.confirm('この投稿を非公開にしますか？')) {
                        return;
                      }
                      // post を直接変更せず、サーバへ PATCH を送る
                      axios
                        .patch(route('posts.share_scope', post.id), {
                          share_scope: '非公開',
                        })
                        .then(() => {
                          // 必要なら Inertia で再取得
                          router.reload();
                        })
                        .catch(err => {
                          console.error(err);
                        });
                    }}
                    aria-label='公開範囲を非公開にする'
                    title='公開範囲を非公開にする'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width={26}
                      height={26}
                      viewBox='0 0 24 24'
                      className='mr-1'
                    >
                      <path
                        fill='currentColor'
                        d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m-1 17.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41c0 2.08-.8 3.97-2.1 5.39'
                      ></path>
                    </svg>
                  </button>
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
                    src={firstPhotoUrl(post) || '/images/defalt_post.png'}
                    alt={'photo'}
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
                <div className='flex flex-row'>
                  <div className='text-xs text-gray-500 mt-2'>
                    {formatDate(post.created_at)}
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      // 公開確認ダイアログ
                      if (!window.confirm('この投稿を本当に消去しますか？')) {
                        return;
                      }
                      // post を直接変更せず、サーバへ PATCH を送る
                      axios
                        .delete(route('posts.destroy', post.id))
                        .then(() => {
                          // 必要なら Inertia で再取得
                          router.reload();
                        })
                        .catch(err => {
                          console.error(err);
                        });
                    }}
                    className='ml-auto text-gray-500 text-sm hover:text-red-500 transition-colors duration-150 self-end'
                    aria-label='投稿を削除'
                    title='投稿を削除'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='w-6 h-6'
                      viewBox='0 0 24 24'
                    >
                      <path
                        fill='currentColor'
                        d='M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z'
                      ></path>
                    </svg>
                  </button>
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
      <BottomNav />
    </div>
  );
}
