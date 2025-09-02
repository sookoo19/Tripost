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
  const [markerPosition, setMarkerPosition] = useState(null); // 新しいstate
  const tripPlaceRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    trip_plan: [],
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

  // trip_plan は常に [[time, place], ...] の形式を想定した簡潔なヘルパー
  const getFirstTime = tp => {
    if (!Array.isArray(tp) || tp.length === 0) return '';
    const first = tp[0];
    return Array.isArray(first) ? (first[0] ?? '') : '';
  };
  const getFirstPlace = tp => {
    if (!Array.isArray(tp) || tp.length === 0) return '';
    const first = tp[0];
    return Array.isArray(first) ? (first[1] ?? '') : '';
  };

  const setFirstTime = val => {
    const rest = Array.isArray(data.trip_plan) ? data.trip_plan.slice(1) : [];
    const first = Array.isArray(data.trip_plan) ? data.trip_plan[0] : undefined;
    const newFirst = Array.isArray(first) ? [val, first[1] ?? ''] : [val, ''];
    setData('trip_plan', [newFirst, ...rest]);
  };
  const setFirstPlace = val => {
    const rest = Array.isArray(data.trip_plan) ? data.trip_plan.slice(1) : [];
    const first = Array.isArray(data.trip_plan) ? data.trip_plan[0] : undefined;
    const newFirst = Array.isArray(first) ? [first[0] ?? '', val] : ['', val];
    setData('trip_plan', [newFirst, ...rest]);
  };

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

  // 予測取得（デバウンス） — 新しいAutocompleteSuggestion APIを使用
  const fetchPredictions = input => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    if (!input) {
      setPredictions([]);
      setShowSuggestions(false);
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

            setPredictions(convertedPredictions);
            setShowSuggestions(true);
          } else {
            setPredictions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('AutocompleteSuggestion error:', error);
          // フォールバック：旧APIを試す
          fallbackToOldAPI(input);
        }
      } else {
        // 新しいAPIが利用できない場合は旧APIを使用
        fallbackToOldAPI(input);
      }
    }, 250);
  };

  // フォールバック用の旧API関数
  const fallbackToOldAPI = input => {
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
          setPredictions(predictions);
          setShowSuggestions(true);
        } else {
          console.error('Places service error:', status);
          setPredictions([]);
          setShowSuggestions(false);
        }
      }
    );
  };

  const handleSelectPrediction = async prediction => {
    console.log('handleSelectPrediction called with:', prediction);

    if (!window.google?.maps?.places?.Place) {
      console.log('Place API not available, using fallback');
      setFirstPlace(prediction.description || '');
      setPlaceTrigger(Date.now());
      setPredictions([]);
      setShowSuggestions(false);
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

      // 位置情報を取得してマーカー用に保存
      if (place.location) {
        const position = {
          lat: place.location.lat(),
          lng: place.location.lng(),
        };
        console.log('Setting marker position:', position);
        setMarkerPosition(position);
      } else {
        console.log('No location found in place details');
      }

      setFirstPlace(placeName);
      setPlaceTrigger(Date.now());
      setPredictions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Place details fetch error:', error);
      // エラー時のフォールバック
      const fallbackName =
        prediction.structured_formatting?.main_text || prediction.description;
      setFirstPlace(fallbackName);
      setPlaceTrigger(Date.now());
      setPredictions([]);
      setShowSuggestions(false);
    }
  };

  // input フォーカスアウト時に候補を閉じる（クリック時は mousedown で選択するため遅延で閉じる）
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
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
          <InputLabel className='font-bold' htmlFor='title' value='タイトル' />

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
            className='font-bold'
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
            className='font-bold'
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
        <div className='mt-16 block font-bold text-base text-gray-700'>
          旅程
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <InputLabel htmlFor='trip_time' value='時刻' />
            <input
              id='trip_time'
              name='trip_time'
              type='time'
              value={getFirstTime(data.trip_plan)}
              onChange={e => setFirstTime(e.target.value)}
              className='mt-1 block w-full bg-gray-50 rounded border border-gray-300'
            />
          </div>

          <div>
            <InputLabel htmlFor='trip_place' value='場所' />
            <div ref={wrapperRef} className='relative'>
              <input
                id='trip_place'
                name='trip_place'
                ref={tripPlaceRef}
                value={getFirstPlace(data.trip_plan)}
                className='mt-1 block w-full bg-gray-50 rounded border border-gray-300'
                onChange={e => {
                  setFirstPlace(e.target.value);
                  fetchPredictions(e.target.value);
                }}
                onBlur={handleBlur}
                autoComplete='off'
                onFocus={() => {
                  if (predictions.length) setShowSuggestions(true);
                }}
              />
              {showSuggestions && predictions.length > 0 && (
                <div
                  className='absolute left-0 right-0 bg-white border border-gray-300 mt-1 rounded shadow z-50 max-h-60 overflow-auto'
                  onMouseDown={e => {
                    // prevent input blur before click handler
                    e.preventDefault();
                  }}
                >
                  {predictions.map(pred => (
                    <div
                      key={pred.place_id || pred.description}
                      className='px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm'
                      onClick={() => handleSelectPrediction(pred)}
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
        <GoogleMapComponent
          searchPlace={getFirstPlace(data.trip_plan)}
          searchTrigger={placeTrigger}
          markerPosition={markerPosition}
        />
      </form>
    </AuthenticatedLayout>
  );
}
