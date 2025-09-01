import { useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';

import mapStyles from './mapStyles';
// 地図のデザインを指定することができます。
// デザインは https://snazzymaps.com からインポートすることができます。

const LIBRARIES = Object.freeze(['places']);
const DEFAULT_CENTER = Object.freeze({ lat: 35.6895, lng: 139.6917 });
const mapContainerStyle = {
  height: '60vh',
  width: '100%',
};
// 地図の大きさを指定します。

const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  // デフォルトUI（衛星写真オプションなど）をキャンセルします。
  zoomControl: true,
};

export default function GoogleMapComponent({
  searchPlace = '',
  searchTrigger = 0,
  clearMarkerTrigger = 0,
  //useEffect は searchTrigger を依存にしているため、入力ごとに（毎キー押下で）ジオコーディングせず、明示的な「確定」アクションでのみ実行できます
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    // ここにAPIキーを入力します。今回は.envに保存しています。
    libraries: LIBRARIES,
  });

  // useLoadScript による読み込み完了を他コンポーネントが検知できるようグローバルフラグを立てる
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
  const markerRef = useRef(null);
  const searchPlaceRef = useRef(searchPlace);

  // searchPlace の最新値を ref に同期（effect の依存は searchTrigger のみ）
  useEffect(() => {
    searchPlaceRef.current = searchPlace;
  }, [searchPlace]);

  const onMapLoad = useCallback(map => {
    mapRef.current = map;
  }, []);
  //API読み込み後に再レンダーを引き起こさないため、useStateを使わず、useRefとuseCallbackを使っています。

  // onBlur（searchTrigger の変化）でのみジオコーディング実行

  useEffect(() => {
    const query = searchPlaceRef.current?.trim();
    if (!isLoaded || !query || !mapRef.current || !window?.google) return;
    let cancelled = false;
    const geocoder = new window.google.maps.Geocoder();

    (async () => {
      try {
        const results = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: query }, (res, status) => {
            if (status === window.google.maps.GeocoderStatus.OK) resolve(res);
            else reject(status);
          });
        });

        if (cancelled || !results?.[0] || !mapRef.current) return;

        const first = results[0];
        const loc = first.geometry.location;
        const latLng = { lat: loc.lat(), lng: loc.lng() };

        // マーカーを作成または移動（重複を防ぐ）
        if (markerRef.current) {
          markerRef.current.setPosition(latLng);
          markerRef.current.setMap(mapRef.current);
        } else {
          markerRef.current = new window.google.maps.Marker({
            position: latLng,
            map: mapRef.current,
            title: query,
            animation: window.google.maps.Animation.DROP,
          });
        }

        // ビューに合わせて移動（viewport があれば fitBounds）
        if (
          first.geometry?.viewport &&
          typeof mapRef.current.fitBounds === 'function'
        ) {
          mapRef.current.fitBounds(first.geometry.viewport);
        } else {
          mapRef.current.panTo(latLng);
          mapRef.current.setZoom(14);
        }
      } catch {
        // silent failure
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, searchTrigger]);

  // clearMarkerTrigger が変わったらマーカーを消す
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  }, [clearMarkerTrigger]);

  if (loadError) return 'Error';
  if (!isLoaded) return 'Loading...';

  return (
    <GoogleMap
      id='map'
      mapContainerStyle={mapContainerStyle}
      zoom={4} // デフォルトズーム倍率を指定します。
      center={DEFAULT_CENTER} // 参照を固定して不意の再センタリングを防ぐ
      options={options}
      onLoad={onMapLoad}
    ></GoogleMap>
  );
}
