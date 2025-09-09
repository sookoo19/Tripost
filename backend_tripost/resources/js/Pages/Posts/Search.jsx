import { Head, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from 'react-select';
import { useMemo } from 'react';

export default function Search({ countries, styles, purposes, budgets }) {
  const { data, setData, get, processing, errors } = useForm({
    keyword: '',
    period_from: '',
    period_to: '',
    days: '', // days_min, days_max を削除し、days に変更
    country_id: '',
    style_id: '',
    purpose_id: '',
    budget_id: '',
    budget_min: '',
    budget_max: '',
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

  // 予算の選択肢（表示は日本円フォーマット、値は文字列）
  const budgetMinOptions = useMemo(() => {
    const vals = [0, 50000, 100000, 200000, 300000, 500000];
    return vals.map(v => ({
      value: String(v),
      label: v === 0 ? '¥0' : '¥' + v.toLocaleString(),
    }));
  }, []);

  const budgetMaxOptions = useMemo(() => {
    const vals = [50000, 100000, 200000, 300000, 500000, 1000000];
    return vals.map(v => ({
      value: String(v),
      label: '¥' + v.toLocaleString(),
    }));
  }, []);

  // 日数選択用 options (react-select)
  const daysOptions = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        value: String(i + 1),
        label: `${i + 1}日間`,
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

  const handleSubmit = e => {
    e.preventDefault();

    // 検索キーワードをそのまま送信（サーバー側で処理するため）
    const cleanedKeyword = (data.keyword || '').trim();

    // 空でないフィールドだけクエリに追加
    const params = new URLSearchParams();
    Object.entries({ ...data, keyword: cleanedKeyword }).forEach(
      ([key, value]) => {
        if (value === '' || value === null || value === undefined) return;
        params.append(key, value);
      }
    );

    // クエリ文字列付きで GET を発行
    get(route('posts.searchResult') + '?' + params.toString(), {
      preserveState: true,
      replace: false,
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className='text-2xl font-semibold leading-tight text-gray-800 text-center'>
          タビ検索
        </h2>
      }
    >
      <Head title='タビ検索' />

      <form onSubmit={handleSubmit}>
        <div>
          <div className='mt-2 flex flex-col p-2'>
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
            </div>
            {errors.country_id && (
              <InputError message={errors.country_id} className='mt-2' />
            )}
            <div className='inline-flex items-center w-full mt-4'>
              <InputLabel
                className='font-bold'
                htmlFor='period_from'
                value='時期'
              />
              <input
                type='month'
                id='period_from'
                name='period_from'
                value={data.period_from}
                className='ml-auto w-3/5 h-auto text-sm block rounded border border-gray-300'
                style={{ color: data.period_from ? '#000000' : '#7b7e85ff' }}
                onChange={e => setData('period_from', e.target.value)}
              />
            </div>
            <div className='inline-flex items-center w-full mt-1'>
              <p className='ml-auto'>〜</p>
              <InputLabel className='font-bold' htmlFor='period_to' />
              <input
                type='month'
                id='period_to'
                name='period_to'
                value={data.period_to}
                className='ml-2 w-3/5 h-auto text-sm block rounded border border-gray-300'
                style={{ color: data.period_to ? '#000000' : '#7b7e85ff' }}
                onChange={e => setData('period_to', e.target.value)}
              />
            </div>
            {errors.period && (
              <InputError message={errors.period} className='mt-2' />
            )}
            <div className='inline-flex items-center w-full mt-4'>
              <InputLabel className='font-bold' htmlFor='days' value='日数' />
              <Select
                name='days'
                className='ml-auto w-3/5 h-auto text-sm'
                classNamePrefix='react-select'
                placeholder='例：1日間'
                options={daysOptions}
                value={daysOptions.find(opt => opt.value === data.days) || null}
                onChange={option => setData('days', option ? option.value : '')}
                isClearable
                isSearchable={false}
                maxMenuHeight={200}
              />
            </div>
            {errors.days && (
              <InputError message={errors.days} className='mt-2' />
            )}
            <div className='inline-flex items-center w-full mt-4'>
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
            <div className='inline-flex items-center w-full mt-4'>
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
            <div className='inline-flex items-center w-full mt-4'>
              <InputLabel
                className='font-bold'
                htmlFor='budget_min'
                value='予算'
              />
              <Select
                name='budget_min'
                className='ml-auto w-3/5 h-auto text-sm'
                classNamePrefix='react-select'
                options={budgetMinOptions}
                value={
                  budgetMinOptions.find(opt => opt.value === data.budget_min) ||
                  null
                }
                onChange={option =>
                  setData('budget_min', option ? option.value : '')
                }
                placeholder='例: ¥50,000'
                isClearable
                isSearchable={false}
                maxMenuHeight={300}
                menuPortalTarget={
                  typeof document !== 'undefined' ? document.body : null
                }
                menuPosition='fixed'
                menuPlacement='auto'
              />
            </div>
            <div className='inline-flex items-center w-full mt-1'>
              <p className='ml-auto'>〜</p>
              <InputLabel className='font-bold' htmlFor='budget_max' />
              <Select
                name='budget_max'
                className='ml-2 w-3/5 h-auto text-sm'
                classNamePrefix='react-select'
                options={budgetMaxOptions}
                value={
                  budgetMaxOptions.find(opt => opt.value === data.budget_max) ||
                  null
                }
                onChange={option =>
                  setData('budget_max', option ? option.value : '')
                }
                placeholder='例: ¥200,000'
                isClearable
                isSearchable={false}
                maxMenuHeight={300}
                menuPortalTarget={
                  typeof document !== 'undefined' ? document.body : null
                }
                menuPosition='fixed'
                menuPlacement='auto'
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>
            {errors.budget_id && (
              <InputError message={errors.budget_id} className='mt-2' />
            )}
            <div className='inline-flex items-center f-full mt-12'>
              <InputLabel
                className='font-bold'
                htmlFor='keyword'
                value='フリーワード'
              />

              <TextInput
                id='keyword'
                name='keyword'
                value={data.keyword}
                className='ml-auto block w-3/5 h-auto text-sm'
                autoComplete='keyword'
                isFocused={true}
                onChange={e => setData('keyword', e.target.value)}
                placeholder='例：東京タワー、浅草'
              />
            </div>
            {errors.region && (
              <InputError message={errors.keyword} className='mt-2' />
            )}
          </div>
        </div>
        <div className='flex items-center justify-end mt-4'>
          <PrimaryButton
            className='w-full h-12 mt-2 flex justify-center items-center inline-flex items-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-lg font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-300 focus:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
            disabled={processing}
          >
            検索
          </PrimaryButton>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
