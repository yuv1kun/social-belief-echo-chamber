
import React from "react";

interface NetworkContainerProps {
  children: React.ReactNode;
  onResize: (dimensions: { width: number; height: number }) => void;
}

const NetworkContainer: React.FC<NetworkContainerProps> = ({
  children,
  onResize,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dimensions = {
          width: Math.max(rect.width, 400),
          height: Math.max(rect.height, 400)
        };
        onResize(dimensions);
      }
    };

    // Initial size
    handleResize();

    // Set up ResizeObserver for better performance
    let resizeObserver: ResizeObserver;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
    }

    // Fallback to window resize
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [onResize]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-[500px] overflow-hidden relative bg-gradient-to-br from-slate-900/50 to-slate-800/50"
    >
      {children}
    </div>
  );
};

export default NetworkContainer;
