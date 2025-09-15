import { Head, Link, usePage } from '@inertiajs/react';

export default function Following({ user, follower_index }) {
  const page = usePage();
  const currentUserId = page.props?.auth?.user?.id;
  const list = follower_index ?? [];

  return (
    <>
      <Head title='フォロー一覧' />
      <div className='max-w-3xl w-full mx-auto p-4'>
        <div className='flex items-center mb-4'>
          <img
            src={
              user.profile_image
                ? user.profile_image
                : '/images/default-avatar.png'
            }
            alt='avatar'
            className='w-12 h-12 rounded-full object-cover'
          />
          <div className='ml-3'>
            <div className='font-bold'>{user.name}</div>
            <div className='text-sm text-gray-500'>@{user.displayid}</div>
            <div className='text-xs text-gray-600 mt-1'>
              フォロー {user.following_count ?? 0} · フォロワー{' '}
              {user.followers_count ?? 0}
            </div>
          </div>
        </div>

        <div>
          {list.length === 0 ? (
            <div className='text-sm text-gray-500'>
              あなたをフォローしているユーザーはいません
            </div>
          ) : (
            <ul className='space-y-3'>
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
                    <div className='text-sm text-gray-600'>{u.name}</div>
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
