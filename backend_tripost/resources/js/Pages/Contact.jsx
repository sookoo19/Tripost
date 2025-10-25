import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import BottomNav from '@/Components/BottomNav';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Contact() {
  const { props } = usePage();
  const flash = props?.flash ?? {};

  const { data, setData, post, processing, errors, reset } = useForm({
    displayid: '',
    email: '',
    message: '',
  });

  const submit = e => {
    e.preventDefault();

    post(route('contact.send'), {
      onSuccess: () => reset(), // 送信成功時に全フィールドをクリア
    });
  };

  return (
    <GuestLayout title='お問い合わせフォーム'>
      <Head title='お問い合わせ' />

      <form onSubmit={submit}>
        <div>
          <InputLabel htmlFor='displayid' value='Display ID' />

          <TextInput
            id='displayid'
            name='displayid'
            value={data.displayid}
            className='mt-1 block w-full'
            autoComplete='off'
            isFocused={true}
            onChange={e => setData('displayid', e.target.value)}
          />

          <InputError message={errors.displayid} className='mt-2' />
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
          />

          <InputError message={errors.email} className='mt-2' />
        </div>

        <div className='mt-4'>
          <InputLabel htmlFor='message' value='メッセージ' />

          <textarea
            id='message'
            name='message'
            value={data.message}
            onChange={e => setData('message', e.target.value)}
            className='mt-1 block w-full border px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
            rows={6}
          />

          <InputError message={errors.message} className='mt-2' />
        </div>

        <div className='mt-4 flex flex-col justify-end'>
          <PrimaryButton
            className='w-full h-12 mt-8 flex justify-center items-center'
            disabled={processing}
          >
            送信
          </PrimaryButton>
        </div>
      </form>
      {flash.success && (
        <div className='my-4 text-sm font-medium text-green-600'>
          {flash.success}
        </div>
      )}
      <BottomNav />
    </GuestLayout>
  );
}
