import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import Select from 'react-select';
import { useMemo, useState, useEffect, useRef } from 'react';
import GoogleMapComponent from '@/Components/GoogleMap';

export default function PostCreate({ countries, styles, purposes, budgets }) {
  const [placeTrigger, setPlaceTrigger] = useState(0);
  const [markerPositions, setMarkerPositions] = useState([]); // 各日の位置を配列で管理
  const [selectedPosition, setSelectedPosition] = useState(null); // 選択された場所の位置を管理
  const tripPlaceRef = useRef(null);
  const [predictions, setPredictions] = useState({}); // 日ごとに管理: {day: [predictions]}
  const [showSuggestions, setShowSuggestions] = useState({}); // 日ごとに管理: {day: boolean}
  const fetchTimerRef = useRef(null);
  const wrapperRef = useRef(null);
  const { data, setData, post, processing, errors } = useForm({
    title: '',
    subtitle: '',
    description: '',
    region: '',
    period: '',
    days: '',
    post_status: '準備中',
    share_scope: '非公開',
    country_id: '',
    style_id: '',
    purpose_id: '',
    budget_id: '',
    trip_plan: {}, // オブジェクト形式に変更: {day: [[time, place, lat, lng], ...], ...}
  });

  // React Select用のstyleデータ整形（useMemoでメモ化）
  const styleOptions = useMemo(() => {
    return styles.map(style => ({
      ...style,
      value: style.id,
      label: style.name,
    }));
  }, [styles]);

  // React Purpose用のstyleデータ整形（useMemoでメモ化）
  const purposeOptions = useMemo(() => {
    return purposes.map(purpose => ({
      ...purpose,
      value: purpose.id,
      label: purpose.name,
    }));
  }, [purposes]);

  // React Budget用のstyleデータ整形（useMemoでメモ化）
  const budgetOptions = useMemo(() => {
    return budgets.map(budget => ({
      ...budget,
      value: budget.id,
    }));
  }, [budgets]);

  // 日数選択用 options (react-select)
  const daysOptions = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        value: String(i + 1),
        label: `${i + 1}日`,
      })),
    []
  );

  // React Select用の国データ整形（useMemoでメモ化）
  const countryOptions = useMemo(() => {
    const reactCountries = countries.map(country => ({
      ...country,
      value: country.code,
      label: country.name,
    }));

    const japan = reactCountries
      .filter(
        reactCountry =>
          reactCountry.name?.nativeName?.jpn?.common === '日本' ||
          reactCountry.name === '日本' ||
          reactCountry.name === 'Japan' ||
          reactCountry.code === 'JP'
      )
      .map(reactCountry => ({
        value: reactCountry.code,
        label:
          reactCountry.name?.nativeName?.jpn?.common ||
          reactCountry.name?.common ||
          reactCountry.name,
      }));

    const others = reactCountries
      .filter(
        reactCountry =>
          !(
            reactCountry.name?.nativeName?.jpn?.common === '日本' ||
            reactCountry.name === '日本' ||
            reactCountry.name === 'Japan' ||
            reactCountry.code === 'JP'
          )
      )
      .sort((a, b) => {
        const aName =
          a.name?.nativeName?.jpn?.common || a.name?.common || a.name;
        const bName =
          b.name?.nativeName?.jpn?.common || b.name?.common || b.name;
        return aName.localeCompare(bName, 'ja');
      })
      .map(reactCountry => ({
        value: reactCountry.code,
        label:
          reactCountry.name?.nativeName?.jpn?.common ||
          reactCountry.name?.common ||
          reactCountry.name,
      }));

    return [...japan, ...others];
  }, [countries]);

  // 全trip_planからmarkerPositionsを更新する関数
  const updateMarkerPositions = () => {
    const allPositions = [];
    Object.keys(data.trip_plan).forEach(day => {
      const plans = data.trip_plan[day];
      plans.forEach(plan => {
        if (plan[2] && plan[3]) {
          // latとlngが存在する場合
          allPositions.push({ lat: plan[2], lng: plan[3], day: parseInt(day) });
        }
      });
    });
    setMarkerPositions(allPositions);
  };

  // days変更時にtrip_planを初期化
  useEffect(() => {
    if (data.days) {
      const numDays = parseInt(data.days, 10);
      const initialTripPlan = {};
      for (let i = 1; i <= numDays; i++) {
        initialTripPlan[i] = []; // 各日を空の配列で初期化
      }
      setData('trip_plan', initialTripPlan);
      updateMarkerPositions(); // markerPositionsを更新
    } else {
      setData('trip_plan', {});
      setMarkerPositions([]);
    }
  }, [data.days]);

  // 指定日のtrip_planを取得
  const getTripPlanForDay = day => {
    const plans = data.trip_plan[day];
    return Array.isArray(plans) ? plans : [];
  };

  // 指定日のtrip_planを設定
  const setTripPlanForDay = (day, newPlans) => {
    setData('trip_plan', { ...data.trip_plan, [day]: newPlans });
  };

  // 旅程を追加する関数
  const addTripPlan = (day, time, place, lat, lng) => {
    const currentPlans = getTripPlanForDay(day);
    const newPlans = [...currentPlans, [time, place, lat, lng]];
    setTripPlanForDay(day, newPlans);
    // markerPositionsを更新
    updateMarkerPositions();
    // マップの移動を防ぐためselectedPositionをnullに
    setSelectedPosition(null);
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
      const newTripPlan = { ...data.trip_plan, [day]: newPlans };
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
      setMarkerPositions(allPositions);
      setSelectedPosition(null);
    }
  };

  // useEffectでtrip_planの変更を監視してmarkerPositionsを更新
  useEffect(() => {
    updateMarkerPositions();
  }, [data.trip_plan]);

  const handleSubmit = e => {
    e.preventDefault();
    post(route('posts.store'), {});
  };

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
      setPlaceTrigger(Date.now());
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
      setPlaceTrigger(Date.now());

      // 選択された場所の位置をselectedPositionに設定（地図移動用）
      if (position) {
        setSelectedPosition(position);
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
      setPlaceTrigger(Date.now());
      setPredictions(prev => ({ ...prev, [day]: [] }));
      setShowSuggestions(prev => ({ ...prev, [day]: false }));
    }
  };

  // input フォーカスアウト時に候補を閉じる
  const handleBlur = (day) => {
    setTimeout(() => {
      setShowSuggestions(prev => ({ ...prev, [day]: false }));
    }, 150);
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className='text-2xl font-semibold leading-tight text-gray-800 text-center'>
          新規タビ作成
        </h2>
      }
    >
      <Head title='タビ作成' />

      <form onSubmit={handleSubmit}>
        <div>
          <div className='block font-bold text-base text-gray-700'>
            タビ情報
          </div>
          <div className='mt-2 flex flex-col border-t border-b border-gray-300 p-2'>
            <div className='mt-2 inline-flex items-center w-full'>
              <InputLabel
                className='font-bold'
                htmlFor='country_id'
                value='国'
              />
              <Select
                name='country_id'
                options={countryOptions}
                className='ml-auto w-3/5 h-auto text-sm'
                classNamePrefix='react-select'
                value={
                  countryOptions.find(opt => opt.value === data.country_id) ||
                  null
                }
                onChange={option =>
                  setData('country_id', option ? option.value : '')
                }
                placeholder='例：日本'
                isSearchable
                maxMenuHeight={200}
              />

              {errors.country_id && (
                <InputError message={errors.country_id} className='mt-2' />
              )}
            </div>
            <div className='inline-flex items-center f-full mt-2'>
              <InputLabel className='font-bold' htmlFor='region' value='地域' />

              <TextInput
                id='region'
                name='region'
                value={data.region}
                className='ml-auto block w-3/5 h-auto text-sm'
                autoComplete='region'
                isFocused={true}
                onChange={e => setData('region', e.target.value)}
                placeholder='例：東京'
              />

              {errors.region && (
                <InputError message={errors.region} className='mt-2' />
              )}
            </div>
            <div className='inline-flex items-center w-full mt-2'>
              <InputLabel className='font-bold' htmlFor='period' value='時期' />

              <input
                type='month'
                id='period'
                name='period'
                value={data.period}
                className='ml-auto w-3/5 h-auto text-sm block rounded border border-gray-300'
                style={{ color: data.period ? '#000000' : '#7b7e85ff' }}
                onChange={e => setData('period', e.target.value)}
              />

              {errors.period && (
                <InputError message={errors.period} className='mt-2' />
              )}
            </div>
            <div className='inline-flex items-center w-full mt-2'>
              <InputLabel className='font-bold' htmlFor='days' value='日数' />
              <Select
                name='days'
                className='ml-auto w-3/5 h-auto text-sm'
                classNamePrefix='react-select'
                options={daysOptions}
                value={daysOptions.find(opt => opt.value === data.days) || null}
                onChange={option => setData('days', option ? option.value : '')}
                placeholder='例：５日'
                isClearable={true}
                isSearchable={false}
                maxMenuHeight={200}
              />
              {errors.days && (
                <InputError message={errors.days} className='mt-2' />
              )}
            </div>
            <div className='inline-flex items-center w-full mt-2'>
              <InputLabel
                className='font-bold'
                htmlFor='style_id'
                value='スタイル'
              />

              <Select
                name='style_id'
                className='ml-auto w-3/5 h-auto text-sm'
                classNamePrefix='react-select'
                options={styleOptions}
                value={
                  styleOptions.find(opt => opt.value === data.style_id) || null
                }
                onChange={option =>
                  setData('style_id', option ? option.value : '')
                }
                placeholder='例：ソロ'
                isClearable={true}
                isSearchable={false}
                maxMenuHeight={200}
              />
              {errors.style_id && (
                <InputError message={errors.style_id} className='mt-2' />
              )}
            </div>

            <div className='inline-flex items-center w-full mt-2'>
              <InputLabel
                className='font-bold'
                htmlFor='purpose_id'
                value='目的'
              />
              <Select
                name='purpose_id'
                className='ml-auto w-3/5 h-auto text-sm'
                classNamePrefix='react-select'
                options={purposeOptions}
                value={
                  purposeOptions.find(opt => opt.value === data.purpose_id) ||
                  null
                }
                onChange={option =>
                  setData('purpose_id', option ? option.value : '')
                }
                placeholder='例：グルメ'
                isClearable={true}
                isSearchable={false}
                maxMenuHeight={200}
              />
              {errors.purpose_id && (
                <InputError message={errors.purpose_id} className='mt-2' />
              )}
            </div>
            <div className='inline-flex items-center w-full mt-2 mb-2'>
              <InputLabel
                className='font-bold'
                htmlFor='budget_id'
                value='予算'
              />
              <Select
                name='budget_id'
                className='ml-auto w-3/5 h-auto text-sm'
                classNamePrefix='react-select'
                options={budgetOptions}
                value={
                  budgetOptions.find(opt => opt.value === data.budget_id) ||
                  null
                }
                onChange={option =>
                  setData('budget_id', option ? option.value : '')
                }
                placeholder='例：5~10万円'
                isClearable={true}
                isSearchable={false}
                maxMenuHeight={200}
              />
              {errors.budget_id && (
                <InputError message={errors.budget_id} className='mt-2' />
              )}
            </div>
          </div>
        </div>
        <div className='mt-12'>
          <InputLabel className='font-bold text-base' htmlFor='title' value='タイトル' />

          <TextInput
            id='title'
            name='title'
            value={data.title}
            className='mt-1 block w-full bg-gray-50'
            autoComplete='title'
            isFocused={true}
            onChange={e => setData('title', e.target.value)}
            required
          />

          {errors.title && (
            <InputError message={errors.title} className='mt-2' />
          )}
        </div>
        <div className='mt-8'>
          <InputLabel
            className='font-bold text-base'
            htmlFor='subtitle'
            value='サブタイトル'
          />

          <TextInput
            id='subtitle'
            name='subtitle'
            value={data.subtitle}
            className='mt-1 block w-full bg-gray-50'
            autoComplete='subtitle'
            isFocused={true}
            onChange={e => setData('subtitle', e.target.value)}
            required
          />

          {errors.subtitle && (
            <InputError message={errors.subtitle} className='mt-2' />
          )}
        </div>
        <div className='mt-8'>
          <InputLabel
            className='font-bold text-base'
            htmlFor='description'
            value='タビ概要'
          />

          <textarea
            id='description'
            name='description'
            className='rounded-md bg-gray-50 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mt-1 block w-full h-32'
            value={data.description}
            autoComplete='description'
            onChange={e => setData('description', e.target.value)}
          />

          {errors.description && (
            <InputError message={errors.description} className='mt-2' />
          )}
        </div>
        <div className='mt-16 block font-bold text-base text-gray-700 '>
          旅程
        </div>
        <div className='mt-2 border-t border-gray-300'>
          {Array.from(
            { length: parseInt(data.days || 0, 10) },
            (_, i) => i + 1
          ).map(day => {
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
                <div className='font-bold text-sm text-gray-700 mt-2 mb-1'>{day}日目</div>
                {/* 既存の旅程を表示（ソート済み） */}
                {sortedPlans.map((plan, index) => (
                  <div
                    key={index}
                    className='mb-2 p-2 bg-gray-100 rounded flex justify-between items-center'
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
                    <InputLabel htmlFor={`trip_time_${day}`} value='時刻' />
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
                      className='mt-1 block w-full bg-gray-50 rounded border border-gray-300'
                    />
                  </div>
                  <div>
                    <InputLabel htmlFor={`trip_place_${day}`} value='場所' />
                    <div ref={wrapperRef} className='relative'>
                      <input
                        id={`trip_place_${day}`}
                        name={`trip_place_${day}`}
                        ref={tripPlaceRef}
                        value={lastPlan[1] || ''}
                        className='mt-1 block w-full bg-gray-50 rounded border border-gray-300'
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
                          if (dayPredictions.length) setShowSuggestions(prev => ({ ...prev, [day]: true }));
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
          })}
        </div>
        <GoogleMapComponent
          searchPlace={Object.values(data.trip_plan)
            .flat()
            .map(p => p[1])
            .join(', ')} // 全旅程の場所を結合
          searchTrigger={placeTrigger}
          markerPositions={markerPositions} // 全位置を渡す
          selectedPosition={selectedPosition}
        />
      </form>
    </AuthenticatedLayout>
  );
}
