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
  markerPositions = [], // 配列: [{lat, lng, day, label, time}, ...]
  selectedPosition = null,
  mapContainerStyle: mapContainerStyleProp = null,
  // userPosition / isGettingLocation を扱わない（現在地取得は行わない）
  directionsResult = null,
  initialCenter = null,
}) {
  // 親が渡さなければデフォルト
  const mapContainerStyle = mapContainerStyleProp || {
    height: '60vh',
    width: '100%',
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries,
  });

  const [center, setCenter] = useState(null);
  const [zoom, setZoom] = useState(15);
  const [hoveredMarker, setHoveredMarker] = useState(null);

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
      mapRef.current = map;
      // 初期中心は外部から渡された initialCenter を優先
      const initial =
        initialCenter ||
        (markerPositions.length > 0 ? markerPositions[0] : defaultCenter);
      if (initial) {
        try {
          mapRef.current.panTo(initial);
          mapRef.current.setZoom(15);
        } catch (e) {
          // ignore
        }
      }
    },
    [initialCenter, markerPositions]
  );

  // markerPositions が変更されたら中心を適宜設定（ただし selectedPosition がある場合は優先しない）
  useEffect(() => {
    if (!isLoaded) return;

    if (selectedPosition && mapRef.current) {
      try {
        mapRef.current.panTo(selectedPosition);
        mapRef.current.setZoom(15);
        setCenter(selectedPosition);
        return;
      } catch (e) {
        // ignore
      }
    }

    const first =
      initialCenter || (markerPositions.length > 0 ? markerPositions[0] : null);
    if (first) {
      setCenter(first);
      if (mapRef.current) {
        try {
          mapRef.current.panTo(first);
          mapRef.current.setZoom(15);
        } catch (e) {
          // ignore
        }
      }
    } else {
      setCenter(defaultCenter);
    }
  }, [markerPositions, initialCenter, selectedPosition, isLoaded]);

  // ルートが表示されたときに地図の範囲を調整
  useEffect(() => {
    if (directionsResult && mapRef.current && isLoaded) {
      const bounds = new window.google.maps.LatLngBounds();

      directionsResult.routes[0].legs.forEach(leg => {
        // leg.start_location / end_location は LatLng オブジェクト
        bounds.extend(leg.start_location);
        bounds.extend(leg.end_location);
      });

      setTimeout(() => {
        try {
          mapRef.current.fitBounds(bounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          });
        } catch (e) {
          // ignore
        }
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

  const mapCenter =
    center ||
    initialCenter ||
    (markerPositions.length > 0 ? markerPositions[0] : defaultCenter);

  return (
    <>
      <style>{`
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
        {/* ルート表示 */}
        {directionsResult && (
          <DirectionsRenderer
            directions={directionsResult}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#4285F4',
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
              position={{
                lat: Number(position.lat),
                lng: Number(position.lng),
              }}
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
