'use client';

import { useState, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  direction: 'horizontal' | 'vertical';
  children: React.ReactNode[];
  defaultSizes?: number[];
}

export default function ResizablePanel({ direction, children, defaultSizes = [] }: ResizablePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const separatorRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState(defaultSizes.length ? defaultSizes : Array(children.length).fill(100 / children.length));
  
  useEffect(() => {
    const separator = separatorRef.current;
    if (!separator) return;

    let startPos = 0;
    let startSizes: number[] = [];

    const onMouseDown = (e: MouseEvent) => {
      startPos = direction === 'horizontal' ? e.clientX : e.clientY;
      startSizes = [...sizes];
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const containerSize = direction === 'horizontal' 
        ? containerRef.current.offsetWidth 
        : containerRef.current.offsetHeight;
      
      const delta = ((currentPos - startPos) / containerSize) * 100;
      const newSizes = [
        startSizes[0] + delta,
        startSizes[1] - delta
      ];
      
      if (newSizes[0] > 20 && newSizes[1] > 20) {
        setSizes(newSizes);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    separator.addEventListener('mousedown', onMouseDown);
    return () => separator.removeEventListener('mousedown', onMouseDown);
  }, [direction, sizes]);

  return (
    <div 
      ref={containerRef}
      className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} h-full`}
    >
      <div style={{ flex: `${sizes[0]} 1 0%` }}>
        {children[0]}
      </div>
      <div
        ref={separatorRef}
        className={`bg-red-500 cursor-${direction === 'horizontal' ? 'col' : 'row'}-resize hover:bg-red-600 transition-colors`}
        style={{ 
          width: direction === 'horizontal' ? '4px' : '100%',
          height: direction === 'horizontal' ? '100%' : '4px'
        }}
      />
      <div style={{ flex: `${sizes[1]} 1 0%` }}>
        {children[1]}
      </div>
    </div>
  );
}
