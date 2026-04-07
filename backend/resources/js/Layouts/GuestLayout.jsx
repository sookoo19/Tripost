import { Link } from '@inertiajs/react';

export default function GuestLayout({ children, title }) {
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

      <div className='w-[90%]'>
        <h1 className='text-3xl font-black text-left mt-6 lg:text-center lg:mb-4 lg:text-4xl'>
          {title}
        </h1>
      </div>

      <div className='mt-6 w-[90%] border-[0.5px] border-gray-200 overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-lg sm:rounded-lg'>
        {children}
      </div>
    </div>
  );
}
