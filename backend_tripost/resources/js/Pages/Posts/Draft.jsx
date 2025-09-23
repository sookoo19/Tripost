import { Head, Link, router } from '@inertiajs/react';
import BottomNav from '@/Components/BottomNav';
import { useEffect } from 'react';
import axios from 'axios';

export default function Draft({ posts }) {
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('tripost_reload_on_back') === '1') {
      sessionStorage.removeItem('tripost_reload_on_back');
      // Inertia 経由でサーバから再取得
      router.reload();
    }
  }, []);

  const statusClass = st => {
    const s = String(st ?? '').trim();
    // デバッグ用ログ（開発時のみ）

    if (s === '準備中') return 'bg-gray-100 text-gray-700';
    return 'bg-white text-gray-700 font-bold';
  };

  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <Head title='下書き一覧' />
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
        下書き一覧
      </h2>
      <div className='w-full overflow-hidden bg-white'>
        <div className='max-w-xl mx-auto p-4 pb-24'>
          {items.map(post => (
            <div key={post.id} className='bg-white overflow-hidden border mb-2'>
              <div className='flex flex-row'>
                <div
                  className={`inline-block ml-1 mt-1 px-3 py-1 text-xs rounded-2xl border ${statusClass(post.post_status)}`}
                >
                  {post.post_status}
                </div>
                <button
                  type='button'
                  onClick={() => {
                    // 公開確認ダイアログ
                    if (!window.confirm('この下書きを本当に消去しますか？')) {
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
                  className='ml-auto mr-2 text-gray-500 text-sm hover:text-red-500 transition-colors duration-150 self-end'
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
              <Link href={route('posts.edit', post)}>
                <div className='px-4 py-2'>
                  <h2 className='text-xl font-bold text-gray-700'>
                    {post.title}
                  </h2>
                  <p className='text-sm text-gray-700 line-clamp-2'>
                    {post.subtitle || ''}
                  </p>
                  <div className='text-xs text-gray-500'>
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
    </div>
  );
}
