import { Head, Link, usePage, router } from '@inertiajs/react';
import BottomNav from '@/Components/BottomNav';
import { useState, useEffect } from 'react';
import NotificationsModal from '@/Components/NotificationsModal';
import ToLoginModal from '@/Components/ToLoginModal';
import axios from 'axios';

export default function Index({ posts, filter }) {
  const page = usePage();
  const user = page.props?.auth?.user;
  const currentUserId = page.props?.auth?.user?.id;
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(
    user?.unreadNotificationsCount || 0
  );
  const [toLoginModalOpen, setToLoginModalOpen] = useState(false);

  // 5分ごとに未読通知数を取得
  useEffect(() => {
    // ユーザーがログインしている場合のみ実行
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/notifications/count');
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('未読通知数の取得に失敗しました', error);
      }
    };

    // 初回読み込み
    fetchUnreadCount();

    // インターバル設定
    const interval = setInterval(fetchUnreadCount, 300000); // 5分ごと

    return () => clearInterval(interval);
  }, [user]); // user依存関係を追加

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
  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <Head title='投稿一覧' />
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
      {/* 通知アイコンを追加 */}
      <div className='relative ml-auto mr-5 mt-4'>
        <button
          aria-label='通知'
          title='通知'
          onClick={() => setNotificationModalOpen(true)}
          className='flex items-center text-gray-500 hover:text-gray-700 focus:outline-none transition duration-150 ease-in-out'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-8 w-8 lg:h-12 lg:w-12'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
            />
          </svg>
          {unreadCount > 0 && (
            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs lg:text-base rounded-full h-5 w-5 lg:h-6 lg:w-6 flex items-center justify-center'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      <div className='flex gap-6 justify-center lg:text-xl'>
        <Link
          href={route('posts.index')}
          className={
            filter === 'following' ? 'text-gray-600' : 'font-semibold underline'
          }
        >
          すべて
        </Link>
        {user ? (
          <Link
            href={route('posts.index', { filter: 'following' })}
            className={
              filter === 'following'
                ? 'font-semibold underline'
                : 'text-gray-600'
            }
          >
            フォロー中
          </Link>
        ) : (
          <button
            type='button'
            onClick={() => setToLoginModalOpen(true)}
            className='text-gray-600'
          >
            フォロー中
          </button>
        )}
      </div>

      <div className='w-full overflow-hidden mt-2 bg-white'>
        <div className='max-w-xl mx-auto p-4 pb-24'>
          {items.map(post => (
            <div
              key={post.id}
              className='bg-white rounded-xl shadow-md mb-8 overflow-hidden border'
            >
              <div className='flex items-center px-4 py-3'>
                <Link
                  href={
                    currentUserId === post.user.id
                      ? route('profile.show')
                      : route('users.profile', post.user.displayid)
                  }
                >
                  <img
                    src={
                      post.user.profile_image_url ||
                      '/images/defalt_profile.jpg'
                    }
                    alt='avatar'
                    className='w-5 h-5 lg:w-8 lg:h-8 rounded-full object-cover'
                  />
                </Link>
                <div className='ml-1'>
                  <Link
                    href={
                      currentUserId === post.user.id
                        ? route('profile.show')
                        : route('users.profile', post.user.displayid)
                    }
                    className='font-semibold text-sm lg:text-lg'
                  >
                    @{post.user.displayid}
                  </Link>
                </div>
                <div className='text-sm lg:text-lg font-bold ml-auto flex flex-row items-center'>
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

                <div className='px-4 py-3'>
                  <h2 className='text-xl font-bold text-gray-700'>
                    {post.title}
                  </h2>
                  <p className='text-sm text-gray-700 line-clamp-2'>
                    {post.subtitle || post.excerpt || ''}
                  </p>
                  <div className='text-xs text-gray-500 mt-2'>
                    {formatDate(post.created_at)}
                  </div>
                </div>
              </Link>
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
      {/* 通知モーダル */}
      <NotificationsModal
        isOpen={notificationModalOpen}
        closeModal={() => setNotificationModalOpen(false)}
      />
      {/* 未ログイン時に投稿クリックで表示するモーダル */}
      <ToLoginModal
        show={toLoginModalOpen}
        closeModal={() => setToLoginModalOpen(false)}
      />
    </div>
  );
}
