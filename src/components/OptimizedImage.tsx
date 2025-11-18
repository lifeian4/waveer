import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "scale-down";
  quality?: number;
}

/**
 * Optimized image component with lazy loading, blur placeholder, and responsive sizing
 * Reduces initial page load and improves performance on slow networks
 */
export const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  objectFit = "cover",
  quality = 75,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");

  useEffect(() => {
    // Create a low-quality placeholder
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      if (!priority) {
        setIsLoaded(false);
      }
    };
    img.src = src;
  }, [src, priority]);

  return (
    <div
      className={cn("relative overflow-hidden bg-gray-200 dark:bg-gray-800", className)}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      {/* Blur placeholder - shown while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        src={imageSrc || src}
        alt={alt}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{
          objectFit,
        }}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        decoding="async"
      />
    </div>
  );
};

export default OptimizedImage;
