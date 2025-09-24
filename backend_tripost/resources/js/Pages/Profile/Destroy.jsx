import { Head, useForm, Link } from '@inertiajs/react';

export default function Destroy() {
  const form = useForm({
    password: '',
  });

  const submit = e => {
    e.preventDefault();
    if (
      !window.confirm(
        '本当にアカウントを削除しますか？ この操作は取り消せません。'
      )
    ) {
      return;
    }
    // サーバ側は 'password' フィールドを current_password で検証する
    form.delete(route('profile.destroy'), {
      preserveScroll: true,
      onError: () => {
        // エラーは form.errors に入るのでコンソール確認
        console.error('削除エラー', form.errors);
      },
    });
  };

  return (
    <div className='flex min-h-screen flex-col items-center bg-white'>
      <Head title='アカウント削除' />
      <div className='w-full'>
        {/*ヘッダー*/}
        <Link href={route('posts.index')}>
          <img
            src='/images/header.svg'
            alt='header'
            className='w-full h-auto block object-cover'
          />
        </Link>
      </div>
      <div className='w-full max-w-lg p-6 mx-auto'>
        <h1 className='text-xl font-bold mb-4'>アカウントを削除</h1>
        <p className='text-sm text-gray-600 mb-6'>
          アカウントを削除すると、すべてのデータが削除されます。続行するには現在のパスワードを入力してください。
        </p>

        <form onSubmit={submit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              現在のパスワード
            </label>
            <input
              type='password'
              value={form.data.password}
              onChange={e => form.setData('password', e.target.value)}
              className='w-full rounded-md border px-3 py-2'
              required
            />
            {form.errors.password && (
              <div className='text-xs text-red-500 mt-1'>
                {form.errors.password}
              </div>
            )}
          </div>

          <div className='flex items-center justify-between'>
            <Link
              href={route('profile.show')}
              className='text-sm text-gray-600 hover:underline'
            >
              キャンセル
            </Link>
            <button
              type='submit'
              className='bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50'
              disabled={form.processing}
            >
              {form.processing ? '削除中...' : 'アカウントを削除する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
