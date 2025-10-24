'use client';

import React, { useEffect, useState } from 'react';

const ScrollBarFijo: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollLeft = window.scrollX;
      const docWidth = document.documentElement.scrollWidth - window.innerWidth;
      const scrollPercent = docWidth > 0 ? (scrollLeft / docWidth) * 100 : 0;
      setScrollProgress(scrollPercent);
    };

    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('resize', updateScrollProgress);
    
    const observer = new MutationObserver(updateScrollProgress);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
      observer.disconnect();
    };
  }, []);

  const scrollToPosition = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const docWidth = document.documentElement.scrollWidth - window.innerWidth;
    const scrollLeft = percentage * docWidth;
    
    window.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-300 h-4 cursor-pointer hover:bg-gray-400 transition-colors"
      onClick={scrollToPosition}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`h-full transition-all duration-200 ease-out rounded-sm ${
          isHovered ? 'bg-gray-600' : 'bg-gray-500'
        }`}
        style={{ 
          width: `${Math.max(scrollProgress, 2)}%`,
          minWidth: '20px'
        }}
      />
    </div>
  );
};

export default ScrollBarFijo;
