import { useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';

import mapStyles from './mapStyles';
// 地図のデザインを指定することができます。
// デザインは https://snazzymaps.com からインポートすることができます。

const libraries = ['places'];
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
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    // ここにAPIキーを入力します。今回は.envに保存しています。
    libraries,
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
  const onMapLoad = useCallback(map => {
    mapRef.current = map;
  }, []);
  //API読み込み後に再レンダーを引き起こさないため、useStateを使わず、useRefとuseCallbackを使っています。

  // onBlur（searchTrigger の変化）でのみジオコーディング実行

  useEffect(() => {
    if (!isLoaded || !searchPlace || !mapRef.current || !window.google) return;
    let cancelled = false;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchPlace }, (results, status) => {
      if (cancelled) return;
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        mapRef.current.panTo({ lat: loc.lat(), lng: loc.lng() });
        mapRef.current.setZoom(14);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, searchTrigger]);

  if (loadError) return 'Error';
  if (!isLoaded) return 'Loading...';

  return (
    <GoogleMap
      id='map'
      mapContainerStyle={mapContainerStyle}
      zoom={4} // デフォルトズーム倍率を指定します。
      center={{
        lat: 35.6895,
        lng: 139.6917,
      }} // 札幌周辺にデフォルトのセンターを指定しました。
      options={options}
      onLoad={onMapLoad}
    ></GoogleMap>
  );
}
