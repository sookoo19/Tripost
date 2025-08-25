import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
  const { data, setData, post, processing, errors, reset } = useForm({
    password: '',
  });

  const submit = e => {
    e.preventDefault();

    post(route('password.confirm'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <GuestLayout title='パスワード再設定'>
      <Head title='Confirm Password' />

      <div className='mb-4 text-sm text-gray-600'>
        続けるにはパスワードの再入力が必要です。
      </div>

      <form onSubmit={submit}>
        <div className='mt-4'>
          <InputLabel htmlFor='password' value='パスワード' />

          <TextInput
            id='password'
            type='password'
            name='password'
            value={data.password}
            className='mt-1 block w-full'
            isFocused={true}
            onChange={e => setData('password', e.target.value)}
          />

          <InputError message={errors.password} className='mt-2' />
        </div>

        <div className='mt-4 flex items-center justify-end'>
          <PrimaryButton
            className='w-full h-12 mt-5 flex justify-center items-center'
            disabled={processing}
          >
            確認
          </PrimaryButton>
        </div>
      </form>
    </GuestLayout>
  );
}
