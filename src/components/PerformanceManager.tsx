
import React, { useRef, useCallback, useEffect } from "react";

interface AnimationCallback {
  id: string;
  callback: (deltaTime: number) => void;
  priority: number; // 1 = high, 2 = medium, 3 = low
}

interface PerformanceManagerProps {
  children: React.ReactNode;
  targetFPS?: number;
}

const PerformanceManager: React.FC<PerformanceManagerProps> = ({ 
  children, 
  targetFPS = 60 
}) => {
  const animationCallbacksRef = useRef<Map<string, AnimationCallback>>(new Map());
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<number>(1000 / targetFPS);
  const performanceMetricsRef = useRef({
    frameCount: 0,
    lastFPSCheck: Date.now(),
    currentFPS: 60,
    performanceLevel: 'high' as 'high' | 'medium' | 'low'
  });

  const registerAnimation = useCallback((id: string, callback: (deltaTime: number) => void, priority: number = 2) => {
    animationCallbacksRef.current.set(id, { id, callback, priority });
  }, []);

  const unregisterAnimation = useCallback((id: string) => {
    animationCallbacksRef.current.delete(id);
  }, []);

  const updatePerformanceLevel = useCallback(() => {
    const metrics = performanceMetricsRef.current;
    const now = Date.now();
    
    if (now - metrics.lastFPSCheck > 1000) {
      metrics.currentFPS = metrics.frameCount;
      metrics.frameCount = 0;
      metrics.lastFPSCheck = now;
      
      // Adjust performance level based on FPS
      if (metrics.currentFPS < 30) {
        metrics.performanceLevel = 'low';
        frameIntervalRef.current = 1000 / 30; // Cap at 30 FPS
      } else if (metrics.currentFPS < 45) {
        metrics.performanceLevel = 'medium';
        frameIntervalRef.current = 1000 / 45; // Cap at 45 FPS
      } else {
        metrics.performanceLevel = 'high';
        frameIntervalRef.current = 1000 / targetFPS;
      }
    }
  }, [targetFPS]);

  const animate = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastFrameTimeRef.current;
    
    // Throttle animation based on target interval
    if (deltaTime >= frameIntervalRef.current) {
      const callbacks = Array.from(animationCallbacksRef.current.values());
      const metrics = performanceMetricsRef.current;
      
      // Filter callbacks based on performance level
      const filteredCallbacks = callbacks.filter(({ priority }) => {
        if (metrics.performanceLevel === 'low') return priority === 1;
        if (metrics.performanceLevel === 'medium') return priority <= 2;
        return true;
      });
      
      // Execute callbacks
      filteredCallbacks.forEach(({ callback }) => {
        try {
          callback(deltaTime);
        } catch (error) {
          console.error("Animation callback error:", error);
        }
      });
      
      lastFrameTimeRef.current = currentTime;
      performanceMetricsRef.current.frameCount++;
    }
    
    updatePerformanceLevel();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [updatePerformanceLevel]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // Provide performance context to children
  const contextValue = React.useMemo(() => ({
    registerAnimation,
    unregisterAnimation,
    performanceLevel: performanceMetricsRef.current.performanceLevel,
    currentFPS: performanceMetricsRef.current.currentFPS
  }), [registerAnimation, unregisterAnimation]);

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

const PerformanceContext = React.createContext<{
  registerAnimation: (id: string, callback: (deltaTime: number) => void, priority?: number) => void;
  unregisterAnimation: (id: string) => void;
  performanceLevel: 'high' | 'medium' | 'low';
  currentFPS: number;
} | null>(null);

export const usePerformance = () => {
  const context = React.useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceManager');
  }
  return context;
};

export default PerformanceManager;
