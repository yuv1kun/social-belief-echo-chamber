
import React, { useRef, useCallback, useEffect } from "react";
import { ParticlePool, EffectPool } from "./ObjectPool";
import AdaptiveQualityManager, { useAdaptiveQuality } from "./AdaptiveQualityManager";

interface AnimationCallback {
  id: string;
  callback: (deltaTime: number) => void;
  priority: number;
  lastRun?: number;
  interval?: number;
}

interface EnhancedPerformanceManagerProps {
  children: React.ReactNode;
  targetFPS?: number;
}

const EnhancedPerformanceManagerCore: React.FC<{ children: React.ReactNode; targetFPS: number }> = ({ 
  children, 
  targetFPS 
}) => {
  const animationCallbacksRef = useRef<Map<string, AnimationCallback>>(new Map());
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<number>(1000 / targetFPS);
  const skipFrameCountRef = useRef<number>(0);
  
  // Object pools
  const particlePoolRef = useRef(new ParticlePool(300));
  const effectPoolRef = useRef(new EffectPool(100));
  
  // Memory management
  const memoryStatsRef = useRef({
    lastCleanup: Date.now(),
    cleanupInterval: 5000, // 5 seconds
    maxMemoryUsage: 50 * 1024 * 1024 // 50MB threshold
  });
  
  const performanceMetricsRef = useRef({
    frameCount: 0,
    lastFPSCheck: Date.now(),
    currentFPS: 60,
    performanceLevel: 'high' as 'high' | 'medium' | 'low',
    adaptiveSkipFrames: 0,
    memoryUsage: 0
  });

  const { updateQuality } = useAdaptiveQuality();

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

  const getParticlePool = useCallback(() => particlePoolRef.current, []);
  const getEffectPool = useCallback(() => effectPoolRef.current, []);

  const performMemoryCleanup = useCallback(() => {
    const now = Date.now();
    const stats = memoryStatsRef.current;
    
    if (now - stats.lastCleanup > stats.cleanupInterval) {
      // Clear object pools if they're getting too large
      if (particlePoolRef.current.getPoolSize() > 200) {
        particlePoolRef.current.clear();
      }
      if (effectPoolRef.current.getPoolSize() > 50) {
        effectPoolRef.current.clear();
      }
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      stats.lastCleanup = now;
      
      // Estimate memory usage
      const estimatedUsage = (
        animationCallbacksRef.current.size * 1000 +
        particlePoolRef.current.getActiveCount() * 500 +
        effectPoolRef.current.getActiveCount() * 1000
      );
      
      performanceMetricsRef.current.memoryUsage = estimatedUsage;
      
      console.log('Memory cleanup performed', {
        estimatedUsage: `${(estimatedUsage / 1024).toFixed(1)}KB`,
        activeParticles: particlePoolRef.current.getActiveCount(),
        activeEffects: effectPoolRef.current.getActiveCount(),
        animations: animationCallbacksRef.current.size
      });
    }
  }, []);

  const updatePerformanceLevel = useCallback(() => {
    const metrics = performanceMetricsRef.current;
    const now = Date.now();
    
    if (now - metrics.lastFPSCheck > 1000) {
      metrics.currentFPS = metrics.frameCount;
      metrics.frameCount = 0;
      metrics.lastFPSCheck = now;
      
      // More aggressive performance adjustments
      if (metrics.currentFPS < 15) {
        metrics.performanceLevel = 'low';
        frameIntervalRef.current = 1000 / 15;
        metrics.adaptiveSkipFrames = 4;
      } else if (metrics.currentFPS < 30) {
        metrics.performanceLevel = 'medium';
        frameIntervalRef.current = 1000 / 25;
        metrics.adaptiveSkipFrames = 2;
      } else {
        metrics.performanceLevel = 'high';
        frameIntervalRef.current = 1000 / targetFPS;
        metrics.adaptiveSkipFrames = 0;
      }
      
      // Update adaptive quality
      updateQuality(metrics.currentFPS);
      
      console.log("Enhanced Performance:", {
        level: metrics.performanceLevel,
        fps: metrics.currentFPS,
        memoryUsage: `${(metrics.memoryUsage / 1024).toFixed(1)}KB`,
        activeAnimations: animationCallbacksRef.current.size
      });
    }
  }, [targetFPS, updateQuality]);

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
      
      // Perform memory cleanup periodically
      performMemoryCleanup();
    }
    
    updatePerformanceLevel();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [updatePerformanceLevel, performMemoryCleanup]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Cleanup pools
      particlePoolRef.current.clear();
      effectPoolRef.current.clear();
    };
  }, [animate]);

  // Provide enhanced performance context to children
  const contextValue = React.useMemo(() => ({
    registerAnimation,
    unregisterAnimation,
    performanceLevel: performanceMetricsRef.current.performanceLevel,
    currentFPS: performanceMetricsRef.current.currentFPS,
    getParticlePool,
    getEffectPool,
    memoryUsage: performanceMetricsRef.current.memoryUsage
  }), [registerAnimation, unregisterAnimation, getParticlePool, getEffectPool]);

  return (
    <EnhancedPerformanceContext.Provider value={contextValue}>
      {children}
    </EnhancedPerformanceContext.Provider>
  );
};

const EnhancedPerformanceManager: React.FC<EnhancedPerformanceManagerProps> = ({ 
  children, 
  targetFPS = 60 
}) => {
  return (
    <AdaptiveQualityManager>
      <EnhancedPerformanceManagerCore targetFPS={targetFPS}>
        {children}
      </EnhancedPerformanceManagerCore>
    </AdaptiveQualityManager>
  );
};

const EnhancedPerformanceContext = React.createContext<{
  registerAnimation: (id: string, callback: (deltaTime: number) => void, priority?: number, interval?: number) => void;
  unregisterAnimation: (id: string) => void;
  performanceLevel: 'high' | 'medium' | 'low';
  currentFPS: number;
  getParticlePool: () => ParticlePool;
  getEffectPool: () => EffectPool;
  memoryUsage: number;
} | null>(null);

export const useEnhancedPerformance = () => {
  const context = React.useContext(EnhancedPerformanceContext);
  if (!context) {
    throw new Error('useEnhancedPerformance must be used within EnhancedPerformanceManager');
  }
  return context;
};

export default EnhancedPerformanceManager;
