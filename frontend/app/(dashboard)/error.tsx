'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
      <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
        <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Đã xảy ra lỗi hệ thống</h2>
      <p className="text-muted-foreground text-center max-w-[500px]">
        {error.message || 'Không thể tải hiển thị giao diện này do có lỗi xảy ra. Vui lòng thử lại sau.'}
      </p>
      <button 
        onClick={() => reset()} 
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
      >
        Thử lại
      </button>
    </div>
  );
}
