import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  });

  const submit = e => {
    e.preventDefault();

    post(route('password.email'));
  };

  return (
    <GuestLayout title='パスワード再設定'>
      <Head title='Forgot Password' />

      <div className='mb-4 text-sm text-gray-600'>
        <p>パスワードをお忘れですか？</p>
        <p>メールアドレスをお知らせください。</p>
        <p>パスワードリセットリンクを指定のメールアドレスにお送りします。</p>
      </div>

      {status && (
        <div className='mb-4 text-sm font-medium text-green-600'>{status}</div>
      )}

      <form onSubmit={submit}>
        <TextInput
          id='email'
          type='email'
          name='email'
          value={data.email}
          className='mt-1 block w-full'
          isFocused={true}
          onChange={e => setData('email', e.target.value)}
        />

        <InputError message={errors.email} className='mt-2' />

        <div className='mt-4 flex items-center justify-end'>
          <PrimaryButton
            className='w-full h-12 mt-4 flex justify-center items-center'
            disabled={processing}
          >
            送信
          </PrimaryButton>
        </div>
      </form>
      <div className='mt-4 flex justify-end'>
        <Link
          href={route('login')}
          className='rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        >
          ログイン画面へ
        </Link>
      </div>
    </GuestLayout>
  );
}
