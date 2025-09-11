import GoogleMapComponent from '@/Components/GoogleMap';
import { Head, Link, usePage } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import { useMemo, useState } from 'react';
import Select from 'react-select';

export default function Map({ posts = [] }) {
  //usePage「現在のページ情報」を取得
  const auth = usePage().props?.auth ?? null;
  const user = auth?.user ?? null;

  // trip_plan を持つ投稿のみ抽出
  const postsWithTrips = useMemo(() => {
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

  // React Select用のstyleデータ整形（useMemoでメモ化）
  const postOptions = useMemo(() => {
    return postsWithTrips.map(postsWithTrip => ({
      ...postsWithTrip,
      value: postsWithTrip.id,
      label: postsWithTrip.title,
    }));
  }, [postsWithTrips]);

  // 初期選択は trip_plan を持つ最初の投稿
  const [selectedPostId, setSelectedPostId] = useState(
    postOptions.length ? postOptions[0].value : ''
  );

  // 選択中の投稿オブジェクト（trip_plan を持つ配列内から探す）
  const selectedPost = useMemo(() => {
    if (!postOptions || !selectedPostId) return null;
    return (
      postOptions.find(p => String(p.id) === String(selectedPostId)) || null
    );
  }, [postOptions, selectedPostId]);

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
            className='w-full h-auto block object-cover relative'
          />
        </Link>
      </div>
      {/* ポスト選択 UI */}
      <div className='w-full max-w-xl mx-auto px-4 py-3'>
        {postOptions && postOptions.length > 0 ? (
          <div className='flex items-center justify-center'>
            <InputLabel className='font-bold' value='マップ一覧' />
            <Select
              options={postOptions}
              className='ml-2 w-3/5 h-auto text-sm'
              classNamePrefix='react-select'
              // value は option オブジェクトを渡す
              value={
                postOptions.find(
                  opt => String(opt.value) === String(selectedPostId)
                ) || null
              }
              // onChange には選択された option が渡される（null の可能性あり）
              onChange={option => setSelectedPostId(option?.value ?? '')}
              placeholder='タビを選択'
              maxMenuHeight={200}
              isSearchable={false}
              isClearable={true}
            />
          </div>
        ) : (
          <div className='text-sm text-gray-600'>
            表示可能なタビがありません
            {!user && (
              <Link href={route('login')} className='text-xs px-2 underline'>
                ログイン
              </Link>
            )}
          </div>
        )}
      </div>
      {/* 地図コンポーネント */}
      <GoogleMapComponent
        searchPlace=''
        searchTrigger={0}
        selectedPosition={null}
        mapContainerStyle={{ height: '85vh', width: '100%' }}
        className='mt-0 bt-0 relative'
        markerPositions={markerPositions}
      />
    </div>
  );
}
