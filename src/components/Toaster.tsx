import { FunctionComponent, useEffect, useState } from "react";

export type ToasterProps = {
  type: 'success' | 'error';
  message: string;
  duration?: number; // Optional duration in ms, defaults to 5000
};

export const Toaster: FunctionComponent<ToasterProps> = ({
  type,
  message,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [message, duration]);

  if (!isVisible || !message) return null;

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg text-white ${bgColor} z-50 shadow-lg transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <p className="font-rajdhani font-medium text-center">{message}</p>
      <button
        className="absolute top-1 right-1 text-white text-xs"
        onClick={() => setIsVisible(false)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};
