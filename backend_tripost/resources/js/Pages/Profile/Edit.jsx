import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRef, useState } from 'react';
import CropperModal from '@/Components/CropperModal';

export default function Edit({ user, countries = [] }) {
  const fileInputRef = useRef();
  const [notPreview, setNotPreview] = useState(false); // 画像削除フラグ
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);

  const { data, setData, post, processing, errors } = useForm({
    displayid: user.displayid,
    name: user.name || '',
    profile_image: user.profile_image || null,
    bio: user.bio || '',
    visited_countries: user.visited_countries || [],
  });

  // プレビュー用URL
  const previewUrl = notPreview
    ? null
    : data.profile_image instanceof File
      ? URL.createObjectURL(data.profile_image)
      : data.profile_image
        ? `/storage/${data.profile_image}`
        : null;

  const handleCountryChange = e => {
    const value = e.target.value;
    setData(
      'visited_countries',
      e.target.checked
        ? [...data.visited_countries, value]
        : data.visited_countries.filter(c => c !== value)
    );
  };

  const handleImageRemove = () => {
    if (window.confirm('本当に画像を削除しますか？')) {
      setData('profile_image', null);
      setNotPreview(true); // プレビューも消す
    }
  };

  //これにより、写真を選択ボタンを押すと、ref={fileInputRef}を持つinput='file'が選択されたのと同義になる。
  const handleSelectClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = e => {
    e.preventDefault();

    const submitData = { ...data };
    // File型でなければ（nullや空文字や文字列も含めて）削除
    if (!(submitData.profile_image instanceof File)) {
      delete submitData.profile_image;
    }
    post(route('profile.update'), { data: submitData, forceFormData: true });
  };

  // 画像選択時は削除フラグをリセット
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      setCropperSrc(URL.createObjectURL(file));
      setShowCropper(true);
    }
    setNotPreview(false);
  };

  // トリミング後の画像をセット
  const handleCrop = croppedFile => {
    setData('profile_image', croppedFile);
    setShowCropper(false);
    setCropperSrc(null);
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className='text-2xl font-semibold leading-tight text-gray-800 text-center'>
          プロフィール設定
        </h2>
      }
    >
      <Head title='Profile Edit' />
      <form onSubmit={handleSubmit} encType='multipart/form-data'>
        <div>
          <InputLabel htmlFor='profile_image' value='プロフィール画像' />
          <div className='flex flex-col items-center mt-2'>
            <div className='w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-2'>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt='プロフィール画像'
                  className='object-cover w-full h-full'
                />
              ) : (
                <span className='text-gray-400 text-6xl'>👤</span>
              )}
            </div>
            <input
              id='profile_image'
              name='profile_image'
              type='file'
              accept='image/*'
              className='hidden'
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <div className='flex gap-2 mt-2'>
              <button
                type='button'
                className='px-4 py-1 rounded bg-blue-600 text-white'
                onClick={handleSelectClick}
              >
                写真を選択
              </button>
              <button
                type='button'
                className='px-4 py-1 rounded bg-red-500 text-white'
                onClick={handleImageRemove}
              >
                削除
              </button>
            </div>
            {showCropper && (
              <CropperModal
                src={cropperSrc}
                onClose={() => setShowCropper(false)}
                onCrop={handleCrop}
              />
            )}
          </div>
          {errors.profile_image && (
            <InputError message={errors.profile_image} className='mt-2' />
          )}
        </div>

        <div className='mt-8'></div>

        <div>
          <InputLabel htmlFor='displayid' value='ユーザーID（5文字以上）' />

          <TextInput
            id='displayid'
            name='displayid'
            value={data.displayid}
            className='bg-gray-50 mt-1 block w-full'
            autoComplete='displayid'
            isFocused={true}
            onChange={e => setData('displayid', e.target.value)}
            required
          />

          {errors.displayid && (
            <InputError message={errors.displayid} className='mt-2' />
          )}
        </div>

        <div className='mt-8'></div>

        <div>
          <InputLabel htmlFor='name' value='ユーザー名' />

          <TextInput
            id='name'
            name='name'
            value={data.name}
            className='bg-gray-50 mt-1 block w-full'
            autoComplete='name'
            isFocused={true}
            onChange={e => setData('name', e.target.value)}
          />

          {errors.name && <InputError message={errors.name} className='mt-2' />}
        </div>

        <div className='mt-8'></div>

        <div>
          <InputLabel htmlFor='bio' value='自己紹介' />

          <textarea
            id='bio'
            name='bio'
            className='rounded-md bg-gray-50 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mt-1 block w-full h-32'
            value={data.bio}
            autoComplete='bio'
            onChange={e => setData('bio', e.target.value)}
          />

          {errors.bio && <InputError message={errors.bio} className='mt-2' />}
        </div>

        <div className='mt-8'></div>

        <div>
          <InputLabel htmlFor='visited_countries' value='訪れた国' />
          <div
            className='bg-gray-50 mt-2 block w-full rounded border border-gray-300 p-2'
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          >
            {countries
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
              .map(country => (
                <label
                  key={country.code}
                  className='flex items-center gap-1 mb-1'
                >
                  <input
                    type='checkbox'
                    value={country.code}
                    checked={data.visited_countries.includes(country.code)}
                    onChange={handleCountryChange}
                  />
                  <span className='text-2xl'>{country.image}</span>
                  {country.name}
                </label>
              ))}
          </div>
          {errors.visited_countries && (
            <InputError message={errors.visited_countries} className='mt-2' />
          )}

          <div className='flex flex-wrap gap-2 mt-4'>
            {countries
              .filter(country => data.visited_countries.includes(country.code))
              .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
              .map(country => (
                <span key={country.code} className='text-2xl'>
                  {country.image}
                </span>
              ))}
          </div>
        </div>

        <PrimaryButton
          type='submit'
          className='w-full h-12 mt-10 flex justify-center items-center text-white'
          disabled={processing}
        >
          変更を保存
        </PrimaryButton>
      </form>
      <Link href='/profile'>
        <button
          className='w-full h-12 mt-2 flex justify-center items-center inline-flex items-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-lg font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-300 focus:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-500'
          disabled={false}
        >
          キャンセル
        </button>
      </Link>
    </AuthenticatedLayout>
  );
}
