
import React, { useRef, useCallback, useEffect } from "react";

interface AnimationCallback {
  id: string;
  callback: (deltaTime: number) => void;
  priority: number; // 1 = high, 2 = medium, 3 = low
  lastRun?: number;
  interval?: number; // Minimum interval between runs
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
  const skipFrameCountRef = useRef<number>(0);
  
  const performanceMetricsRef = useRef({
    frameCount: 0,
    lastFPSCheck: Date.now(),
    currentFPS: 60,
    performanceLevel: 'high' as 'high' | 'medium' | 'low',
    adaptiveSkipFrames: 0
  });

  const registerAnimation = useCallback((
    id: string, 
    callback: (deltaTime: number) => void, 
    priority: number = 2,
    interval: number = 0
  ) => {
    animationCallbacksRef.current.set(id, { 
      id, 
      callback, 
      priority, 
      interval, 
      lastRun: 0 
    });
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
      
      // More aggressive performance adjustments
      if (metrics.currentFPS < 20) {
        metrics.performanceLevel = 'low';
        frameIntervalRef.current = 1000 / 20; // Cap at 20 FPS
        metrics.adaptiveSkipFrames = 3; // Skip 3 out of 4 frames
      } else if (metrics.currentFPS < 35) {
        metrics.performanceLevel = 'medium';
        frameIntervalRef.current = 1000 / 30; // Cap at 30 FPS
        metrics.adaptiveSkipFrames = 1; // Skip every other frame
      } else {
        metrics.performanceLevel = 'high';
        frameIntervalRef.current = 1000 / targetFPS;
        metrics.adaptiveSkipFrames = 0;
      }
      
      console.log("Performance level:", metrics.performanceLevel, "FPS:", metrics.currentFPS);
    }
  }, [targetFPS]);

  const animate = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastFrameTimeRef.current;
    const metrics = performanceMetricsRef.current;
    
    // Skip frames based on performance level
    if (metrics.adaptiveSkipFrames > 0) {
      if (skipFrameCountRef.current < metrics.adaptiveSkipFrames) {
        skipFrameCountRef.current++;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      skipFrameCountRef.current = 0;
    }
    
    // Throttle animation based on target interval
    if (deltaTime >= frameIntervalRef.current) {
      const callbacks = Array.from(animationCallbacksRef.current.values());
      
      // Filter callbacks based on performance level and intervals
      const filteredCallbacks = callbacks.filter(({ priority, interval, lastRun }) => {
        // Performance-based filtering
        if (metrics.performanceLevel === 'low' && priority > 1) return false;
        if (metrics.performanceLevel === 'medium' && priority > 2) return false;
        
        // Interval-based filtering
        if (interval && interval > 0) {
          const timeSinceLastRun = currentTime - (lastRun || 0);
          return timeSinceLastRun >= interval;
        }
        
        return true;
      });
      
      // Execute callbacks with error handling
      filteredCallbacks.forEach(({ callback, id }) => {
        try {
          callback(deltaTime);
          const callbackData = animationCallbacksRef.current.get(id);
          if (callbackData) {
            callbackData.lastRun = currentTime;
          }
        } catch (error) {
          console.error(`Animation callback error for ${id}:`, error);
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
  registerAnimation: (id: string, callback: (deltaTime: number) => void, priority?: number, interval?: number) => void;
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
