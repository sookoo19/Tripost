import { useCallback, useRef, useEffect, useState } from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';

import mapStyles from './mapStyles';

const libraries = ['places'];
const mapContainerStyle = {
  height: '60vh',
  width: '100%',
};

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
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries,
  });

  const [center, setCenter] = useState({
    lat: 35.6895,
    lng: 139.6917,
  });
  const [zoom, setZoom] = useState(4);
  const [hoveredMarker, setHoveredMarker] = useState(null); // index of hovered marker

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

  // markerPositionsが変更されたときに地図を更新
  useEffect(() => {
    // selectedPosition がセットされている間は markerPositions 側で地図を移動しない
    if (selectedPosition || !markerPositions.length || !isLoaded) {
      return;
    }

    // 最初の有効な位置を中心に設定
    const firstPosition = markerPositions.find(
      pos => pos && pos.lat && pos.lng
    );
    if (firstPosition) {
      setCenter(firstPosition);
      setZoom(15);

      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current.panTo(firstPosition);
          mapRef.current.setZoom(15);
        }, 100);
      }
    }
  }, [markerPositions, isLoaded, selectedPosition]);

  // selectedPositionが変更されたときに地図を移動
  useEffect(() => {
    if (selectedPosition && isLoaded && mapRef.current) {
      setTimeout(() => {
        mapRef.current.panTo(selectedPosition);
        mapRef.current.setZoom(15);
      }, 100);
    }
  }, [selectedPosition, isLoaded]);

  if (loadError) {
    console.error('Map load error:', loadError);
    return 'Error loading map';
  }
  if (!isLoaded) return 'Loading map...';

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
        center={center}
        options={options}
        onLoad={onMapLoad}
      >
        {markerPositions.map((position, index) =>
          position && position.lat && position.lng ? (
            <Marker
              key={`${position.lat}-${position.lng}-${index}`}
              position={position}
              onMouseOver={() => setHoveredMarker(index)}
              onMouseOut={() =>
                setHoveredMarker(prev => (prev === index ? null : prev))
              }
              icon={{
                url: `https://maps.google.com/mapfiles/ms/icons/${colors[(position.day - 1) % colors.length]}-dot.png`,
                scaledSize: new window.google.maps.Size(32, 32),
              }}
            />
          ) : null
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
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </>
  );
}
