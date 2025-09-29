import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';

export default function ToLoginModal({
  show = false,
  maxWidth = '2xl',
  closeModal = true,
}) {
  const maxWidthClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
  }[maxWidth];

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-10' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel
                className={`w-full max-w-${maxWidth} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all sm:mx-auto sm:w-full ${maxWidthClass}`}
              >
                {/* loginPrompt 用の固定内容（children の分岐は不要のため削除） */}
                <div>
                  <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-bold'>ログインしてください</h3>
                    <button
                      type='button'
                      className='pb-1 rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none'
                      onClick={closeModal}
                    >
                      <span className='sr-only'>閉じる</span>
                      <svg
                        className='h-6 w-6'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  </div>

                  <p className='text-sm text-gray-600 mb-4'>
                    タビの閲覧や作成にはログインが必要です。
                  </p>

                  <div className='flex justify-center space-x-3'>
                    <Link
                      href={route('login')}
                      className='mr-4 px-4 py-2 bg-blue-600 text-white rounded'
                    >
                      ログイン
                    </Link>
                    <Link
                      href={route('register')}
                      className='px-4 py-2 border border-gray-300 rounded'
                    >
                      新規登録
                    </Link>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
