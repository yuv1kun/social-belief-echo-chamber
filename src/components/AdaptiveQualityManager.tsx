
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface QualitySettings {
  renderMode: 'svg' | 'canvas';
  particleCount: number;
  effectIntensity: number;
  animationFPS: number;
  enableFilters: boolean;
  enableGlow: boolean;
  starCount: number;
  linkOpacity: number;
}

interface AdaptiveQualityContextType {
  qualitySettings: QualitySettings;
  deviceCapability: 'high' | 'medium' | 'low';
  updateQuality: (performance: number) => void;
  forceMode: (mode: 'svg' | 'canvas') => void;
}

const AdaptiveQualityContext = createContext<AdaptiveQualityContextType | null>(null);

const getDeviceCapability = (): 'high' | 'medium' | 'low' => {
  // Check hardware concurrency
  const cores = navigator.hardwareConcurrency || 2;
  
  // Check memory (if available)
  const memory = (navigator as any).deviceMemory || 4;
  
  // Check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile || cores <= 2 || memory <= 2) {
    return 'low';
  } else if (cores <= 4 || memory <= 4) {
    return 'medium';
  } else {
    return 'high';
  }
};

const getQualitySettings = (capability: 'high' | 'medium' | 'low', performance: number): QualitySettings => {
  const baseSettings = {
    high: {
      renderMode: 'svg' as const,
      particleCount: 12,
      effectIntensity: 1.0,
      animationFPS: 60,
      enableFilters: true,
      enableGlow: true,
      starCount: 50,
      linkOpacity: 0.6
    },
    medium: {
      renderMode: 'svg' as const,
      particleCount: 8,
      effectIntensity: 0.7,
      animationFPS: 30,
      enableFilters: true,
      enableGlow: false,
      starCount: 25,
      linkOpacity: 0.4
    },
    low: {
      renderMode: 'canvas' as const,
      particleCount: 4,
      effectIntensity: 0.3,
      animationFPS: 20,
      enableFilters: false,
      enableGlow: false,
      starCount: 10,
      linkOpacity: 0.2
    }
  };
  
  let settings = { ...baseSettings[capability] };
  
  // Adjust based on runtime performance
  if (performance < 20) {
    settings.renderMode = 'canvas';
    settings.particleCount = Math.max(2, Math.floor(settings.particleCount * 0.5));
    settings.effectIntensity *= 0.5;
    settings.enableFilters = false;
    settings.enableGlow = false;
  } else if (performance < 40) {
    settings.particleCount = Math.floor(settings.particleCount * 0.7);
    settings.effectIntensity *= 0.8;
    settings.enableGlow = false;
  }
  
  return settings;
};

interface AdaptiveQualityManagerProps {
  children: React.ReactNode;
}

const AdaptiveQualityManager: React.FC<AdaptiveQualityManagerProps> = ({ children }) => {
  const [deviceCapability] = useState(() => getDeviceCapability());
  const [qualitySettings, setQualitySettings] = useState(() => 
    getQualitySettings(deviceCapability, 60)
  );
  const [forcedMode, setForcedMode] = useState<'svg' | 'canvas' | null>(null);

  const updateQuality = useCallback((performance: number) => {
    const newSettings = getQualitySettings(deviceCapability, performance);
    if (forcedMode) {
      newSettings.renderMode = forcedMode;
    }
    setQualitySettings(newSettings);
  }, [deviceCapability, forcedMode]);

  const forceMode = useCallback((mode: 'svg' | 'canvas') => {
    setForcedMode(mode);
    setQualitySettings(prev => ({ ...prev, renderMode: mode }));
  }, []);

  useEffect(() => {
    console.log('Device capability:', deviceCapability);
    console.log('Quality settings:', qualitySettings);
  }, [deviceCapability, qualitySettings]);

  const contextValue = {
    qualitySettings,
    deviceCapability,
    updateQuality,
    forceMode
  };

  return (
    <AdaptiveQualityContext.Provider value={contextValue}>
      {children}
    </AdaptiveQualityContext.Provider>
  );
};

export const useAdaptiveQuality = () => {
  const context = useContext(AdaptiveQualityContext);
  if (!context) {
    throw new Error('useAdaptiveQuality must be used within AdaptiveQualityManager');
  }
  return context;
};

export default AdaptiveQualityManager;
