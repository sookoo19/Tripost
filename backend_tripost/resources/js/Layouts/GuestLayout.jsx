import { Link } from '@inertiajs/react';

export default function GuestLayout({ children, title }) {
  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <div className='w-full'>
        <Link href='/'>
          <img
            src='/images/header.svg'
            alt='header'
            className='w-full h-auto block object-cover'
          />
        </Link>
      </div>

      <div className='w-[90%]'>
        <h1 className='text-3xl font-black text-left mt-2'>{title}</h1>
      </div>

      <div className='mt-6 w-[90%] overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-lg sm:rounded-lg'>
        {children}
      </div>
    </div>
  );
}
