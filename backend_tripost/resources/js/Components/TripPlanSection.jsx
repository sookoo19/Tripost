import InputLabel from '@/Components/InputLabel';
import { useState, useEffect, useRef } from 'react';

export default function TripPlanSection({
  days,
  tripPlan,
  onTripPlanChange,
  onMarkerPositionsChange,
  onSelectedPositionChange,
}) {
  const tripPlaceRef = useRef(null);
  const [predictions, setPredictions] = useState({}); // 日ごとに管理: {day: [predictions]}
  const [showSuggestions, setShowSuggestions] = useState({}); // 日ごとに管理: {day: boolean}
  const fetchTimerRef = useRef(null);
  const wrapperRef = useRef(null);

  // 全trip_planからmarkerPositionsを更新する関数
  const updateMarkerPositions = () => {
    const allPositions = [];
    Object.keys(tripPlan).forEach(day => {
      const plans = tripPlan[day];
      plans.forEach(plan => {
        if (plan[2] && plan[3]) {
          // latとlngが存在する場合
          allPositions.push({ lat: plan[2], lng: plan[3], day: parseInt(day) });
        }
      });
    });
    onMarkerPositionsChange(allPositions);
  };

  // 指定日のtrip_planを取得
  const getTripPlanForDay = day => {
    const plans = tripPlan[day];
    return Array.isArray(plans) ? plans : [];
  };

  // 指定日のtrip_planを設定
  const setTripPlanForDay = (day, newPlans) => {
    onTripPlanChange({ ...tripPlan, [day]: newPlans });
  };

  // 旅程を追加する関数
  const addTripPlan = (day, time, place, lat, lng) => {
    const currentPlans = getTripPlanForDay(day);
    const newPlans = [...currentPlans, [time, place, lat, lng]];
    setTripPlanForDay(day, newPlans);
    // markerPositionsを更新
    updateMarkerPositions();
    // マップの移動を防ぐためselectedPositionをnullに
    onSelectedPositionChange(null);
  };

  // 旅程を削除する関数
  const removeTripPlan = (day, plan) => {
    const currentPlans = getTripPlanForDay(day);
    const index = currentPlans.findIndex(
      p => p[0] === plan[0] && p[1] === plan[1]
    );
    if (index !== -1) {
      const newPlans = [...currentPlans];
      newPlans.splice(index, 1);

      // 新しいtrip_planでmarkerPositionsを直接計算
      const newTripPlan = { ...tripPlan, [day]: newPlans };
      const allPositions = [];
      Object.keys(newTripPlan).forEach(dayKey => {
        const plans = newTripPlan[dayKey];
        plans.forEach(planItem => {
          if (planItem[2] && planItem[3]) {
            // latとlngが存在する場合
            allPositions.push({
              lat: planItem[2],
              lng: planItem[3],
              day: parseInt(dayKey),
            });
          }
        });
      });

      // 状態を更新
      setTripPlanForDay(day, newPlans);
      onMarkerPositionsChange(allPositions);
      onSelectedPositionChange(null);
    }
  };

  // useEffectでtrip_planの変更を監視してmarkerPositionsを更新
  useEffect(() => {
    updateMarkerPositions();
  }, [tripPlan]);

  // AutocompleteService を使って予測候補を取得し、選択時に PlacesService.getDetails で正式情報を取得する
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
      // nothing else to init here — prediction calls happen on input change
    })();

    return () => {
      mounted = false;
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, []);

  // 予測取得（デバウンス） — 日を指定して個別管理
  const fetchPredictions = (input, day) => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    if (!input) {
      setPredictions(prev => ({ ...prev, [day]: [] }));
      setShowSuggestions(prev => ({ ...prev, [day]: false }));
      return;
    }

    fetchTimerRef.current = setTimeout(async () => {
      // 新しいAutocompleteSuggestion APIを使用
      if (window.google?.maps?.places?.AutocompleteSuggestion) {
        try {
          const request = {
            input: input,
            language: 'ja',
            region: 'jp',
            includedPrimaryTypes: ['establishment', 'locality', 'sublocality'], // 施設と地名
          };

          const { suggestions } =
            await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
              request
            );

          if (suggestions && suggestions.length > 0) {
            // 新しいAPIのレスポンス形式に合わせて変換
            const convertedPredictions = suggestions.map(suggestion => ({
              place_id:
                suggestion.placePrediction?.placeId ||
                suggestion.queryPrediction?.text,
              description:
                suggestion.placePrediction?.text?.text ||
                suggestion.queryPrediction?.text,
              structured_formatting: {
                main_text:
                  suggestion.placePrediction?.structuredFormat?.mainText
                    ?.text || suggestion.queryPrediction?.text,
                secondary_text:
                  suggestion.placePrediction?.structuredFormat?.secondaryText
                    ?.text,
              },
            }));

            setPredictions(prev => ({ ...prev, [day]: convertedPredictions }));
            setShowSuggestions(prev => ({ ...prev, [day]: true }));
          } else {
            setPredictions(prev => ({ ...prev, [day]: [] }));
            setShowSuggestions(prev => ({ ...prev, [day]: false }));
          }
        } catch (error) {
          console.error('AutocompleteSuggestion error:', error);
          // フォールバック：旧APIを試す
          fallbackToOldAPI(input, day);
        }
      } else {
        // 新しいAPIが利用できない場合は旧APIを使用
        fallbackToOldAPI(input, day);
      }
    }, 250);
  };

  // フォールバック用の旧API関数
  const fallbackToOldAPI = (input, day) => {
    if (!window.google?.maps?.places?.AutocompleteService) {
      console.error('Google Places API not available');
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: input,
        language: 'ja',
        region: 'jp',
        types: ['establishment', 'geocode'],
      },
      (predictions, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setPredictions(prev => ({ ...prev, [day]: predictions }));
          setShowSuggestions(prev => ({ ...prev, [day]: true }));
        } else {
          console.error('Places service error:', status);
          setPredictions(prev => ({ ...prev, [day]: [] }));
          setShowSuggestions(prev => ({ ...prev, [day]: false }));
        }
      }
    );
  };

  const handleSelectPrediction = async (prediction, day) => {
    console.log(
      'handleSelectPrediction called with:',
      prediction,
      'for day:',
      day
    );

    if (!window.google?.maps?.places?.Place) {
      console.log('Place API not available, using fallback');
      // 現在のplansを取得し、最後の要素を更新
      const currentPlans = getTripPlanForDay(day);
      const updatedPlans = [...currentPlans];
      if (updatedPlans.length === 0) updatedPlans.push(['', '', null, null]);
      updatedPlans[updatedPlans.length - 1][1] = prediction.description || '';
      setTripPlanForDay(day, updatedPlans);
      setPredictions(prev => ({ ...prev, [day]: [] }));
      setShowSuggestions(prev => ({ ...prev, [day]: false }));
      return;
    }

    try {
      console.log('Creating Place with ID:', prediction.place_id);
      const place = new window.google.maps.places.Place({
        id: prediction.place_id,
      });

      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      });

      console.log('Place details fetched:', place);

      // 施設名（お店の名前）のみを取得
      const placeName =
        place.displayName ||
        prediction.structured_formatting?.main_text ||
        prediction.description;
      console.log('Place name:', placeName);

      // 位置情報を取得して保存
      let position = null;
      if (place.location) {
        position = {
          lat: place.location.lat(),
          lng: place.location.lng(),
        };
        console.log('Setting marker position:', position);
      } else {
        console.log('No location found in place details');
      }

      // 現在のplansを取得し、最後の要素を更新
      const currentPlans = getTripPlanForDay(day);
      const updatedPlans = [...currentPlans];
      if (updatedPlans.length === 0) updatedPlans.push(['', '', null, null]);
      updatedPlans[updatedPlans.length - 1][1] = placeName; // placeを更新
      updatedPlans[updatedPlans.length - 1][2] = position?.lat; // latを更新
      updatedPlans[updatedPlans.length - 1][3] = position?.lng; // lngを更新

      setTripPlanForDay(day, updatedPlans); // 配列として設定

      // 選択された場所の位置をselectedPositionに設定（地図移動用）
      if (position) {
        onSelectedPositionChange(position);
      }

      setPredictions(prev => ({ ...prev, [day]: [] }));
      setShowSuggestions(prev => ({ ...prev, [day]: false }));
    } catch (error) {
      console.error('Place details fetch error:', error);
      // エラー時のフォールバック
      const fallbackName =
        prediction.structured_formatting?.main_text || prediction.description;
      // 現在のplansを取得し、最後の要素を更新
      const currentPlans = getTripPlanForDay(day);
      const updatedPlans = [...currentPlans];
      if (updatedPlans.length === 0) updatedPlans.push(['', '', null, null]);
      updatedPlans[updatedPlans.length - 1][1] = fallbackName;
      setTripPlanForDay(day, updatedPlans);
      setPredictions(prev => ({ ...prev, [day]: [] }));
      setShowSuggestions(prev => ({ ...prev, [day]: false }));
    }
  };

  // input フォーカスアウト時に候補を閉じる
  const handleBlur = day => {
    setTimeout(() => {
      setShowSuggestions(prev => ({ ...prev, [day]: false }));
    }, 150);
  };

  return (
    <div className='mt-16 block font-bold text-base text-gray-700'>
      旅程
      <div className='mt-2 border-t border-gray-300'>
        {Array.from({ length: parseInt(days || 0, 10) }, (_, i) => i + 1).map(
          day => {
            const plans = getTripPlanForDay(day);
            const lastPlan = plans[plans.length - 1] || ['', '', null, null];
            const isValidToAdd = lastPlan[0] && lastPlan[1];
            const dayPredictions = predictions[day] || [];
            const dayShowSuggestions = showSuggestions[day] || false;

            // 時間順にソート（空の時刻は最後）
            const sortedPlans = [...plans].sort((a, b) => {
              if (!a[0]) return 1;
              if (!b[0]) return -1;
              return a[0].localeCompare(b[0]);
            });

            return (
              <div key={day}>
                <div className='font-bold text-sm text-gray-700 mt-2 mb-1'>
                  {day}日目
                </div>
                {/* 既存の旅程を表示（ソート済み） */}
                {sortedPlans.map((plan, index) => (
                  <div
                    key={index}
                    className='mb-2 p-2 bg-gray-100 text-xs rounded flex justify-between items-center'
                  >
                    <span>
                      {plan[0]} - {plan[1]}
                    </span>
                    <button
                      type='button'
                      onClick={() => removeTripPlan(day, plan)}
                      className='ml-2 mr-2 text-red-500 text-base'
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <InputLabel
                      htmlFor={`trip_time_${day}`}
                      value='時刻'
                      className='text-xs text-gray-500'
                    />
                    <input
                      id={`trip_time_${day}`}
                      name={`trip_time_${day}`}
                      type='time'
                      value={lastPlan[0] || ''}
                      onChange={e => {
                        const tempPlans = [...plans];
                        if (tempPlans.length === 0)
                          tempPlans.push(['', '', null, null]);
                        tempPlans[tempPlans.length - 1][0] = e.target.value;
                        setTripPlanForDay(day, tempPlans);
                      }}
                      className='mt-1 block w-full text-sm bg-gray-50 rounded border border-gray-300'
                    />
                  </div>
                  <div>
                    <InputLabel
                      htmlFor={`trip_place_${day}`}
                      value='場所'
                      className='text-xs text-gray-500'
                    />
                    <div ref={wrapperRef} className='relative'>
                      <input
                        id={`trip_place_${day}`}
                        name={`trip_place_${day}`}
                        ref={tripPlaceRef}
                        value={lastPlan[1] || ''}
                        className='mt-1 block w-full text-sm bg-gray-50 rounded border border-gray-300'
                        onChange={e => {
                          const tempPlans = [...plans];
                          if (tempPlans.length === 0)
                            tempPlans.push(['', '', null, null]);
                          tempPlans[tempPlans.length - 1][1] = e.target.value;
                          setTripPlanForDay(day, tempPlans);
                          fetchPredictions(e.target.value, day); // dayを渡す
                        }}
                        onBlur={() => handleBlur(day)} // dayを渡す
                        autoComplete='off'
                        onFocus={() => {
                          if (dayPredictions.length)
                            setShowSuggestions(prev => ({
                              ...prev,
                              [day]: true,
                            }));
                        }}
                      />
                      {dayShowSuggestions && dayPredictions.length > 0 && (
                        <div
                          className='absolute left-0 right-0 bg-white border border-gray-300 mt-1 rounded shadow z-50 max-h-60 overflow-auto'
                          onMouseDown={e => {
                            e.preventDefault();
                          }}
                        >
                          {dayPredictions.map(pred => (
                            <div
                              key={pred.place_id || pred.description}
                              className='px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm'
                              onClick={() => handleSelectPrediction(pred, day)}
                            >
                              <div className='font-medium'>
                                {pred.structured_formatting?.main_text ||
                                  pred.description}
                              </div>
                              {pred.structured_formatting?.secondary_text && (
                                <div className='text-xs text-gray-500'>
                                  {pred.structured_formatting.secondary_text}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className='flex justify-end mt-2'>
                  <button
                    type='button'
                    disabled={!isValidToAdd} // 両方が入力されていない場合は無効
                    onClick={() => {
                      if (isValidToAdd) {
                        addTripPlan(
                          day,
                          lastPlan[0],
                          lastPlan[1],
                          lastPlan[2],
                          lastPlan[3]
                        );
                        // 入力欄をクリア（次の旅程用）
                        const tempPlans = [...plans, ['', '', null, null]];
                        setTripPlanForDay(day, tempPlans);
                      }
                    }}
                    className={`px-4 py-2 rounded mb-4 ${
                      isValidToAdd
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    追加
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
