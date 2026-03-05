import { useEffect, useRef, useState } from 'react';

interface SwipeActionsProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
}

export default function SwipeActions({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  disabled = false 
}: SwipeActionsProps) {
  const [drag, setDrag] = useState({ x: 0, startX: 0, isDragging: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 100;

  const isInteractive = (target: EventTarget | null) => {
    const el = target as HTMLElement;
    return el?.closest?.('button, a, [role="button"]') != null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    if (isInteractive(e.target)) return;
    setDrag({ x: 0, startX: e.touches[0].clientX, isDragging: true });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!drag.isDragging || disabled) return;
    const dx = e.touches[0].clientX - drag.startX;
    setDrag((d) => ({ ...d, x: dx }));
  };

  const handleTouchEnd = () => {
    if (!drag.isDragging || disabled) return;
    
    if (drag.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (drag.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    }
    
    setDrag({ x: 0, startX: 0, isDragging: false });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    if (isInteractive(e.target)) return;
    setDrag({ x: 0, startX: e.clientX, isDragging: true });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drag.isDragging || disabled) return;
    const dx = e.clientX - drag.startX;
    setDrag((d) => ({ ...d, x: dx }));
  };

  const handleMouseUp = () => {
    if (!drag.isDragging || disabled) return;
    
    if (drag.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (drag.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    }
    
    setDrag({ x: 0, startX: 0, isDragging: false });
  };

  useEffect(() => {
    if (drag.isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - drag.startX;
        setDrag((d) => ({ ...d, x: dx }));
      };

      const handleGlobalMouseUp = () => {
        if (drag.x > SWIPE_THRESHOLD) {
          onSwipeRight();
        } else if (drag.x < -SWIPE_THRESHOLD) {
          onSwipeLeft();
        }
        setDrag({ x: 0, startX: 0, isDragging: false });
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [drag.isDragging, drag.startX, drag.x, onSwipeLeft, onSwipeRight]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        transform: drag.isDragging ? `translateX(${drag.x}px)` : 'translateX(0)',
        transition: drag.isDragging ? 'none' : 'transform 0.2s ease',
        cursor: disabled ? 'default' : drag.isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}
