import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ posts }) {
  // Inertia の paginator に合わせて安全に取得
  const items = posts?.data ?? posts ?? [];

  const firstPhotoUrl = post => {
    if (post.photos_urls && post.photos_urls[0]) return post.photos_urls[0];
    if (post.photos && post.photos[0]) return `/storage/${post.photos[0]}`;
    return;
  };

  return (
    <AuthenticatedLayout>
      <Head title='投稿一覧' />

      <div className='max-w-xl mx-auto p-4 pb-24'>
        {items.map(post => (
          <div
            key={post.id}
            className='bg-white rounded-xl shadow-md mb-6 overflow-hidden'
          >
            <div className='flex items-center px-4 py-3'>
              <Link href={route('users.profile', post.user.id)}>
                <img
                  src={
                    post.user.profile_image_url || '/images/default-avatar.png'
                  }
                  alt='avatar'
                  className='w-8 h-8 rounded-full object-cover'
                />
              </Link>
              <div className='ml-3'>
                <Link
                  href={route('users.profile', post.user.id)}
                  className='font-semibold text-sm'
                >
                  @{post.user.displayid}
                </Link>
              </div>
            </div>

            <Link href={route('posts.show', post.id)}>
              <div className='relative w-full aspect-video bg-gray-100'>
                <img
                  src={firstPhotoUrl(post)}
                  alt={post.title || 'photo'}
                  className='w-full h-full object-cover'
                  loading='lazy'
                />
                <div className='absolute inset-0 flex items-center justify-center px-4'>
                  <h2 className='text-2xl md:text-3xl font-bold text-white text-center drop-shadow'>
                    {post.title}
                  </h2>
                </div>
              </div>
            </Link>

            <div className='px-4 py-3'>
              <p className='text-sm text-gray-700 line-clamp-3'>
                {post.subtitle || post.excerpt || ''}
              </p>
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
    </AuthenticatedLayout>
  );
}
