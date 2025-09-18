import { useCallback } from 'react';

export default function PostActions({ liked, likesCount, toggleLike }) {
  const handleShareClick = useCallback(() => {
    const url = window.location.origin + window.location.pathname;

    void (async () => {
      if (navigator.share) {
        // Web share API
        try {
          await navigator.share({
            url,
          });
        } catch (error) {
          console.error('共有に失敗しました:', error);
        }
      } else {
        // Web Share APIが使えないブラウザの処理
        try {
          await navigator.clipboard.writeText(url);
          alert('URLをコピーしました');
        } catch (error) {
          console.error('URLのコピーに失敗しました:', error);
        }
      }
    })();
  }, []);

  return (
    <div className='flex flex-row mt-1'>
      <div className='flex flex-row items-center space-x-0'>
        <button
          type='button'
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleLike(e);
          }}
        >
          {!liked && (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width={40}
              height={40}
              viewBox='0 0 24 24'
            >
              <path
                fill='#374151'
                d='M4.24 12.25a4.2 4.2 0 0 1-1.24-3A4.25 4.25 0 0 1 7.25 5c1.58 0 2.96.86 3.69 2.14h1.12A4.24 4.24 0 0 1 15.75 5A4.25 4.25 0 0 1 20 9.25c0 1.17-.5 2.25-1.24 3L11.5 19.5zm15.22.71C20.41 12 21 10.7 21 9.25A5.25 5.25 0 0 0 15.75 4c-1.75 0-3.3.85-4.25 2.17A5.22 5.22 0 0 0 7.25 4A5.25 5.25 0 0 0 2 9.25c0 1.45.59 2.75 1.54 3.71l7.96 7.96z'
              ></path>
            </svg>
          )}
          {liked && (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width={36}
              height={36}
              viewBox='0 0 24 24'
            >
              <path
                fill='#fcf16eff'
                d='m12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53z'
              ></path>
            </svg>
          )}
        </button>
        <div className='font-bold text-sm text-gray-600 text-center'>
          {likesCount}
        </div>
      </div>
      <div className='mt-2 ml-1'>
        <button type='button' onClick={handleShareClick}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width={40}
            height={40}
            viewBox='0 0 24 24'
          >
            <path
              fill='none'
              stroke='#374151'
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M20.5 3.5L3.5 9l6.5 3l7-5l-5 7l3 6.5z'
              strokeWidth={1}
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
