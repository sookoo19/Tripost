import { Head, Link, usePage } from '@inertiajs/react';

export default function Following({ user, following_index }) {
  const page = usePage();
  const currentUserId = page.props?.auth?.user?.id;
  const list = following_index ?? [];

  return (
    <>
      <Head title='フォロー一覧' />
      <div className='max-w-3xl w-full mx-auto p-4'>
        {/* 固定表示の戻るボタン（他要素に影響を与えない） */}
        <Link
          href={
            currentUserId === user.id
              ? route('profile.show')
              : route('users.profile', user.id)
          }
          aria-label='戻る'
          className='fixed top-6 left-4 z-50 w-10 h-10 md:w-12 md:h-12 text-3xl text-gray-600 hover:text-gray-800 flex items-center justify-center'
        >
          &lt;
        </Link>
        <div className='flex items-center justify-center mb-4'>
          <div className='ml-3 mt-4'>
            <div className='font-bold text-xl text-gray-900 text-center'>
              @{user.displayid}
            </div>
            <div className='font-bold text-sm mt-3'>
              <Link
                href={route('follower.index', { user: user.id })}
                className='inline-block'
              >
                <span className='text-gray-500'>
                  {user.followers_count ?? 0} フォロワー
                </span>
              </Link>
              <div className='inline-block ml-6 text-gray-900 underline underline-offset-8 decoration-gray-900'>
                {user.following_count ?? 0} フォロー中
              </div>
            </div>
          </div>
        </div>

        <div>
          {list.length === 0 ? (
            <div className='text-sm text-gray-500'>
              フォロー中のユーザーはいません
            </div>
          ) : (
            <ul className='space-y-2 max-h-[80vh] overflow-y-auto'>
              {list.map(u => (
                <li
                  key={u.id}
                  className='flex items-center bg-white border rounded p-3'
                >
                  <Link
                    href={
                      currentUserId === u.id
                        ? route('profile.show')
                        : route('users.profile', u.id)
                    }
                  >
                    <img
                      src={u.profile_image_url || '/images/default-avatar.png'}
                      alt={u.displayid}
                      className='w-10 h-10 rounded-full object-cover'
                    />
                  </Link>
                  <div className='ml-3'>
                    <Link
                      href={
                        currentUserId === u.id
                          ? route('profile.show')
                          : route('users.profile', u.id)
                      }
                      className='font-semibold'
                    >
                      @{u.displayid}
                    </Link>
                    <div className='text-xs text-gray-600'>{u.name}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
