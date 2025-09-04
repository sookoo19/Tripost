import { Head, Link } from '@inertiajs/react';
import GoogleMapComponent from '@/Components/GoogleMap';
import { useMemo } from 'react';

export default function Show({ post }) {
  // trip_plan がオブジェクト（{1: [...], 2: [...]}) か配列かを吸収して扱う
  const tripPlanObject = useMemo(() => {
    return post?.trip_plan && typeof post.trip_plan === 'object'
      ? post.trip_plan
      : {};
  }, [post?.trip_plan]);
  // マーカー配列を作成: [{ lat, lng, day, label }]
  const markerPositions = useMemo(() => {
    const out = [];
    try {
      Object.keys(tripPlanObject).forEach(dayKey => {
        const plans = Array.isArray(tripPlanObject[dayKey])
          ? tripPlanObject[dayKey]
          : [];
        plans.forEach(p => {
          const [time, place, lat, lng] = p;
          if (lat && lng) {
            out.push({
              lat: Number(lat),
              lng: Number(lng),
              day: Number(dayKey),
              label: place || time || '',
            });
          }
        });
      });
    } catch (err) {
      // ignore
    }
    return out;
  }, [tripPlanObject]);

  // yyyy-mm -> yyyy年mm月 に整形
  const formatPeriod = period => {
    if (!period) return '';
    const m = String(period).match(/^(\d{4})-(\d{2})$/);
    return m ? `${m[1]}年${m[2]}月` : period;
  };

  return (
    <div className='flex min-h-screen flex-col items-center bg-whit'>
      <Head title={post.title} />

      <div className='w-full overflow-hidden bg-white px-3 pt-6'>
        <Link href=''>
          <button
            className='shadow-md inline-flex items-center rounded-xl border border-transparent bg-white px-3 text-[10px] font-semibold uppercase tracking-widest text-black transition duration-150 ease-in-out hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
            disabled={false}
          >
            戻る
          </button>
        </Link>
      </div>
      <div className='w-full overflow-hidden bg-white px-6 pb-4'>
        <div className='mt-4 flex items-center'>
          <div className='flex items-center'>
            <Link href={route('users.profile', post.user.id)}>
              <img
                src={
                  post?.user?.profile_image_url ||
                  (post?.user?.profile_image
                    ? `/storage/${post.user.profile_image}`
                    : '/images/default-avatar.png')
                }
                alt='avatar'
                className='w-6 h-6 rounded-full object-cover'
              />
            </Link>
            <div className='flex flex-row'>
              <Link href={route('users.profile', post.user.id)}>
                <div className='ml-1 font-semibold text-sm'>
                  @{post.user.displayid}
                </div>
              </Link>
              <div className='ml-1 mt-1 text-xs text-gray-500'>フォロー中</div>
            </div>
          </div>
        </div>

        {/* タイトル・メタ */}
        <h1 className='text-2xl font-bold mt-2'>{post.title}</h1>
        <h2 className='text-normal font-bold mt-1'>{post?.subtitle || ''}</h2>
        <div className='text-sm text-gray-500 mt-1'>
          {post?.country.name} / {post?.region || ''} /{' '}
          {formatPeriod(post?.period)} / {post.days}日間 /{' '}
          {post?.style?.name || ''} / {post?.purpose?.name || ''} /{' '}
          {post?.budget.label || ''}
        </div>

        {/* 本文（長文） */}
        {post?.description && (
          <div className='mt-4 whitespace-pre-wrap'>{post.description}</div>
        )}

        {/* 旅程 */}
        <div className='mt-6'>
          <div className='font-semibold text-lg'>▽旅程</div>
          {Object.keys(tripPlanObject).length === 0 && (
            <div className='text-sm text-gray-500 mt-2'>旅程はありません</div>
          )}

          {Object.keys(tripPlanObject).map(dayKey => {
            const plans = Array.isArray(tripPlanObject[dayKey])
              ? tripPlanObject[dayKey]
              : [];
            // 時刻でソート（空時刻は最後）
            const sorted = [...plans].sort((a, b) => {
              if (!a[0]) return 1;
              if (!b[0]) return -1;
              return a[0].localeCompare(b[0]);
            });

            return (
              <div key={dayKey} className='mt-3'>
                <div className='font-bold'>〜 {dayKey}日目〜</div>
                <div className='mt-2 space-y-2'>
                  {sorted.map((p, idx) => {
                    const [time, place] = p;
                    return (
                      <div key={idx} className='flex items-start gap-4'>
                        <div className='w-16 text-sm font-medium'>
                          {time || ''}
                        </div>
                        <div className='flex-1 text-sm'>{place || ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* マップ */}
        <div className='mt-6'>
          <div className='font-semibold text-lg'>▽マップ</div>
          <div className='mt-3'>
            <div>
              <GoogleMapComponent
                searchPlace=''
                searchTrigger={0}
                markerPositions={markerPositions}
                selectedPosition={null}
              />
            </div>
          </div>
        </div>

        {/* フッターの余白 */}
        <div className='h-24' />
      </div>
    </div>
  );
}
