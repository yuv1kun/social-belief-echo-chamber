
import React, { useState, useEffect } from "react";
import { Network } from "@/lib/simulation";
import { useAdaptiveQuality } from "./AdaptiveQualityManager";
import D3NetworkRenderer from "./D3NetworkRenderer";
import CanvasNetworkRenderer from "./CanvasNetworkRenderer";

interface HybridNetworkRendererProps {
  network: Network;
  selectedAgentId: number | null;
  onSelectAgent: (id: number) => void;
  width: number;
  height: number;
  svgRef: React.RefObject<SVGSVGElement>;
}

const HybridNetworkRenderer: React.FC<HybridNetworkRendererProps> = ({
  network,
  selectedAgentId,
  onSelectAgent,
  width,
  height,
  svgRef,
}) => {
  const { qualitySettings, deviceCapability } = useAdaptiveQuality();
  const [renderMode, setRenderMode] = useState<'svg' | 'canvas'>('svg');

  useEffect(() => {
    setRenderMode(qualitySettings.renderMode);
  }, [qualitySettings.renderMode]);

  // Determine if we should use canvas based on network size
  const shouldUseCanvas = network.nodes && network.nodes.length > 100;

  useEffect(() => {
    if (shouldUseCanvas && renderMode === 'svg') {
      console.log('Switching to Canvas mode due to large network size');
      setRenderMode('canvas');
    }
  }, [shouldUseCanvas, renderMode]);

  if (renderMode === 'canvas') {
    return (
      <div className="relative w-full h-full">
        <CanvasNetworkRenderer
          network={network}
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
          width={width}
          height={height}
        />
        {/* Quality indicator */}
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          Canvas Mode ({deviceCapability})
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <D3NetworkRenderer
        network={network}
        selectedAgentId={selectedAgentId}
        onSelectAgent={onSelectAgent}
        width={width}
        height={height}
        svgRef={svgRef}
      />
      {/* Quality indicator */}
      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
        SVG Mode ({deviceCapability})
      </div>
    </div>
  );
};

export default HybridNetworkRenderer;
