export default function TripDayRoutes({ day, locations, routeInfo }) {
  console.log('TripDayRoutes rendered:', {
    day,
    locations: locations?.length,
  });

  if (!locations || locations.length === 0) {
    return null;
  }

  // 同じ日の場所のみフィルタリング
  const dayLocations = locations.filter(loc => loc.day === day);
  console.log('Day locations filtered:', { day, dayLocations });

  if (dayLocations.length === 0) {
    return null;
  }

  // Google Mapsへのリンクを生成する関数
  const generateDayGoogleMapsUrl = () => {
    if (!dayLocations.length) return '';

    // 全ての地点をURLパラメータ形式に変換
    const waypointsUrl = dayLocations
      .map(point => `${point.lat},${point.lng}`)
      .join('/');

    return `https://www.google.com/maps/dir/${waypointsUrl}?travelmode=walking`;
  };

  // 全体のルート情報から各地点間の距離を取得する関数
  const getLegInfo = currentIndex => {
    if (
      !routeInfo ||
      !routeInfo.legs ||
      currentIndex === dayLocations.length - 1
    ) {
      return null;
    }

    // 全体の場所リスト内でのインデックスを見つける
    const currentLocationGlobalIndex = locations.findIndex(
      loc =>
        loc.lat === dayLocations[currentIndex].lat &&
        loc.lng === dayLocations[currentIndex].lng &&
        loc.time === dayLocations[currentIndex].time
    );

    if (
      currentLocationGlobalIndex === -1 ||
      currentLocationGlobalIndex >= routeInfo.legs.length
    ) {
      return null;
    }

    const leg = routeInfo.legs[currentLocationGlobalIndex];
    return {
      distance: leg.distance?.text || '',
    };
  };

  return (
    <div className='mb-4 p-3 bg-white rounded-lg shadow'>
      <div className='flex justify-between items-center mb-2'>
        <h4 className='font-bold'>Day {day}</h4>
        <a
          href={generateDayGoogleMapsUrl()}
          target='_blank'
          rel='noopener noreferrer'
          className='px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Google Mapsで見る
        </a>
      </div>

      <div className='max-h-60 overflow-y-auto'>
        {dayLocations.map((location, index) => {
          const legInfo = getLegInfo(index);

          return (
            <div key={index}>
              <div className='p-2 border-b last:border-0'>
                <div className='flex items-center'>
                  <div className='flex-1'>
                    <p className='font-medium text-sm'>{location.place}</p>
                    <p className='text-xs text-gray-600'>{location.time}</p>
                  </div>
                </div>
              </div>

              {/* 次の地点への距離情報 */}
              {legInfo && index < dayLocations.length - 1 && (
                <div className='px-8 py-2 bg-gray-50'>
                  <div className='flex items-center text-xs text-gray-600'>
                    <span className='mr-2'>🚶</span>
                    <span>距離: {legInfo.distance}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}