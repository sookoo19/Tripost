import { Head, Link } from '@inertiajs/react';

export default function SearchIndex({
  posts,
  filters,
  countries,
  styles,
  purposes,
  budgets,
}) {
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

  // id -> name 変換ヘルパ,list は「id と名前を持つオブジェクトの配列,コントローラから渡した countries, styles, purposes, budgets のいずれか
  const findName = (list, id) => {
    if (!id) return null;
    const it = list.find(x => String(x.id) === String(id));
    return it ? it.name || it.label : null;
  };

  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <Head title='投稿検索結果' />
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
      <div className='w-full overflow-hidden bg-white pl-4'>
        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = route ? route('posts.index') : '/posts';
            }
          }}
          className='shadow-md inline-flex items-center rounded-xl border border-transparent bg-white px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-800 transition duration-150 ease-in-out hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
          type='button'
        >
          戻る
        </button>
      </div>

      <h2 className='text-2xl font-semibold leading-tight text-gray-800 text-center'>
        タビ検索結果
      </h2>
      <div className='w-full overflow-hidden bg-white'>
        <div className='max-w-xl mx-auto p-4 pb-24'>
          {/* --- 絞り込み条件表示 --- */}
          <div className='max-w-xl mx-auto p-4 w-full'>
            <div className='text-sm text-gray-600 mb-3'>
              <strong>絞り込み条件：</strong>
              <span className='ml-2'>
                {filters.country_id
                  ? ` ${findName(countries, filters.country_id)} / `
                  : ''}
                {filters.period_from || filters.period_to
                  ? ` ${filters.period_from || ''}〜${filters.period_to || ''} / `
                  : ''}
                {filters.days ? ` ${filters.days}日間 / ` : ''}
                {filters.style_id
                  ? ` ${findName(styles, filters.style_id)} / `
                  : ''}
                {filters.purpose_id
                  ? ` ${findName(purposes, filters.purpose_id)} / `
                  : ''}
                {filters.budget_min || filters.budget_max
                  ? ` ${filters.budget_min || ''}〜${filters.budget_max || ''}円 / `
                  : ''}
                {filters.keyword ? `ワード: "${filters.keyword}"` : ''}
                {!filters.keyword &&
                !filters.country_id &&
                !filters.period_from &&
                !filters.period_to &&
                !filters.days &&
                !filters.style_id &&
                !filters.purpose_id &&
                !filters.budget_min &&
                !filters.budget_max
                  ? ' 指定なし'
                  : ''}
              </span>
            </div>
          </div>

          {items.map(post => (
            <div
              key={post.id}
              className='bg-white rounded-xl shadow-md mb-8 overflow-hidden border'
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
    </div>
  );
}
