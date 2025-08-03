import OlympicRings from './OlympicRings';

const LoadingSpinner = ({ message = "Loading Olympic data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="relative">
        <OlympicRings size="w-24 h-24" className="animate-spin" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
      </div>
      <p className="mt-6 text-gray-600 dark:text-gray-400 text-lg font-medium animate-pulse">
        {message}
      </p>
      <div className="mt-4 flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
