import { useState } from 'react';
import { Package } from 'lucide-react';

interface CommodityImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function CommodityImage({ src, alt, className = '' }: CommodityImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`w-full h-full bg-stone-100 flex flex-col items-center justify-center gap-2 text-stone-500 p-4 text-center ${className}`}
      >
        <Package className="w-8 h-8 text-stone-400" strokeWidth={1.5} />
        <span className="text-xs font-medium text-stone-600 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}
