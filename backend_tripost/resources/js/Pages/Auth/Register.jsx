import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react'; // 標準のInertia.jsのuseFormに変更

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    displayid: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = e => {
    e.preventDefault();

    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <GuestLayout title='アカウント作成'>
      <Head title='Register' />

      <form onSubmit={handleSubmit}>
        <div>
          <InputLabel htmlFor='displayid' value='ユーザーID（5文字以上）' />

          <TextInput
            id='displayid'
            name='displayid'
            value={data.displayid}
            className='mt-1 block w-full'
            autoComplete='displayid'
            isFocused={true}
            onChange={e => setData('displayid', e.target.value)}
            required
          />

          {errors.displayid && (
            <InputError message={errors.displayid} className='mt-2' />
          )}
        </div>

        <div className='mt-4'>
          <InputLabel htmlFor='email' value='メールアドレス' />

          <TextInput
            id='email'
            type='email'
            name='email'
            value={data.email}
            className='mt-1 block w-full'
            autoComplete='username'
            onChange={e => setData('email', e.target.value)}
            required
          />

          {errors.email && (
            <InputError message={errors.email} className='mt-2' />
          )}
        </div>

        <div className='mt-4'>
          <InputLabel htmlFor='password' value='パスワード（8文字以上）' />

          <TextInput
            id='password'
            type='password'
            name='password'
            value={data.password}
            className='mt-1 block w-full'
            autoComplete='new-password'
            onChange={e => setData('password', e.target.value)}
            required
          />

          {errors.password && (
            <InputError message={errors.password} className='mt-2' />
          )}
        </div>

        <div className='mt-4'>
          <InputLabel
            htmlFor='password_confirmation'
            value='パスワード（確認用）'
          />

          <TextInput
            id='password_confirmation'
            type='password'
            name='password_confirmation'
            value={data.password_confirmation}
            className='mt-1 block w-full'
            autoComplete='new-password'
            onChange={e => setData('password_confirmation', e.target.value)}
            required
          />

          {errors.password_confirmation && (
            <InputError
              message={errors.password_confirmation}
              className='mt-2'
            />
          )}
        </div>

        <PrimaryButton
          className='w-full h-12 mt-10 flex justify-center items-center'
          disabled={processing}
        >
          登録
        </PrimaryButton>

        <div className='mt-4 flex items-center justify-end'>
          <Link
            href={route('login')}
            className='rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            すでにアカウントをお持ちですか？
          </Link>
        </div>
      </form>
    </GuestLayout>
  );
}
