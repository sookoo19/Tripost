import GoogleMapComponent from '@/Components/GoogleMap';
import TripDayRoutes from '@/Components/TripDayRoutes';
import { Head, Link, usePage } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import { useMemo, useState, useEffect } from 'react';
import Select from 'react-select';

export default function Map({ posts = [] }) {
  //usePage「現在のページ情報」を取得
  const auth = usePage().props?.auth ?? null;
  const user = auth?.user ?? null;

  // ユーザー位置とDirectionsResultのみ残す
  const [userPosition, setUserPosition] = useState(null); // { lat, lng } or null
  const [directionsResult, setDirectionsResult] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 現在位置を取得する関数（マップ表示用に残す）
  const getCurrentLocation = () => {
    console.log('位置情報取得を開始します');
    setIsGettingLocation(true);
    setLocationError('');

    const geolocationOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0, // キャッシュを使わず、常に新しい位置情報を取得
    };

    navigator.geolocation.getCurrentPosition(
      position => {
        console.log('位置情報取得成功:', position.coords);
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserPosition(pos);
        setIsGettingLocation(false);
      },
      error => {
        console.error('位置情報取得エラー:', error.code, error.message);
        let errorMessage = '位置情報の取得に失敗しました';
        switch (error.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            errorMessage = '位置情報の利用が拒否されました';
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が利用できません';
            break;
          case GeolocationPositionError.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました';
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      geolocationOptions
    );
  };

  // コンポーネントマウント時に位置情報を取得
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Google Maps API の初期化を確認
  useEffect(() => {
    let mounted = true;
    const waitForGoogle = async (timeout = 8000) => {
      const start = Date.now();
      while (
        !(window.google && window.google.maps && window.google.maps.places)
      ) {
        if (window.__GOOGLE_MAPS_LOADED__) break;
        if (Date.now() - start > timeout) return false;
        await new Promise(r => setTimeout(r, 100));
      }
      return !!(
        window.google &&
        window.google.maps &&
        window.google.maps.places
      );
    };

    (async () => {
      const ok = await waitForGoogle();
      if (!ok) {
        console.error('Google Maps Places が利用できません（タイムアウト）');
        return;
      }
      if (!mounted) return;
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // React Select用のstyleデータ整形（useMemoでメモ化）
  const postOptions = useMemo(() => {
    return posts.map(post => ({
      ...post,
      value: post.id,
      label: post.title,
    }));
  }, [posts]);

  // 初期選択は何も選ばれていない状態
  const [selectedPostId, setSelectedPostId] = useState('');

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

  // 時間順にソートされた旅行プランの場所一覧を取得
  const sortedTripLocations = useMemo(() => {
    const locations = [];
    try {
      Object.keys(tripPlanObject).forEach(dayKey => {
        const plans = Array.isArray(tripPlanObject[dayKey])
          ? tripPlanObject[dayKey]
          : [];
        plans.forEach(p => {
          const [time, place, lat, lng] = p;
          if (lat && lng && time) {
            locations.push({
              lat: Number(lat),
              lng: Number(lng),
              day: Number(dayKey),
              time: time,
              place: place || '',
              dayTime: `${dayKey}-${time}`, // ソート用
            });
          }
        });
      });

      // 日付と時間でソート
      locations.sort((a, b) => {
        if (a.day !== b.day) {
          return a.day - b.day; // 日付順
        }
        // 同じ日の場合は時間順（時間は "HH:MM" 形式と仮定）
        return a.time.localeCompare(b.time);
      });
    } catch (err) {
      console.error('Trip plan parsing error:', err);
    }
    return locations;
  }, [tripPlanObject]);

  // マーカー位置の設定
  const markerPositions = useMemo(() => {
    return sortedTripLocations.map((loc, index) => ({
      lat: loc.lat,
      lng: loc.lng,
      label: loc.place,
      title: `${loc.place} (${loc.time})`, // ホバー時に表示されるタイトル
      day: loc.day,
      time: loc.time,
      index: index + 1, // マーカーに表示する番号
    }));
  }, [sortedTripLocations]);

  // 旅程の日付一覧を取得
  const tripDays = useMemo(() => {
    if (!sortedTripLocations.length) return [];
    const days = [...new Set(sortedTripLocations.map(loc => loc.day))].sort(
      (a, b) => a - b
    );
    return days;
  }, [sortedTripLocations]);

  // ルート情報のstate
  const [routeInfo, setRouteInfo] = useState(null);

  // 徒歩ルートを表示する関数
  const showWalkingRoute = locations => {
    if (!locations || locations.length < 2) {
      console.log('ルート表示には2ヶ所以上の場所が必要です');
      return;
    }

    const origin = locations[0];
    const destination = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1).map(location => ({
      location: { lat: location.lat, lng: location.lng },
      stopover: true,
    }));

    console.log('徒歩ルート検索開始:', { origin, destination, waypoints });

    setIsRouting(true);

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.WALKING,
        optimizeWaypoints: false, // 経由地の順番を保持
      },
      (result, status) => {
        console.log('ルート検索結果:', { result, status });

        setIsRouting(false);
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirectionsResult(result);

          // ルート情報を抽出
          const route = result.routes[0];
          let totalDistance = 0;

          const legs = route.legs.map((leg, index) => {
            totalDistance += leg.distance.value; // m

            return {
              index,
              start_address: leg.start_address,
              end_address: leg.end_address,
              start_location: leg.start_location,
              end_location: leg.end_location,
              distance: leg.distance,
            };
          });

          const routeInfoData = {
            legs,
            totalDistance: (totalDistance / 1000).toFixed(1), // km
          };

          console.log('設定するルート情報:', routeInfoData);
          setRouteInfo(routeInfoData);
        } else {
          console.error('ルート検索エラー:', status);
          let errorMessage = 'ルート検索に失敗しました: ' + status;
          if (status === 'ZERO_RESULTS') {
            errorMessage =
              'ルートが見つかりませんでした。場所を確認してください。';
          } else if (status === 'OVER_QUERY_LIMIT') {
            errorMessage =
              'APIの利用制限に達しました。しばらく時間をおいてから再試行してください。';
          }
          console.error(errorMessage);

          // エラー時はルート情報をクリア
          setDirectionsResult(null);
          setRouteInfo(null);
        }
      }
    );
  };

  // 旅程選択時に自動的にルートを表示する
  useEffect(() => {
    if (
      sortedTripLocations.length >= 2 &&
      window.google &&
      window.google.maps
    ) {
      // すべての場所を含む徒歩ルートを表示
      showWalkingRoute(sortedTripLocations);
    } else {
      // 場所が足りない場合やAPIが利用できない場合はクリア
      setDirectionsResult(null);
      setRouteInfo(null);
    }
  }, [sortedTripLocations]);

  // Google Mapsへのリンクを生成する関数
  const generateGoogleMapsUrl = () => {
    if (!routeInfo || !routeInfo.legs.length) return '';

    // 全ての地点（始点、経由地、終点）を取得
    const waypoints = routeInfo.legs.reduce((points, leg, index) => {
      // 最初の地点は始点として追加
      if (index === 0) {
        points.push(`${leg.start_location.lat()},${leg.start_location.lng()}`);
      }
      // すべての区間の終点を追加
      points.push(`${leg.end_location.lat()},${leg.end_location.lng()}`);
      return points;
    }, []);

    // Google Maps URLフォーマットに変換
    const waypointsUrl = waypoints.join('/');

    return `https://www.google.com/maps/dir/${waypointsUrl}?travelmode=walking`;
  };

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
              value={
                postOptions.find(
                  opt => String(opt.value) === String(selectedPostId)
                ) || null
              }
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

      {/* ルート情報表示（距離のみ） */}
      {routeInfo && (
        <div className='w-full max-w-xl mx-auto px-4 py-3 mt-4 bg-blue-50 rounded-lg shadow'>
          {/* ルート検索中表示 */}
          {isRouting && (
            <div className='text-center text-blue-600 mb-2'>
              🚶 ルートを計算中...
            </div>
          )}
        </div>
      )}

      {/* 選択されたタビの旅程 */}
      {selectedPostId && tripDays.length > 0 && (
        <div className='w-full max-w-xl mx-auto px-4 py-3'>
          <h3 className='font-bold text-lg mb-3'>旅程</h3>
          {tripDays.map(day => (
            <TripDayRoutes
              key={day}
              day={day}
              locations={sortedTripLocations}
              routeInfo={routeInfo}
            />
          ))}
        </div>
      )}

      {/* ルートコントロール - 位置情報状態表示のみ */}
      <div className='w-full max-w-xl mx-auto px-4 py-2'>
        {/* エラーメッセージ */}
        {locationError && (
          <div className='text-xs text-red-600 mt-2 text-center'>
            {locationError}
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
        userPosition={userPosition}
        directionsResult={directionsResult}
        initialCenter={
          userPosition ||
          (markerPositions.length > 0
            ? markerPositions[0]
            : { lat: 35.6762, lng: 139.6503 })
        }
        isGettingLocation={isGettingLocation}
        showMarkers={true}
      />
    </div>
  );
}
