export default function PrimaryButton({
  className = '',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      {...props}
      className={
        `inline-flex items-center rounded-md border border-transparent bg-yellow-300 px-4 py-2 text-lg font-semibold uppercase tracking-widest text-black transition duration-150 ease-in-out hover:bg-yellow-500 focus:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-yellow-900 ${
          disabled && 'opacity-25'
        } ` + className
      }
      disabled={disabled}
    >
      {children}
    </button>
  );
}
