import { Head, Link, usePage, router } from '@inertiajs/react';
import GoogleMapComponent from '@/Components/GoogleMap';
import TripDayRoutes from '@/Components/TripDayRoutes';
import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';

export default function Show({ post, user }) {
  const page = usePage();
  const currentUserId = page.props?.auth?.user?.id;
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  // 追加: ルート計算用の state
  const [directionsResult, setDirectionsResult] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [followStatus, setFollowStatus] = useState(user.is_followed || false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [likesCount, setLikesCount] = useState(
    post.likes_count ?? post.likes?.length ?? 0
  );
  const [liked, setLiked] = useState(
    post?.is_liked ?? (post?.isLikedBy?.includes(currentUserId) || false)
  );
  const [loadingLike, setLoadingLike] = useState(false);

  const handleAddFollow = async e => {
    e.preventDefault();
    if (loadingFollow) return;
    setLoadingFollow(true);

    // Inertia.jsのrouterを使用（CSRFトークン不要）
    router.post(
      route('following'),
      { user_id: user.id },
      {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => setLoadingFollow(false),
        onSuccess: () => setFollowStatus(true),
        onError: errors => {
          console.error('フォローに失敗しました', errors);
          setFollowStatus(false);
        },
      }
    );
  };

  // yyyy-mm -> yyyy年mm月 に整形
  const formatPeriod = period => {
    if (!period) return '';
    const m = String(period).match(/^(\d{4})-(\d{2})$/);
    return m ? `${m[1]}年${m[2]}月` : period;
  };
  // メタ情報を存在する要素だけ繋いで表示（スラッシュは自動で入る）
  const metaParts = useMemo(() => {
    const parts = [];
    if (post?.country?.name) parts.push(post.country.name);
    if (post?.region) parts.push(post.region);
    const periodText = formatPeriod(post?.period);
    if (periodText) parts.push(periodText);
    if (post?.days) parts.push(`${post.days}日間`);
    if (post?.style?.name) parts.push(post.style.name);
    if (post?.purpose?.name) parts.push(post.purpose.name);
    if (post?.budget?.label) parts.push(post.budget.label);
    return parts.join(' / ');
  }, [post]);

  // trip_plan がオブジェクト（{1: [...], 2: [...]}) か配列かを吸収して扱う
  const tripPlanObject = useMemo(() => {
    return post?.trip_plan && typeof post.trip_plan === 'object'
      ? post.trip_plan
      : {};
  }, [post?.trip_plan]);

  // マーカー配列を作成: [{ lat, lng, day, label }]（既存）
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

  // --- 追加: sortedTripLocations（time/place を含む場所リスト） ---
  const sortedTripLocations = useMemo(() => {
    const locations = [];
    try {
      Object.keys(tripPlanObject).forEach(dayKey => {
        const plans = Array.isArray(tripPlanObject[dayKey])
          ? tripPlanObject[dayKey]
          : [];
        plans.forEach(p => {
          const [time, place, lat, lng] = p;
          if (lat && lng) {
            locations.push({
              lat: Number(lat),
              lng: Number(lng),
              day: Number(dayKey),
              time: time || '',
              place: place || '',
            });
          }
        });
      });

      // 日付と時間でソート
      locations.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return (a.time || '').localeCompare(b.time || '');
      });
    } catch (err) {
      // ignore
    }
    return locations;
  }, [tripPlanObject]);

  // --- 追加: 日リスト（TripDayRoutes 用） ---
  const tripDays = useMemo(() => {
    if (!sortedTripLocations.length) return [];
    return [...new Set(sortedTripLocations.map(loc => loc.day))].sort(
      (a, b) => a - b
    );
  }, [sortedTripLocations]);

  // 写真配列を取得
  const photos = post?.photos || [];
  const hasPhotos = photos.length > 0;

  // 写真切り替え
  const nextPhoto = () => {
    setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  // Show側で徒歩ルートを計算し、正確な道路距離を routeInfo にセットする
  useEffect(() => {
    let mounted = true;

    const waitForGoogle = async (timeout = 8000) => {
      const start = Date.now();
      while (
        !(
          typeof window !== 'undefined' &&
          ((window.google && window.google.maps) ||
            window.__GOOGLE_MAPS_LOADED__)
        )
      ) {
        if (!mounted) return false;
        if (Date.now() - start > timeout) return false;
        // 100ms 毎に確認
        await new Promise(r => setTimeout(r, 100));
      }
      return !!(window.google && window.google.maps);
    };

    (async () => {
      if (!sortedTripLocations || sortedTripLocations.length < 2) {
        if (mounted) {
          setDirectionsResult(null);
          setRouteInfo(null);
        }
        return;
      }

      const ok = await waitForGoogle(8000);
      if (!ok) {
        // Google Maps が利用できない場合は routeInfo をクリアして終了
        console.warn(
          'Google Maps が読み込まれていないためルート計算をスキップします'
        );
        if (mounted) {
          setDirectionsResult(null);
          setRouteInfo(null);
        }
        return;
      }

      if (!mounted) return;

      const origins = sortedTripLocations;
      const origin = origins[0];
      const destination = origins[origins.length - 1];
      const waypoints = origins.slice(1, -1).map(p => ({
        location: { lat: Number(p.lat), lng: Number(p.lng) },
        stopover: true,
      }));

      setIsRouting(true);
      const ds = new window.google.maps.DirectionsService();
      ds.route(
        {
          origin: { lat: Number(origin.lat), lng: Number(origin.lng) },
          destination: {
            lat: Number(destination.lat),
            lng: Number(destination.lng),
          },
          waypoints,
          travelMode: window.google.maps.TravelMode.WALKING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (!mounted) return;
          setIsRouting(false);
          if (status === 'OK' && result && result.routes && result.routes[0]) {
            setDirectionsResult(result);

            const route = result.routes[0];
            let totalMeters = 0;
            const legs = route.legs.map((leg, idx) => {
              totalMeters += leg.distance?.value ?? 0;
              return {
                index: idx,
                start_address: leg.start_address,
                end_address: leg.end_address,
                start_location: leg.start_location,
                end_location: leg.end_location,
                distance: leg.distance,
              };
            });

            setRouteInfo({
              legs,
              totalDistance: (totalMeters / 1000).toFixed(1), // km
            });
          } else {
            setDirectionsResult(null);
            setRouteInfo(null);
          }
        }
      );
    })();

    return () => {
      mounted = false;
    };
  }, [sortedTripLocations]);

  // トグル関数（いいね/いいね解除を切り替える）
  const toggleLike = e => {
    // イベントのデフォルト動作を確実に停止
    if (e) e.preventDefault();

    if (!currentUserId) {
      router.get(route('login'));
      return;
    }

    if (liked) {
      handleRemoveLike(e);
    } else {
      handleAddLike(e);
    }
  };

  // いいね追加
  const handleAddLike = e => {
    if (e) e.preventDefault();
    if (loadingLike) return;
    setLoadingLike(true);

    // CSRFトークン設定を削除し、シンプルなリクエストに
    axios
      .post(`/posts/${post.id}/like`)
      .then(response => {
        setLiked(true);
        setLikesCount(prev => prev + 1);
      })
      .catch(error => {
        console.error('いいねに失敗しました', error);
      })
      .finally(() => {
        setLoadingLike(false);
      });
  };

  // いいね解除
  const handleRemoveLike = e => {
    if (e) e.preventDefault();
    if (loadingLike) return;
    setLoadingLike(true);

    // CSRFトークンを取得
    const token = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute('content');

    // router.deleteの代わりにaxiosを使用
    axios
      .delete(`/posts/${post.id}/like`, {
        headers: {
          'X-CSRF-TOKEN': token,
          Accept: 'application/json', // JSONレスポンスを明示的にリクエスト
        },
      })
      .then(response => {
        // サーバーからのデータを使用
        const data = response.data;
        setLiked(data.is_liked || false);
        setLikesCount(data.likes_count || Math.max(0, likesCount - 1));
      })
      .catch(error => {
        console.error('いいね解除に失敗しました', error);
      })
      .finally(() => {
        setLoadingLike(false);
      });
  };

  return (
    <div className='flex min-h-screen flex-col items-center bg-whit'>
      <Head title={post.title} />

      <div className='w-full overflow-hidden bg-white px-4 pt-6'>
        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = route ? route('posts.index') : '/posts';
            }
          }}
          className='shadow-md inline-flex items-center rounded-xl border border-transparent bg-white px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-800 transition duration-150 ease-in-out hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
          type='button'
        >
          戻る
        </button>
      </div>
      <div className='w-full overflow-hidden bg-white px-6 pb-4'>
        <div className='mt-4 flex items-center'>
          <div className='flex items-center'>
            <Link
              href={
                currentUserId === post.user.id
                  ? route('profile.show')
                  : route('users.profile', post.user.id)
              }
            >
              <img
                src={
                  post?.user?.profile_image_url ||
                  (post?.user?.profile_image
                    ? `/storage/${post?.user?.profile_image}`
                    : '/images/default-avatar.png')
                }
                alt='avatar'
                className='w-6 h-6 rounded-full object-cover'
              />
            </Link>
            <div className='flex flex-row'>
              <Link
                href={
                  currentUserId === post.user.id
                    ? route('profile.show')
                    : route('users.profile', post.user.id)
                }
              >
                <div className='ml-1 font-semibold text-sm'>
                  @{post?.user?.displayid}
                </div>
              </Link>
              {currentUserId !== post.user.id && (
                <>
                  {followStatus && (
                    <div className='ml-1 mt-1 text-xs text-gray-500'>
                      フォロー中
                    </div>
                  )}
                  {!followStatus && (
                    <button
                      className='ml-1 mt-0.5 text-xs font-bold text-gray-600 border rounded px-1 border-gray-300'
                      disabled={loadingFollow}
                      onClick={handleAddFollow}
                    >
                      フォロー
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          {/* 写真カルーセル */}
          {hasPhotos && (
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
          )}
        </div>

        {/* タイトル・メタ */}
        <h1 className='text-2xl font-bold mt-2'>{post.title}</h1>
        <h2 className='text-normal font-bold mt-1'>{post?.subtitle || ''}</h2>
        <div className='text-sm text-gray-500 mt-1'>{metaParts}</div>

        {/* 本文（長文） */}
        {post?.description && (
          <div className='mt-4 whitespace-pre-wrap'>{post.description}</div>
        )}

        {/* 旅程 */}
        <div className='mt-6'>
          <div className='font-semibold text-lg'>▽旅程</div>

          {tripDays.length === 0 && (
            <div className='text-sm text-gray-500 mt-2'>旅程はありません</div>
          )}

          {tripDays.map(day => (
            <TripDayRoutes
              key={day}
              day={day}
              locations={sortedTripLocations}
              routeInfo={routeInfo}
            />
          ))}
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
                directionsResult={directionsResult}
              />
            </div>
          </div>
        </div>
        {/* いいねボタンの実装 */}
        <button
          type='button'
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleLike(e);
          }}
          className={`px-3 py-1 rounded ${liked ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
        >
          {liked ? 'いいね済み' : 'いいね'} ({likesCount})
        </button>

        {/* フッターの余白 */}
        <div className='h-24' />
      </div>
    </div>
  );
}
