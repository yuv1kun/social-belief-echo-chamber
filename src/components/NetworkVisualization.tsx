
import React, { useState, useRef, useCallback } from "react";
import { Network } from "@/lib/simulation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Zap, Eye } from "lucide-react";
import NetworkContainer from "./NetworkContainer";
import NetworkBackground from "./NetworkBackground";
import OptimizedConstellationBackground from "./OptimizedConstellationBackground";
import OptimizedBeliefPropagationEffects from "./OptimizedBeliefPropagationEffects";
import EnhancedPerformanceManager from "./EnhancedPerformanceManager";
import HybridNetworkRenderer from "./HybridNetworkRenderer";

interface NetworkVisualizationProps {
  network: Network;
  selectedAgentId: number | null;
  onSelectAgent: (id: number) => voi[d;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  network,
  selectedAgentId,
  onSelectAgent,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  
  console.log("NetworkVisualization: Render with network:", {
    nodes: network.nodes?.length || 0,
    links: network.links?.length || 0,
    currentTopic: network.currentTopic
  });

  const handleResize = useCallback((newDimensions: { width: number; height: number }) => {
    setDimensions(newDimensions);
  }, []);

  // Set loading to false when we have valid network data
  React.useEffect(() => {
    if (network.nodes && network.nodes.length > 0) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [network.nodes]);

  const hasValidNetwork = network.nodes && network.nodes.length > 0;

  return (
    <EnhancedPerformanceManager targetFPS={60}>
      <Card className="overflow-hidden h-full bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-cyan-400">
                <Share2 className="h-5 w-5" />
                Adaptive Network Visualization
              </CardTitle>
              <CardDescription className="text-gray-400">
                High-performance belief network simulation
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {network.currentTopic && (
              <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                <Zap className="h-3 w-3 mr-1" />
                Topic: {network.currentTopic}
              </Badge>
            )}
            {hasValidNetwork && (
              <>
                <Badge variant="default" className="bg-purple-600 text-white">
                  <Eye className="h-3 w-3 mr-1" />
                  {network.nodes.filter(n => n.believer).length} Believers
                </Badge>
                <Badge variant="secondary" className="bg-gray-600 text-white">
                  {network.nodes.filter(n => !n.believer).length} Skeptics
                </Badge>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <NetworkContainer onResize={handleResize}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
                <div className="text-cyan-400 animate-pulse">Loading Network...</div>
              </div>
            )}
            
            {!isLoading && !hasValidNetwork && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
                <div className="text-gray-400">No network data available</div>
              </div>
            )}
            
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="w-full h-full"
              style={{ display: 'block' }}
            />
            
            <OptimizedConstellationBackground 
              width={dimensions.width} 
              height={dimensions.height} 
              svgRef={svgRef}
            />
            
            <NetworkBackground 
              width={dimensions.width} 
              height={dimensions.height} 
              svgRef={svgRef}
            />
            
            {hasValidNetwork && (
              <>
                <HybridNetworkRenderer
                  network={network}
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={onSelectAgent}
                  width={dimensions.width}
                  height={dimensions.height}
                  svgRef={svgRef}
                />
                <OptimizedBeliefPropagationEffects
                  network={network}
                  svgRef={svgRef}
                />
              </>
            )}
          </NetworkContainer>
        </CardContent>
      </Card>
    </EnhancedPerformanceManager>
  );
};

export default NetworkVisualization;
