import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import type { AssetVariant, StationAsset } from '@/data/stationAssets';

interface StationImageProps {
  asset: StationAsset | undefined;
  variant?: AssetVariant;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Apply the readable dark scrim over the image. */
  scrim?: boolean;
  /** Extra tone-down (blur + desaturate) for background usage behind text. */
  backdrop?: boolean;
  children?: ReactNode;
}

/**
 * Responsive station image: AVIF → WebP → PNG, painted over its blurred LQIP and
 * dominant color so it never flashes empty. `scrim`/`backdrop` keep foreground text
 * high-contrast per the design rules (images must never overpower text).
 */
export function StationImage({
  asset,
  variant = 'hero',
  alt,
  className,
  imgClassName,
  scrim = true,
  backdrop = false,
  children,
}: StationImageProps) {
  const [loaded, setLoaded] = useState(false);
  const formats = asset?.[variant];
  const pngOrWebp = formats?.png ?? formats?.webp ?? formats?.avif;

  return (
    <div
      className={clsx('relative overflow-hidden', className)}
      style={{
        backgroundColor: asset?.color ?? '#0f1a2e',
        backgroundImage: asset?.lqip ? `url(${asset.lqip})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {asset && pngOrWebp && (
        <picture className="absolute inset-0 block h-full w-full">
          {formats?.avif && <source srcSet={formats.avif} type="image/avif" />}
          {formats?.webp && <source srcSet={formats.webp} type="image/webp" />}
          <img
            src={pngOrWebp}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={clsx(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
              loaded ? 'opacity-100' : 'opacity-0',
              backdrop && 'scale-105 blur-[2px] saturate-[0.7] brightness-[0.55]',
              imgClassName,
            )}
          />
        </picture>
      )}
      {scrim && <div className="cg-scrim" />}
      {children}
    </div>
  );
}
