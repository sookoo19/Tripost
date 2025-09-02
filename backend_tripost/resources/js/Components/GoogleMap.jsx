import { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

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

export default function GoogleMapComponent({
  searchPlace = '',
  searchTrigger = 0,
  markerPosition = null,
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries,
  });

  const [marker, setMarker] = useState(null);
  const [center, setCenter] = useState({
    lat: 35.6895,
    lng: 139.6917,
  });
  const [zoom, setZoom] = useState(4);

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

  // markerPositionが実際に変更されたときのみ実行
  useEffect(() => {
    // markerPositionがnullまたは未定義の場合は何もしない
    if (!markerPosition || !isLoaded) {
      return;
    }

    // 現在のマーカー位置と新しい位置が同じ場合は何もしない
    if (
      marker &&
      marker.lat === markerPosition.lat &&
      marker.lng === markerPosition.lng
    ) {
      return;
    }

    console.log('Updating marker position to:', markerPosition);

    setMarker(markerPosition);
    setCenter(markerPosition);
    setZoom(15);

    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.panTo(markerPosition);
        mapRef.current.setZoom(15);
      }, 100);
    }
  }, [markerPosition, isLoaded, marker]);

  if (loadError) {
    console.error('Map load error:', loadError);
    return 'Error loading map';
  }
  if (!isLoaded) return 'Loading map...';

  return (
    <GoogleMap
      id='map'
      mapContainerStyle={mapContainerStyle}
      zoom={zoom}
      center={center}
      options={options}
      onLoad={onMapLoad}
    >
      {marker && (
        <Marker position={marker} key={`${marker.lat}-${marker.lng}`} />
      )}
    </GoogleMap>
  );
}
