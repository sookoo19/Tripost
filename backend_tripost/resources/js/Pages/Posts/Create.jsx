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

export default function PostCreate({ countries, styles, purposes, budgets }) {
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [placeTrigger, setPlaceTrigger] = useState(0);
  const [markerPositions, setMarkerPositions] = useState([]); // 各日の位置を配列で管理
  const [selectedPosition, setSelectedPosition] = useState(null); // 選択された場所の位置を管理

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
    photos: [], //画像パスの配列
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

  // days変更時にtrip_planを初期化
  useEffect(() => {
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

  // ファイルプレビュー URL を管理（メモリリーク防止のため解放）
  useEffect(() => {
    const urls = (data.photos || []).map(f =>
      f instanceof File ? URL.createObjectURL(f) : null
    );
    setPreviewUrls(urls);
    return () => urls.forEach(u => u && URL.revokeObjectURL(u));
  }, [data.photos]);

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

    // trip_plan をクリーンにしてそのまま送信（送信後は復元しない）
    const cleanedTripPlan = cleanTripPlan(data.trip_plan);
    setData('trip_plan', cleanedTripPlan);

    // ログ（任意）
    console.groupCollapsed('POST /posts payload');
    try {
      console.log(
        'trip_plan (cleaned):',
        JSON.stringify(cleanedTripPlan, null, 2)
      );
    } catch (err) {
      console.warn('trip_plan stringify failed:', err);
    }
    console.groupEnd();

    post(route('posts.store'), {
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
                required
              />
            </div>
            {errors.country_id && (
              <InputError message={errors.country_id} className='mt-2' />
            )}
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
            </div>
            {errors.region && (
              <InputError message={errors.region} className='mt-2' />
            )}
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
                required
              />
            </div>
            {errors.period && (
              <InputError message={errors.period} className='mt-2' />
            )}
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
                required
              />
            </div>
            {errors.days && (
              <InputError message={errors.days} className='mt-2' />
            )}
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
            </div>
            {errors.style_id && (
              <InputError message={errors.style_id} className='mt-2' />
            )}
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
            </div>
            {errors.purpose_id && (
              <InputError message={errors.purpose_id} className='mt-2' />
            )}
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
            </div>
            {errors.budget_id && (
              <InputError message={errors.budget_id} className='mt-2' />
            )}
          </div>
        </div>
        <div className='mt-12'>
          <div className='flex flex-row'>
            <InputLabel
              className='font-bold'
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
            <div className='text-sm text-gray-500 mb-2 ml-auto'>
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
                  className='w-16 h-16 xs:w-20 xs:h-20 rounded bg-gray-100 flex items-center justify-center relative'
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
                        className='absolute top-0 right-0 m-1 bg-black bg-opacity-50 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center'
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
              className='inline-flex items-center px-2 py-2 bg-indigo-500 text-sm text-white rounded-md'
            >
              まとめて追加
            </button>
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
              className='font-bold'
              htmlFor='post_status'
              value='タビ状況'
            />
            <Select
              name='post_status'
              className='ml-auto w-3/5 h-auto text-sm'
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
              onChange={option =>
                setData('post_status', option ? option.value : '準備中')
              }
              placeholder='準備中'
              isClearable={false}
              isSearchable={false}
              maxMenuHeight={200}
            />
            {errors.post_status && (
              <InputError message={errors.post_status} className='mt-2' />
            )}
          </div>
          <div className='inline-flex items-center w-full mt-4 mb-4'>
            <InputLabel
              className='font-bold'
              htmlFor='share_scope'
              value='公開設定'
            />
            <Select
              name='share_scope'
              className='ml-auto w-3/5 h-auto text-sm'
              classNamePrefix='react-select'
              options={[
                { value: '非公開', label: '非公開' },
                { value: '公開', label: '公開' },
              ]}
              value={
                [
                  { value: '非公開', label: '非公開' },
                  { value: '公開', label: '公開' },
                ].find(opt => opt.value === data.share_scope) || null
              }
              onChange={option =>
                setData('share_scope', option ? option.value : '非公開')
              }
              placeholder='非公開'
              isClearable={false}
              isSearchable={false}
              maxMenuHeight={200}
            />
            {errors.share_scope && (
              <InputError message={errors.share_scope} className='mt-2' />
            )}
          </div>
        </div>

        <div className='flex items-center justify-end mt-4'>
          <PrimaryButton
            className='w-full h-12 mt-2 flex justify-center items-center inline-flex items-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-lg font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-300 focus:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
            disabled={processing}
          >
            タビを作成
          </PrimaryButton>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
