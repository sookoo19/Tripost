import { useForm, usePage } from '@inertiajs/react';

export default function Contact() {
  const { props } = usePage();
  const flash = props?.flash ?? {};
  const form = useForm({
    displayid: '',
    email: '',
    message: '',
  });

  const submit = e => {
    e.preventDefault();
    form.post(route('contact.send'));
  };

  return (
    <div className='max-w-lg mx-auto p-4'>
      {flash.success && (
        <div className='mb-4 text-green-600'>{flash.success}</div>
      )}
      <h1 className='text-2xl font-bold mb-4'>お問い合わせ</h1>
      <form onSubmit={submit} className='space-y-3'>
        <div>
          <label className='block text-sm'>Display ID</label>
          <input
            value={form.data.displayid}
            onChange={e => form.setData('displayid', e.target.value)}
            className='w-full border rounded px-2 py-1'
            autoComplete='off'
          />
          {form.errors.displayid && (
            <div className='text-sm text-red-600'>{form.errors.displayid}</div>
          )}
        </div>

        <div>
          <label className='block text-sm'>Email</label>
          <input
            value={form.data.email}
            onChange={e => form.setData('email', e.target.value)}
            className='w-full border rounded px-2 py-1'
            type='email'
          />
          {form.errors.email && (
            <div className='text-sm text-red-600'>{form.errors.email}</div>
          )}
        </div>

        <div>
          <label className='block text-sm'>メッセージ</label>
          <textarea
            value={form.data.message}
            onChange={e => form.setData('message', e.target.value)}
            className='w-full border rounded px-2 py-1'
            rows={6}
          />
          {form.errors.message && (
            <div className='text-sm text-red-600'>{form.errors.message}</div>
          )}
        </div>

        <div>
          <button
            type='submit'
            disabled={form.processing}
            className='px-4 py-2 bg-indigo-600 text-black rounded'
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
}
