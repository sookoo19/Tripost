import GoogleMapComponent from '@/Components/GoogleMap';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Map({ posts }) {
  // trip_plan を持つ投稿のみ抽出
  const postsWithTrip = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    return posts.filter(p => {
      if (!p || p.trip_plan == null) return false;
      // 配列またはオブジェクトどちらも対応（中身が空でなければ true）
      if (Array.isArray(p.trip_plan)) return p.trip_plan.length > 0;
      if (typeof p.trip_plan === 'object')
        return Object.keys(p.trip_plan).length > 0;
      return false;
    });
  }, [posts]);

  // 初期選択は trip_plan を持つ最初の投稿
  const [selectedPostId, setSelectedPostId] = useState(
    postsWithTrip.length ? postsWithTrip[0].id : ''
  );

  // 選択中の投稿オブジェクト（trip_plan を持つ配列内から探す）
  const selectedPost = useMemo(() => {
    if (!postsWithTrip || !selectedPostId) return null;
    return (
      postsWithTrip.find(p => String(p.id) === String(selectedPostId)) || null
    );
  }, [postsWithTrip, selectedPostId]);

  // 選択投稿の trip_plan を正規化
  const tripPlanObject = useMemo(() => {
    return selectedPost?.trip_plan && typeof selectedPost.trip_plan === 'object'
      ? selectedPost.trip_plan
      : {};
  }, [selectedPost?.trip_plan]);

  // 選択投稿からマーカー配列を作る
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
              post_id: selectedPost?.id || null,
            });
          }
        });
      });
    } catch (err) {
      // ignore
    }
    return out;
  }, [tripPlanObject, selectedPost]);

  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <Head title='タビマップ' />
      <div className='w-full'>
        {/*ヘッダー*/}
        <Link href={route('posts.index')}>
          <img
            src='/images/header.svg'
            alt='header'
            className='w-full h-auto block object-cover -mb-6 relative z-[1001]'
          />
        </Link>
      </div>
      {/* ポスト選択 UI */}
      <div className='w-full max-w-xl mx-auto px-4 py-3'>
        {postsWithTrip && postsWithTrip.length > 0 ? (
          <div className='flex items-center space-x-3'>
            <label className='text-sm font-medium'>一覧 :</label>
            <select
              value={selectedPostId}
              onChange={e => setSelectedPostId(e.target.value)}
              className='ml-2 rounded border px-2 py-1 text-sm'
            >
              <option value=''>-- 表示したいマップを選択 --</option>
              {postsWithTrip.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title || `投稿 #${p.id}`}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className='text-sm text-gray-600'>
            表示可能な投稿がありません（trip_plan が空です）
          </div>
        )}
      </div>
      {/* 地図コンポーネント */}
      <GoogleMapComponent
        searchPlace=''
        searchTrigger={0}
        selectedPosition={null}
        mapContainerStyle={{ height: '85vh', width: '100%' }}
        className='mt-0 bt-0 relative z-[1000]'
        markerPositions={markerPositions}
      />
    </div>
  );
}
