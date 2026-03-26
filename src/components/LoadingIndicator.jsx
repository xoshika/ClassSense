import { useEffect, useState } from 'react';

export default function LoadingIndicator({ onLoadingComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate loading for 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-blue-800 z-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-8 animate-fadeIn tracking-wide">ClassSense</h1>
        <div className="flex justify-center items-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
