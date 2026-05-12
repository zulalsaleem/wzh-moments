export default function Loading({ fullScreen = true, message = 'Loading...' }) {
  const containerClass = fullScreen
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
