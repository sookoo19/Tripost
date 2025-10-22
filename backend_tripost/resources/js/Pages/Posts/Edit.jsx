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
import TripPlanSection from '@/Components/TripPlanSection';

export default function Edit({
  countries,
  styles,
  purposes,
  budgets,
  post: initialPost,
}) {
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [placeTrigger, setPlaceTrigger] = useState(0);
  const [markerPositions, setMarkerPositions] = useState([]); // 各日の位置を配列で管理
  const [selectedPosition, setSelectedPosition] = useState(null); // 選択された場所の位置を管理

  const { data, setData, post, processing, errors } = useForm({
    title: initialPost.title,
    subtitle: initialPost.subtitle ?? '',
    description: initialPost.description ?? '',
    region: initialPost.region ?? '',
    period: initialPost.period,
    days: String(initialPost.days), // 文字列に変換
    post_status: initialPost.post_status ?? '準備中',
    share_scope: initialPost.share_scope ?? '非公開',
    country_id: initialPost.country_id,
    style_id: initialPost.style_id ?? '',
    purpose_id: initialPost.purpose_id ?? '',
    budget_id: initialPost.budget_id ?? '',
    trip_plan: initialPost.trip_plan ?? {},
    // 既存アップロード画像は文字列パスで渡されるので初期化で入れておく
    photos: initialPost.photos ?? [],
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

  // share_scope の選択肢（表示はするが、post_status が '旅行済' のときのみ公開を有効化）
  const shareScopeOptions = useMemo(() => {
    const canPublic = data.post_status === '旅行済';
    return [
      { value: '非公開', label: '非公開', isDisabled: false },
      { value: '公開', label: '公開', isDisabled: !canPublic },
    ];
  }, [data.post_status]);

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
    // 全て value に id を使う（code を使わない）
    const reactCountries = countries.map(country => ({
      value: country.id,
      code: country.code,
      name: country.name,
      label:
        country.name?.nativeName?.jpn?.common ||
        country.name?.common ||
        country.name,
    }));

    // 日本を先頭に出す（value は id のまま）
    const japan = reactCountries
      .filter(
        c =>
          c.name === '日本' ||
          c.code === 'JP' ||
          c.name?.nativeName?.jpn?.common === '日本'
      )
      .map(c => ({ value: c.value, label: c.label }));

    const others = reactCountries
      .filter(
        c =>
          !(
            c.name === '日本' ||
            c.code === 'JP' ||
            c.name?.nativeName?.jpn?.common === '日本'
          )
      )
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
      .map(c => ({ value: c.value, label: c.label }));

    return [...japan, ...others];
  }, [countries]);

  // 初回レンダリングを追跡するためのフラグ
  const isFirstRender = useRef(true);

  // days変更時のtrip_plan初期化を初回以外に制限
  useEffect(() => {
    // 初回レンダリング時はスキップして既存のtrip_planを保持
    if (isFirstRender.current) {
      isFirstRender.current = false;

      // 既存データからマーカーポジションを初期設定
      if (initialPost.trip_plan && typeof initialPost.trip_plan === 'object') {
        const positions = [];
        Object.values(initialPost.trip_plan).forEach(day => {
          if (Array.isArray(day)) {
            day.forEach(entry => {
              if (Array.isArray(entry) && entry.length >= 4) {
                const [_, __, lat, lng] = entry;
                if (lat && lng)
                  positions.push({
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                  });
              }
            });
          }
        });
        setMarkerPositions(positions);
      }
      return;
    }

    // 2回目以降のレンダリングで日数変更時の処理
    if (data.days) {
      const numDays = parseInt(data.days, 10);
      const initialTripPlan = {};
      for (let i = 1; i <= numDays; i++) {
        initialTripPlan[i] = []; // 各日を空の配列で初期化
      }
      setData('trip_plan', initialTripPlan);
      setMarkerPositions([]); // markerPositionsをリセット
    } else {
      setData('trip_plan', {});
      setMarkerPositions([]);
    }
  }, [data.days]);

  // ファイル圧縮関数（2MB以下にリサイズ・圧縮）
  const compressFile = file => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 元画像のサイズを取得
        const originalWidth = img.width;
        const originalHeight = img.height;

        // 最大800pxにリサイズ（縦横比維持）
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;
        const maxSize = 800;

        if (originalWidth > originalHeight && originalWidth > maxSize) {
          targetWidth = maxSize;
          targetHeight = Math.round((originalHeight / originalWidth) * maxSize);
        } else if (
          originalHeight >= originalWidth &&
          originalHeight > maxSize
        ) {
          targetHeight = maxSize;
          targetWidth = Math.round((originalWidth / originalHeight) * maxSize);
        }

        // canvasのサイズを設定
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // 高品質で描画
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // JPEG形式で圧縮（品質0.8 = 80%）
        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.jpg'),
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              );
              resolve(compressedFile);
            } else {
              resolve(file); // 圧縮失敗時は元ファイルを返す
            }
          },
          'image/jpeg',
          0.8 // 圧縮率（0.8 = 80%品質）
        );
      };

      img.onerror = () => resolve(file); // エラー時は元ファイルを返す
      img.src = URL.createObjectURL(file);
    });
  };

  // ファイル選択／追加（既存ファイルと結合して最大8枚まで）
  const onPhotosChange = async e => {
    const files = Array.from(e.target.files || []);
    const existing = Array.isArray(data.photos) ? data.photos : [];

    if (existing.length + files.length > 8) {
      alert('写真は最大8枚までです');
      if (fileInputRef.current) fileInputRef.current.value = null;
      return;
    }

    if (files.length === 0) return;

    try {
      // 各ファイルを圧縮（並列処理）
      const compressedFiles = await Promise.all(
        files.map(file => compressFile(file))
      );

      const combined = existing.concat(compressedFiles).slice(0, 8);
      setData('photos', combined);

      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (error) {
      console.error('画像圧縮エラー:', error);
      alert('画像の圧縮中にエラーが発生しました');
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  // ファイルプレビュー URL を管理（initialPhotoUrlsを削除）
  useEffect(() => {
    const createdObjectUrls = [];
    const urls = (data.photos || [])
      .map((f, idx) => {
        if (f instanceof File) {
          const u = URL.createObjectURL(f);
          createdObjectUrls.push(u);
          return u;
        }
        if (typeof f === 'string') {
          // サーバー側で渡した photos_urls があれば優先して使用
          if (initialPost.photos && Array.isArray(initialPost.photos)) {
            const pos = initialPost.photos.indexOf(f);
            if (initialPost.photos_urls && initialPost.photos_urls[pos]) {
              return initialPost.photos_urls[pos];
            }
          }
          // 直接 URL が含まれているケースのためのフォールバック
          return /^https?:\/\//.test(f) ? f : null;
        }
        return null;
      })
      .filter(Boolean);

    setPreviewUrls(urls);
    // File から作った objectURL のみ revoke
    return () => createdObjectUrls.forEach(u => URL.revokeObjectURL(u));
  }, [data.photos, initialPost.photos, initialPost.photos_urls]);

  const openFileDialog = () =>
    fileInputRef.current && fileInputRef.current.click();
  const removePhoto = index => {
    const list = Array.isArray(data.photos) ? data.photos.slice() : [];
    list.splice(index, 1);
    setData('photos', list);
  };

  // trip_plan の空エントリを除外するユーティリティ
  const cleanTripPlan = tp => {
    if (!tp || typeof tp !== 'object') return {};
    const out = {};
    Object.keys(tp).forEach(dayKey => {
      const entries = Array.isArray(tp[dayKey]) ? tp[dayKey] : [];
      const filtered = entries.filter(entry => {
        if (!Array.isArray(entry)) return false;
        const [time, place, lat, lng] = entry;
        const isEmptyTime = time === null || String(time).trim() === '';
        const isEmptyPlace = place === null || String(place).trim() === '';
        const isEmptyLat =
          lat === null || lat === undefined || String(lat).trim() === '';
        const isEmptyLng =
          lng === null || lng === undefined || String(lng).trim() === '';
        // 全て空なら除外、いずれか1つでも値があれば残す
        return !(isEmptyTime && isEmptyPlace && isEmptyLat && isEmptyLng);
      });
      if (filtered.length > 0) out[dayKey] = filtered;
    });
    return out;
  };

  const handleSubmit = e => {
    e.preventDefault();

    // trip_plan をクリーンにする
    const cleanedTripPlan = cleanTripPlan(data.trip_plan);

    // FormDataを作成（既存画像は existing_photos[]、新しい画像は photos[] として送る）
    const formData = new FormData();

    // 通常のフィールドを追加
    Object.keys(data).forEach(key => {
      if (key !== 'photos' && key !== 'trip_plan') {
        formData.append(key, data[key] || '');
      }
    });

    // trip_planを追加
    formData.append('trip_plan', JSON.stringify(cleanedTripPlan));

    // 既存の画像（サーバーに保存済みのパス）は existing_photos[] として送る
    (data.photos || []).forEach(item => {
      if (typeof item === 'string') {
        formData.append('existing_photos[]', item);
      }
    });

    // 新しい写真のみを photos[] として追加（File インスタンスのみ）
    (data.photos || []).forEach(file => {
      if (file instanceof File) {
        formData.append('photos[]', file);
      }
    });

    // _methodフィールドを追加（LaravelのPUTリクエストのため）
    formData.append('_method', 'PUT');

    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    // Inertiaのpostメソッドを使用してFormDataを送信
    post(route('posts.update', { post: initialPost.id }), {
      data: formData,
      forceFormData: true,
      onError: errors => {
        console.error('Inertia onError (validation):', errors);
      },
    });
  };

  // TripPlanSectionからのコールバック関数
  const handleTripPlanChange = newTripPlan => {
    setData('trip_plan', newTripPlan);
  };

  const handleMarkerPositionsChange = newMarkerPositions => {
    setMarkerPositions(newMarkerPositions);
  };

  const handleSelectedPositionChange = newSelectedPosition => {
    setSelectedPosition(newSelectedPosition);
    setPlaceTrigger(Date.now());
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className='text-2xl lg:text-3xl font-semibold leading-tight text-gray-800 text-center'>
          タビを編集
        </h2>
      }
    >
      <Head title='タビを編集' />

      <form onSubmit={handleSubmit}>
        <div>
          <div className='block font-bold text-base lg:text-lg text-gray-700'>
            タビ情報
          </div>
          <div className='mt-2 flex flex-col border-t border-b border-gray-300 p-2'>
            <div className='mt-2 inline-flex items-center w-full'>
              <InputLabel
                className='font-bold lg:text-lg'
                htmlFor='country_id'
                value='国'
              />
              <Select
                name='country_id'
                options={countryOptions}
                className='ml-auto w-3/5 h-auto text-sm lg:text-lg'
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
                autoFocus
                required
              />
            </div>
            {errors.country_id && (
              <InputError message={errors.country_id} className='mt-2' />
            )}
            <div className='inline-flex items-center f-full mt-2'>
              <InputLabel
                className='font-bold lg:text-lg'
                htmlFor='region'
                value='地域'
              />

              <TextInput
                id='region'
                name='region'
                value={data.region}
                className='ml-auto block w-3/5 h-auto text-sm lg:text-lg'
                autoComplete='region'
                onChange={e => setData('region', e.target.value)}
                placeholder='例：東京'
              />
            </div>
            {errors.region && (
              <InputError message={errors.region} className='mt-2' />
            )}
            <div className='inline-flex items-center w-full mt-2'>
              <InputLabel
                className='font-bold lg:text-lg'
                htmlFor='period'
                value='時期'
              />

              <input
                type='month'
                id='period'
                name='period'
                value={data.period}
                className='ml-auto w-3/5 h-auto text-sm lg:text-lg block rounded border border-gray-300'
                style={{ color: data.period ? '#000000' : '#7b7e85ff' }}
                onChange={e => setData('period', e.target.value)}
                required
              />
            </div>
            {errors.period && (
              <InputError message={errors.period} className='mt-2' />
            )}
            <div className='inline-flex items-center w-full mt-2'>
              <InputLabel
                className='font-bold lg:text-lg'
                htmlFor='days'
                value='日数'
              />
              <Select
                name='days'
                className='ml-auto w-3/5 h-auto text-sm lg:text-lg'
                classNamePrefix='react-select'
                options={daysOptions}
                value={daysOptions.find(opt => opt.value === data.days) || null}
                onChange={option => setData('days', option ? option.value : '')}
                placeholder='例：５日'
                isClearable={true}
                isSearchable={false}
                maxMenuHeight={200}
                required
              />
            </div>
            {errors.days && (
              <InputError message={errors.days} className='mt-2' />
            )}
            <div className='inline-flex items-center w-full mt-2'>
              <InputLabel
                className='font-bold lg:text-lg'
                htmlFor='style_id'
                value='スタイル'
              />

              <Select
                name='style_id'
                className='ml-auto w-3/5 h-auto text-sm lg:text-lg'
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
            </div>
            {errors.style_id && (
              <InputError message={errors.style_id} className='mt-2' />
            )}
            <div className='inline-flex items-center w-full mt-2'>
              <InputLabel
                className='font-bold lg:text-lg'
                htmlFor='purpose_id'
                value='目的'
              />
              <Select
                name='purpose_id'
                className='ml-auto w-3/5 h-auto text-sm lg:text-lg'
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
            </div>
            {errors.purpose_id && (
              <InputError message={errors.purpose_id} className='mt-2' />
            )}
            <div className='inline-flex items-center w-full mt-2 mb-2'>
              <InputLabel
                className='font-bold lg:text-lg'
                htmlFor='budget_id'
                value='予算'
              />
              <Select
                name='budget_id'
                className='ml-auto w-3/5 h-auto text-sm lg:text-lg'
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
            </div>
            {errors.budget_id && (
              <InputError message={errors.budget_id} className='mt-2' />
            )}
          </div>
        </div>
        <div className='mt-12'>
          <div className='flex flex-row'>
            <InputLabel
              className='font-bold lg:text-lg'
              htmlFor='photos'
              value='タビ写真'
            />

            {/* 非表示の file input */}
            <input
              ref={fileInputRef}
              id='photos'
              type='file'
              name='photos[]'
              accept='image/*'
              multiple
              className='hidden'
              onChange={onPhotosChange}
            />

            {/* カウンタ */}
            <div className='text-sm lg:text-lg text-gray-500 mb-2 ml-auto'>
              {(data.photos || []).length}/8枚
            </div>
          </div>

          {/* グリッド（8スロット） */}
          <div className='grid grid-cols-4 gap-3'>
            {Array.from({ length: 8 }).map((_, i) => {
              const file = (data.photos || [])[i];
              const url = previewUrls[i];
              return (
                <div
                  key={i}
                  className='w-16 h-16 xs:w-20 xs:h-20 lg:h-40 lg:w-40 rounded bg-gray-100 flex items-center justify-center relative'
                >
                  {file ? (
                    <>
                      <img
                        src={url}
                        alt={`preview-${i}`}
                        className='w-full h-full object-cover rounded'
                      />
                      <button
                        type='button'
                        onClick={() => removePhoto(i)}
                        className='absolute top-0 right-0 m-1 bg-black bg-opacity-50 text-white rounded-full w-5 h-5 lg:w-8 lg:h-8 text-xs lg:text-lg flex items-center justify-center'
                        aria-label='削除'
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <button
                      type='button'
                      onClick={openFileDialog}
                      className='w-full h-full flex items-center justify-center text-gray-400'
                      aria-label={`写真を追加（スロット ${i + 1}）`}
                    >
                      <span className='text-2xl'>＋</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 追加ボタン */}
          <div className='mt-3'>
            <button
              type='button'
              onClick={openFileDialog}
              className='inline-flex items-center px-2 py-2 bg-indigo-500 text-sm lg:text-lg text-white rounded-md'
            >
              まとめて追加
            </button>
          </div>
        </div>

        <div className='mt-12'>
          <InputLabel
            className='font-bold lg:text-lg'
            htmlFor='title'
            value='タイトル'
          />
          <TextInput
            id='title'
            name='title'
            value={data.title}
            className='mt-1 block w-full bg-gray-50 lg:text-lg'
            autoComplete='title'
            onChange={e => setData('title', e.target.value)}
            required
          />

          {errors.title && (
            <InputError message={errors.title} className='mt-2' />
          )}
        </div>
        <div className='mt-8'>
          <InputLabel
            className='font-bold lg:text-lg'
            htmlFor='subtitle'
            value='サブタイトル'
          />
          <TextInput
            id='subtitle'
            name='subtitle'
            value={data.subtitle}
            className='mt-1 block w-full bg-gray-50 lg:text-lg'
            autoComplete='subtitle'
            onChange={e => setData('subtitle', e.target.value)}
          />

          {errors.subtitle && (
            <InputError message={errors.subtitle} className='mt-2' />
          )}
        </div>
        <div className='mt-8'>
          <InputLabel
            className='font-bold lg:text-lg'
            htmlFor='description'
            value='タビ概要'
          />
          <textarea
            id='description'
            name='description'
            className='rounded-md bg-gray-50 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mt-1 block w-full h-32 lg:text-lg'
            value={data.description}
            autoComplete='description'
            onChange={e => setData('description', e.target.value)}
          />

          {errors.description && (
            <InputError message={errors.description} className='mt-2' />
          )}
        </div>

        {/* 旅程作成セクション */}
        <TripPlanSection
          days={data.days}
          tripPlan={data.trip_plan}
          onTripPlanChange={handleTripPlanChange}
          onMarkerPositionsChange={handleMarkerPositionsChange}
          onSelectedPositionChange={handleSelectedPositionChange}
        />

        {/* 地図コンポーネント */}
        <GoogleMapComponent
          searchPlace={Object.values(data.trip_plan)
            .flat()
            .map(p => p[1])
            .join(', ')} // 全旅程の場所を結合
          searchTrigger={placeTrigger}
          markerPositions={markerPositions} // 全位置を渡す
          selectedPosition={selectedPosition}
        />

        {/* 投稿ステータスと共有範囲 */}
        <div className='mt-8 border-t border-b border-gray-300'>
          <div className='inline-flex items-center w-full mt-4'>
            <InputLabel
              className='font-bold lg:text-lg'
              htmlFor='post_status'
              value='タビ状況'
            />
            <Select
              name='post_status'
              className='ml-auto w-3/5 h-auto text-sm lg:text-lg'
              classNamePrefix='react-select'
              options={[
                { value: '準備中', label: '準備中' },
                { value: '旅行中', label: '旅行中' },
                { value: '旅行済', label: '旅行済' },
              ]}
              value={
                [
                  { value: '準備中', label: '準備中' },
                  { value: '旅行中', label: '旅行中' },
                  { value: '旅行済', label: '旅行済' },
                ].find(opt => opt.value === data.post_status) || null
              }
              onChange={option => {
                const newStatus = option ? option.value : '準備中';
                setData('post_status', newStatus);
                if (newStatus !== '旅行済' && data.share_scope === '公開') {
                  setData('share_scope', '非公開');
                }
              }}
              placeholder='準備中'
              isClearable={false}
              isSearchable={false}
              maxMenuHeight={200}
            />
          </div>
          <div className='inline-flex items-center w-full mt-4 mb-4'>
            <InputLabel
              className='font-bold lg:text-lg'
              htmlFor='share_scope'
              value='公開設定'
            />
            <Select
              name='share_scope'
              className='ml-auto w-3/5 h-auto text-sm lg:text-lg'
              classNamePrefix='react-select'
              options={shareScopeOptions}
              value={
                shareScopeOptions.find(opt => opt.value === data.share_scope) ||
                shareScopeOptions[0]
              }
              onChange={option => {
                if (option && option.isDisabled) return;
                setData('share_scope', option ? option.value : '非公開');
              }}
              placeholder='非公開'
              isClearable={false}
              isSearchable={false}
              maxMenuHeight={200}
            />
          </div>
        </div>

        <div className='flex items-center justify-end mt-4'>
          <PrimaryButton
            className='w-full h-12 mt-2 flex justify-center items-center inline-flex items-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-lg lg:text-xl font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-300 focus:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
            disabled={processing}
          >
            タビを更新
          </PrimaryButton>
        </div>
      </form>
      <button
        className='w-full h-12 mt-2 flex justify-center items-center inline-flex items-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-lg lg:text-xl font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-300 focus:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
        disabled={false}
        onClick={() => {
          if (!confirm('入力内容が破棄されます。本当にキャンセルしますか？'))
            return;
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = route ? route('posts.index') : '/posts';
          }
        }}
      >
        キャンセル
      </button>
    </AuthenticatedLayout>
  );
}
