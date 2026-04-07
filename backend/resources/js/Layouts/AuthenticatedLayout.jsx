import { Link } from '@inertiajs/react';

export default function AuthenticatedLayout({ header, children }) {
  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <div className='w-full'>
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
      <div>
        <div className='w-full pb-2 mt-6'>{header}</div>
      </div>
      <div className='mt-3 w-full overflow-hidden bg-white px-6 py-4 border-t border-gray-200'>
        {children}
      </div>
    </div>
  );
}
