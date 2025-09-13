import { useCallback, useRef, useEffect, useState } from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
  DirectionsRenderer,
} from '@react-google-maps/api';

import mapStyles from './mapStyles';

const libraries = ['places'];
const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};

const colors = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'brown',
  'gray',
  'black',
]; // 10色リスト

export default function GoogleMapComponent({
  searchPlace = '',
  searchTrigger = 0,
  markerPositions = [], // 配列: [{lat, lng, day}, ...] または null
  selectedPosition = null, // 選択された場所の位置
  mapContainerStyle: mapContainerStyleProp = null, // 親から渡すスタイル
  userPosition = null, // 追加: ユーザーの現在位置 {lat, lng}
  directionsResult = null, // 追加: ルート情報
  initialCenter = null, // 追加: 初期表示位置
  isGettingLocation = false, // 位置情報取得中かどうか
}) {
  console.log(
    'GoogleMapComponent レンダリング - userPosition:',
    userPosition,
    'isGettingLocation:',
    isGettingLocation
  );

  // 親が渡さなければデフォルト
  const mapContainerStyle = mapContainerStyleProp || {
    height: '60vh',
    width: '100%',
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries,
  });

  // 位置情報の状態管理
  const [locationTrialComplete, setLocationTrialComplete] = useState(false);
  const [center, setCenter] = useState(null);
  const [zoom, setZoom] = useState(15); // ズームレベルを15に固定
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const userPositionSetRef = useRef(false);

  // デフォルト位置
  const defaultCenter = {
    lat: 35.6895,
    lng: 139.6917,
  };

  useEffect(() => {
    if (isLoaded) {
      window.__GOOGLE_MAPS_LOADED__ = true;
    } else {
      window.__GOOGLE_MAPS_LOADED__ = false;
    }
    return () => {
      window.__GOOGLE_MAPS_LOADED__ = false;
    };
  }, [isLoaded]);

  const mapRef = useRef();
  const onMapLoad = useCallback(
    map => {
      console.log('Google Map 読み込み完了');
      mapRef.current = map;

      // マップ読み込み完了時点でuserPositionがあれば中心に設定
      if (userPosition && !userPositionSetRef.current) {
        console.log('マップ読み込み時に現在位置を中心に設定:', userPosition);
        mapRef.current.panTo(userPosition);
        mapRef.current.setZoom(15);
        userPositionSetRef.current = true;
      }
    },
    [userPosition]
  );

  // 位置情報取得が完了したかどうかを監視
  useEffect(() => {
    // 位置情報取得中はまだ完了していない
    if (isGettingLocation) {
      console.log('位置情報取得中...');
      return;
    }

    // 位置情報取得が完了した
    if (!locationTrialComplete) {
      console.log('位置情報取得完了', userPosition ? '成功' : '失敗');
      setLocationTrialComplete(true);

      if (userPosition) {
        // 現在位置が取得できた場合
        console.log('現在位置を中心に設定:', userPosition);
        setCenter(userPosition);
        userPositionSetRef.current = true;
      } else {
        // 現在位置が取得できなかった場合はデフォルト位置
        console.log('デフォルト位置を設定:', defaultCenter);
        setCenter(defaultCenter);
      }
    }
  }, [isGettingLocation, userPosition, locationTrialComplete]);

  // userPositionが後から更新された場合の処理
  useEffect(() => {
    // 位置情報が取得できた場合のみ処理
    if (!userPosition) return;

    console.log('現在位置が更新されました:', userPosition);

    // 中心位置を設定
    setCenter(userPosition);

    // マップが読み込まれていれば中心を移動
    if (mapRef.current && isLoaded) {
      console.log('マップの中心を現在位置に移動');
      mapRef.current.panTo(userPosition);
      mapRef.current.setZoom(15);
      userPositionSetRef.current = true;
    }
  }, [userPosition, isLoaded]);

  // markerPositionsが変更されたときに地図を更新（ユーザー位置が優先）
  useEffect(() => {
    // 以下の条件では markerPositions による地図移動を行わない
    if (
      selectedPosition ||
      !markerPositions.length ||
      !isLoaded ||
      userPositionSetRef.current || // ユーザー位置設定済みの場合は移動しない
      isGettingLocation ||
      !locationTrialComplete
    ) {
      return;
    }

    // 最初の有効な位置を中心に設定
    const firstPosition = markerPositions.find(
      pos => pos && pos.lat && pos.lng
    );

    if (firstPosition) {
      console.log('マーカーの位置を中心に設定:', firstPosition);
      setCenter(firstPosition);

      if (mapRef.current) {
        mapRef.current.panTo(firstPosition);
        mapRef.current.setZoom(15);
      }
    }
  }, [
    markerPositions,
    isLoaded,
    selectedPosition,
    userPosition,
    isGettingLocation,
    locationTrialComplete,
  ]);

  // selectedPositionが変更されたときに地図を移動
  useEffect(() => {
    if (selectedPosition && isLoaded && mapRef.current) {
      setTimeout(() => {
        mapRef.current.panTo(selectedPosition);
        mapRef.current.setZoom(15);
      }, 100);
    }
  }, [selectedPosition, isLoaded]);

  // ルートが表示されたときに地図の範囲を調整
  useEffect(() => {
    if (directionsResult && mapRef.current && isLoaded) {
      // DirectionsResultのルートに合わせて地図の表示範囲を調整
      const bounds = new window.google.maps.LatLngBounds();

      // ルートの全ポイントを境界に追加
      directionsResult.routes[0].legs.forEach(leg => {
        leg.steps.forEach(step => {
          bounds.extend(step.start_location);
          bounds.extend(step.end_location);
        });
      });

      setTimeout(() => {
        mapRef.current.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        });
      }, 100);
    }
  }, [directionsResult, isLoaded]);

  if (loadError) {
    console.error('Map load error:', loadError);
    return 'Error loading map';
  }

  if (!isLoaded) {
    return (
      <div className='flex items-center justify-center h-full min-h-[85vh] bg-gray-100'>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>
            Google Maps を読み込み中...
          </div>
        </div>
      </div>
    );
  }

  // 位置情報取得が完了してcenterが決まるまで待つ
  if (isGettingLocation || (!locationTrialComplete && !center)) {
    return (
      <div className='flex items-center justify-center h-full min-h-[85vh] bg-gray-100'>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>
            {isGettingLocation ? '📍 位置情報を取得中...' : '地図を初期化中...'}
          </div>
        </div>
      </div>
    );
  }

  // centerが設定されていない場合はデフォルト値を使用
  const mapCenter = center || userPosition || defaultCenter;

  return (
    <>
      {/* InfoWindow の閉じるボタンを非表示にする（必要ならグローバルCSSへ移動してください） */}
      <style>{`
        /* InfoWindow の閉じボタンを隠す */
        .gm-style .gm-ui-hover-effect,
        .gm-style .gm-style-iw button {
          display: none !important;
        }
      `}</style>
      <GoogleMap
        id='map'
        mapContainerStyle={mapContainerStyle}
        zoom={zoom}
        center={mapCenter}
        options={options}
        onLoad={onMapLoad}
      >
        {/* ルート表示（マーカーより先に描画して下層に配置） */}
        {directionsResult && (
          <DirectionsRenderer
            directions={directionsResult}
            options={{
              suppressMarkers: true, // デフォルトマーカーを非表示（カスタムマーカーを使用）
              polylineOptions: {
                strokeColor: '#4285F4', // Google標準の青色
                strokeWeight: 4,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}

        {/* 旅行プランのマーカー */}
        {markerPositions.map((position, index) =>
          position && position.lat && position.lng ? (
            <Marker
              key={`trip-${position.lat}-${position.lng}-${index}`}
              position={position}
              onMouseOver={() => setHoveredMarker(index)}
              onMouseOut={() =>
                setHoveredMarker(prev => (prev === index ? null : prev))
              }
              icon={{
                url: `https://maps.google.com/mapfiles/ms/icons/${colors[(position.day - 1) % colors.length]}-dot.png`,
                scaledSize: new window.google.maps.Size(32, 32),
              }}
              label={{
                text: String(index + 1),
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            />
          ) : null
        )}

        {/* ユーザーの現在位置マーカー */}
        {userPosition && (
          <Marker
            // 座標をキーにすることで確実に再描画されるようにする
            key={`user-${userPosition.lat}-${userPosition.lng}`}
            position={{
              lat: Number(userPosition.lat),
              lng: Number(userPosition.lng),
            }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              // window.google が未定義の場合をガード
              scaledSize:
                typeof window !== 'undefined' && window.google
                  ? new window.google.maps.Size(40, 40)
                  : undefined,
            }}
            title='現在位置'
            zIndex={1000} // 他のマーカーより上に表示
          />
        )}

        {/* hoveredMarker がセットされていれば InfoWindow を表示 */}
        {hoveredMarker !== null && markerPositions[hoveredMarker] && (
          <InfoWindow
            position={{
              lat: Number(markerPositions[hoveredMarker].lat),
              lng: Number(markerPositions[hoveredMarker].lng),
            }}
            options={{
              pixelOffset: new window.google.maps.Size(0, -30),
              closeBoxURL: '',
            }}
          >
            <div className='text-sm'>
              <div className='font-semibold'>
                {markerPositions[hoveredMarker].label || ''}
              </div>
              <div className='text-xs text-black'>
                {markerPositions[hoveredMarker].day
                  ? `Day ${markerPositions[hoveredMarker].day}`
                  : ''}
              </div>
              {markerPositions[hoveredMarker].time && (
                <div className='text-xs text-gray-600'>
                  {markerPositions[hoveredMarker].time}
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </>
  );
}
