export default function PhotoCarousel({
  photos,
  currentPhotoIndex,
  setCurrentPhotoIndex,
  post,
}) {
  const hasPhotos = photos.length > 0;

  // 写真切り替え
  const nextPhoto = () => {
    setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  if (!hasPhotos) return null;

  return (
    <div className='mt-2 relative w-full aspect-square bg-gray-100 overflow-hidden group'>
      {/* 写真表示 */}
      <div
        className='flex transition-transform duration-500 ease-in-out h-full'
        style={{
          transform: `translateX(-${currentPhotoIndex * 100}%)`,
        }}
      >
        {photos.map((photo, index) => (
          <div key={index} className='flex-shrink-0 w-full h-full'>
            <img
              src={
                post.photos_urls && post.photos_urls[index]
                  ? post.photos_urls[index]
                  : `/storage/${photo}`
              }
              alt={`photo-${index}`}
              className='w-full h-full object-cover'
            />
          </div>
        ))}
      </div>

      {/* 左矢印（ホバー時のみ表示） */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prevPhoto}
            className='absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-70'
            aria-label='前の写真'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>

          {/* 右矢印（ホバー時のみ表示）*/}
          <button
            onClick={nextPhoto}
            className='absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-70'
            aria-label='次の写真'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </button>
        </>
      )}

      {/* インジケーター（ドット表示） */}
      {photos.length > 1 && (
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2'>
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPhotoIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === currentPhotoIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50'
              }`}
              aria-label={`写真 ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
