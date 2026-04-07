import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import axios from 'axios';

export default function NotificationsModal({ isOpen, closeModal }) {
  const [notifications, setNotifications] = useState({ data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // モーダルが開かれたら通知を取得
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      // 既存のエンドポイントを使用する
      const response = await axios.get(route('notifications.index'));
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('通知の取得に失敗しました', error);
      setError(
        '通知の読み込み中にエラーが発生しました（ログインしてください）'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
              <Dialog.Panel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
                <Dialog.Title
                  as='h3'
                  className='text-lg font-bold leading-6 text-gray-900 flex justify-between items-center'
                >
                  <span>通知</span>
                  <button
                    type='button'
                    className='rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none'
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
                </Dialog.Title>

                <div className='mt-4 max-h-96 overflow-y-auto'>
                  {loading ? (
                    <div className='py-8 text-center'>
                      <svg
                        className='animate-spin h-8 w-8 text-blue-500 mx-auto'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                    </div>
                  ) : notifications.data.length > 0 ? (
                    <div className='space-y-3'>
                      {notifications.data.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-3 border rounded-lg ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                        >
                          <div className='flex items-start'>
                            {notification.actor && (
                              <Link
                                href={route(
                                  'users.profile',
                                  notification.actor.displayid
                                )}
                                className='flex-shrink-0' // 追加：画像が縮まないようにする
                              >
                                <img
                                  src={
                                    notification.actor.profile_image_url ||
                                    '/images/defalt_profile.jpg'
                                  }
                                  alt={notification.actor.name}
                                  className='w-8 h-8 rounded-full mr-3 mt-1 object-cover' // object-coverを追加
                                />
                              </Link>
                            )}

                            {notification.type === 'like' &&
                              notification.notifiable_id && (
                                <Link
                                  href={route(
                                    'posts.show',
                                    notification.notifiable_id
                                  )}
                                  onClick={closeModal}
                                  className='flex-1 min-w-0' // min-w-0を追加してテキストオーバーフローを防ぐ
                                >
                                  <div>
                                    <p className='text-sm'>
                                      {notification.message}
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1'>
                                      {notification.date}
                                    </p>
                                  </div>
                                </Link>
                              )}

                            {notification.type === 'follow' &&
                              notification.actor && (
                                <Link
                                  href={route(
                                    'users.profile',
                                    notification.actor.displayid
                                  )}
                                  onClick={closeModal}
                                  className='flex-1 min-w-0' // min-w-0を追加
                                >
                                  <div className='p-1'>
                                    <p className='text-sm'>
                                      {notification.message}
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1'>
                                      {notification.date}
                                    </p>
                                  </div>
                                </Link>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-center py-6 text-gray-500'>
                      通知はありません
                    </p>
                  )}
                </div>

                {/* エラー表示を追加 */}
                {error && (
                  <div className='text-red-500 text-center py-4'>{error}</div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
