import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
  const { post, processing } = useForm({});

  const submit = e => {
    e.preventDefault();

    post(route('verification.send'));
  };

  return (
    <GuestLayout title='メールアドレス認証'>
      <Head title='Email Verification' />

      <div className='mb-4 text-sm text-gray-600'>
        ご登録ありがとうございます。
        <br />
        ご利用を開始する前に、登録したメールアドレス宛に送信された確認メールのリンクをクリックして、認証を完了してください。
        <br />
        メールが届いていない場合は、下のボタンから再送信できます。
      </div>

      {status === 'verification-link-sent' && (
        <div className='mb-4 text-sm font-medium text-green-600'>
          新しい確認メールを登録されたメールアドレス宛に送信しました。
        </div>
      )}

      <form onSubmit={submit}>
        <div className='mt-4 flex flex-col items-center justify-between'>
          <PrimaryButton
            className='w-full h-12 mt-5 flex justify-center items-center'
            disabled={processing}
          >
            確認メール再送信
          </PrimaryButton>
          <div className='mt-4 flex justify-end w-full'>
            <Link
              href={route('logout')}
              method='post'
              as='button'
              className='rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            >
              ログアウト
            </Link>
          </div>
        </div>
      </form>
    </GuestLayout>
  );
}
