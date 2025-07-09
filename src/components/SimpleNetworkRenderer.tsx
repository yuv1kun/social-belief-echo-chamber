import React, { useEffect, useRef, useCallback } from "react";
import { Network } from "@/lib/simulation";

interface SimpleNetworkRendererProps {
  network: Network;
  selectedAgentId: number | null;
  onSelectAgent: (id: number) => void;
  width: number;
  height: number;
  svgRef: React.RefObject<SVGSVGElement>;
}

const SimpleNetworkRenderer: React.FC<SimpleNetworkRendererProps> = ({
  network,
  selectedAgentId,
  onSelectAgent,
  width,
  height,
  svgRef,
}) => {
  const nodePositionsRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const initializeNodePositions = useCallback(() => {
    if (!network.nodes) return;
    
    network.nodes.forEach(node => {
      if (!nodePositionsRef.current.has(node.id)) {
        nodePositionsRef.current.set(node.id, {
          x: width / 2 + (Math.random() - 0.5) * Math.min(width, height) * 0.6,
          y: height / 2 + (Math.random() - 0.5) * Math.min(width, height) * 0.6
        });
      }
    });
  }, [network.nodes, width, height]);

  const getNodeSize = useCallback((traits: any) => {
    if (!traits) return 8;
    const { extraversion, neuroticism } = traits;
    const baseSize = 8;
    const sizeModifier = (extraversion * 0.2) + (neuroticism * 0.1);
    return Math.max(6, Math.min(12, baseSize + sizeModifier * 4));
  }, []);

  const handleNodeClick = useCallback((event: React.MouseEvent, nodeId: number) => {
    event.stopPropagation();
    onSelectAgent(nodeId);
  }, [onSelectAgent]);

  useEffect(() => {
    if (!svgRef.current || !network.nodes) return;

    initializeNodePositions();

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Clear previous content
      svg.selectAll(".simple-network").remove();
      
      const networkGroup = svg.append("g").attr("class", "simple-network");

      // Draw links
      if (network.links) {
        const links = networkGroup.selectAll(".link")
          .data(network.links)
          .join("line")
          .attr("class", "link")
          .attr("x1", (d: any) => nodePositionsRef.current.get(d.source)?.x || 0)
          .attr("y1", (d: any) => nodePositionsRef.current.get(d.source)?.y || 0)
          .attr("x2", (d: any) => nodePositionsRef.current.get(d.target)?.x || 0)
          .attr("y2", (d: any) => nodePositionsRef.current.get(d.target)?.y || 0)
          .attr("stroke", "#06B6D4")
          .attr("stroke-opacity", 0.3)
          .attr("stroke-width", 1);
      }

      // Draw nodes
      const nodes = networkGroup.selectAll(".node")
        .data(network.nodes)
        .join("g")
        .attr("class", "node")
        .attr("transform", (d: any) => {
          const pos = nodePositionsRef.current.get(d.id);
          return `translate(${pos?.x || 0}, ${pos?.y || 0})`;
        })
        .style("cursor", "pointer")
        .on("click", (event, d: any) => handleNodeClick(event, d.id));

      // Node circles
      nodes.append("circle")
        .attr("r", (d: any) => getNodeSize(d.traits))
        .attr("fill", (d: any) => d.believer ? "#8B5CF6" : "#06B6D4")
        .attr("stroke", (d: any) => d.id === selectedAgentId ? "#F97316" : "#1a1a1a")
        .attr("stroke-width", (d: any) => d.id === selectedAgentId ? 2 : 1);

      // Node labels
      nodes.append("text")
        .attr("dy", (d: any) => -getNodeSize(d.traits) - 4)
        .attr("text-anchor", "middle")
        .attr("fill", "#06B6D4")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .text((d: any) => d.id);
    });
  }, [network, width, height, selectedAgentId, initializeNodePositions, getNodeSize, handleNodeClick]);

  return null;
};

export default SimpleNetworkRenderer;