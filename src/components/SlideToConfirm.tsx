import { useRef, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronRight, Loader2 } from 'lucide-react';

interface SlideToConfirmProps {
  onConfirm: () => void;
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SlideToConfirm({
  onConfirm,
  label,
  isLoading = false,
  disabled = false,
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const progress = useRef(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const startProgress = useRef(0);

  const snapBack = useCallback(() => {
    progress.current = 0;
    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translateX(0px)';
      thumbRef.current.style.transition = 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
    if (fillRef.current) {
      fillRef.current.style.width = '0%';
      fillRef.current.style.transition = 'width 0.28s ease';
    }
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging.current || !trackRef.current) return;
    const delta = clientX - startX.current;
    const rect = trackRef.current.getBoundingClientRect();
    const max = rect.width - 56; // 48px thumb + 8px padding
    const deltaProgress = delta / max;
    const newProgress = Math.min(
      Math.max(startProgress.current + deltaProgress, 0),
      1
    );
    progress.current = newProgress;
    const px = newProgress * max;

    if (thumbRef.current) {
      thumbRef.current.style.transform = `translateX(${px}px)`;
      thumbRef.current.style.transition = 'none';
    }
    if (fillRef.current) {
      fillRef.current.style.width = `${newProgress * 100}%`;
      fillRef.current.style.transition = 'none';
    }
  }, []);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    isHorizontal.current = null;

    if (thumbRef.current) {
      thumbRef.current.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    if (fillRef.current) {
      fillRef.current.style.transition = 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    if (progress.current >= 0.85) {
      onConfirm();
    } else {
      snapBack();
    }
  }, [onConfirm, snapBack]);

  const handleStart = useCallback(
    (clientX: number, clientY?: number) => {
      if (isLoading || disabled) return;
      isDragging.current = true;
      startX.current = clientX;
      startY.current = clientY ?? 0;
      isHorizontal.current = clientY === undefined ? true : null;
      startProgress.current = progress.current;
    },
    [isLoading, disabled]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) handleMove(e.clientX);
    };
    const onMouseUp = () => {
      if (isDragging.current) handleEnd();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startX.current);
      const deltaY = Math.abs(touch.clientY - startY.current);

      if (isHorizontal.current === null) {
        if (deltaY > deltaX && deltaY > 6) {
          isHorizontal.current = false;
          isDragging.current = false;
          snapBack();
          return;
        } else if (deltaX > 6) {
          isHorizontal.current = true;
        }
      }

      if (isHorizontal.current) {
        if (e.cancelable) e.preventDefault();
        handleMove(touch.clientX);
      }
    };

    const onTouchEnd = () => {
      if (isDragging.current) handleEnd();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleMove, handleEnd, snapBack]);

  useEffect(() => {
    if (isLoading) {
      snapBack();
      isDragging.current = false;
    }
  }, [isLoading, snapBack]);

  return (
    <div
      ref={trackRef}
      className={`relative h-[60px] rounded-full overflow-hidden select-none p-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)] border border-emerald-500/20 transition-opacity ${
        disabled || isLoading ? 'opacity-50 pointer-events-none' : ''
      }`}
      style={{
        background: 'linear-gradient(90deg, #094736 0%, #0d5944 50%, #157357 100%)',
      }}
    >
      {/* Sliding Fill Trail */}
      <div
        ref={fillRef}
        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#59D9B6] opacity-35"
        style={{ width: '0%', willChange: 'width' }}
      />

      {/* Label and Directional Chevrons */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <span
          ref={labelRef}
          className="w-full text-center text-xs sm:text-sm font-black text-white tracking-wide drop-shadow-xs"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={18} className="animate-spin text-white" />
              Processing...
            </span>
          ) : (
            label
          )}
        </span>

        {/* Trailing Mint Arrows (>>>) */}
        {!isLoading && (
          <div className="flex items-center -space-x-2 text-[#59D9B6] opacity-70 shrink-0">
            <ChevronRight size={18} strokeWidth={3} />
            <ChevronRight size={18} strokeWidth={3} />
            <ChevronRight size={18} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Sliding Circular Thumb */}
      <div
        ref={thumbRef}
        className="relative z-10 h-12 w-12 bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.25)] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none active:scale-95 transition-transform"
        onMouseDown={(e) => {
          e.preventDefault();
          handleStart(e.clientX);
        }}
        onTouchStart={(e) => {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
      >
        <ArrowRight size={20} className="text-[#0a382c]" strokeWidth={2.75} />
      </div>
    </div>
  );
}
