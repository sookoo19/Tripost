import { Head, Link, usePage, router } from '@inertiajs/react';
import BottomNav from '@/Components/BottomNav';
import { useEffect } from 'react';
import axios from 'axios';

export default function Unpublic({ posts }) {
  const page = usePage();
  const currentUserId = page.props?.auth?.user?.id;

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
          <img
            src='/images/header.svg'
            alt='header'
            className='w-full h-auto block object-cover'
          />
        </Link>
      </div>
      <h2 className='mt-5 text-xl font-semibold leading-tight text-gray-800 text-center'>
        非公開タビ一覧
      </h2>
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
                      : route('users.profile', post.user.id)
                  }
                >
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
                    href={
                      currentUserId === post.user.id
                        ? route('profile.show')
                        : route('users.profile', post.user.id)
                    }
                    className='font-semibold text-sm'
                  >
                    @{post.user.displayid}
                  </Link>
                </div>
                <div className='text-sm font-bold ml-auto flex flex-row items-center'>
                  <button
                    type='button'
                    onClick={() => {
                      // 公開確認ダイアログ
                      if (!window.confirm('この投稿を公開しますか？')) {
                        return;
                      }
                      // post を直接変更せず、サーバへ PATCH を送る
                      axios
                        .patch(route('posts.share_scope', post.id), {
                          share_scope: '公開',
                        })
                        .then(() => {
                          // 必要なら Inertia で再取得
                          router.reload();
                        })
                        .catch(err => {
                          console.error(err);
                        });
                    }}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width={24}
                      height={24}
                      viewBox='0 0 24 24'
                      className='ml-auto mr-1'
                    >
                      <path
                        fill='#4c5a70ff'
                        d='m20.475 23.3l-2.95-2.95q-1.2.8-2.587 1.225T12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12q0-1.55.425-2.937T3.65 6.475L.675 3.5L2.1 2.075l19.8 19.8zM11 19.95V18q-.825 0-1.412-.587T9 16v-1l-4.8-4.8q-.075.45-.137.9T4 12q0 3.025 1.988 5.3T11 19.95m9.35-2.475l-1.45-1.45q.525-.925.813-1.937T20 12q0-2.45-1.362-4.475T15 4.6V5q0 .825-.587 1.413T13 7h-2v1.125L6.525 3.65q1.2-.775 2.575-1.212T12 2q2.075 0 3.9.788t3.175 2.137T21.213 8.1T22 12q0 1.525-.437 2.9t-1.213 2.575'
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
      <BottomNav />
    </div>
  );
}
