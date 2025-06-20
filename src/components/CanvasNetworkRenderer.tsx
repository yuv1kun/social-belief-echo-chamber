
import React, { useEffect, useRef, useCallback } from "react";
import { Network } from "@/lib/simulation";
import { useEnhancedPerformance } from "./EnhancedPerformanceManager";

interface CanvasNetworkRendererProps {
  network: Network;
  selectedAgentId: number | null;
  onSelectAgent: (id: number) => void;
  width: number;
  height: number;
}

const CanvasNetworkRenderer: React.FC<CanvasNetworkRendererProps> = ({
  network,
  selectedAgentId,
  onSelectAgent,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { registerAnimation, unregisterAnimation, performanceLevel } = useEnhancedPerformance();
  const nodePositionsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const animationDataRef = useRef({
    particles: [] as any[],
    waves: [] as any[],
    lastUpdate: 0
  });

  const initializeNodePositions = useCallback(() => {
    if (!network.nodes) return;
    
    network.nodes.forEach(node => {
      if (!nodePositionsRef.current.has(node.id)) {
        nodePositionsRef.current.set(node.id, {
          x: width / 2 + (Math.random() - 0.5) * 200,
          y: height / 2 + (Math.random() - 0.5) * 200
        });
      }
    });
  }, [network.nodes, width, height]);

  const getNodeSize = useCallback((traits: any) => {
    if (!traits) return 12;
    const { extraversion, neuroticism } = traits;
    const baseSize = 12;
    const sizeModifier = (extraversion * 0.3) + (neuroticism * 0.2);
    return Math.max(8, Math.min(16, baseSize + sizeModifier * 6));
  }, []);

  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: any, position: { x: number; y: number }) => {
    const size = getNodeSize(node.traits);
    const isSelected = node.id === selectedAgentId;
    
    // Outer glow
    if (performanceLevel !== 'low') {
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, size + 8);
      gradient.addColorStop(0, node.believer ? 'rgba(139, 92, 246, 0.3)' : 'rgba(148, 163, 184, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.arc(position.x, position.y, size + 8, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Main node
    ctx.beginPath();
    ctx.arc(position.x, position.y, size, 0, Math.PI * 2);
    ctx.fillStyle = node.believer ? '#8B5CF6' : '#06B6D4';
    ctx.fill();
    
    // Selection indicator
    if (isSelected) {
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Highlight
    if (performanceLevel === 'high') {
      ctx.beginPath();
      ctx.arc(position.x - 2, position.y - 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    }
    
    // Label
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.id.toString(), position.x, position.y - size - 5);
  }, [selectedAgentId, performanceLevel, getNodeSize]);

  const drawLink = useCallback((ctx: CanvasRenderingContext2D, source: { x: number; y: number }, target: { x: number; y: number }) => {
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: any) => {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.opacity;
    ctx.fill();
    ctx.globalAlpha = 1;
  }, []);

  const render = useCallback((deltaTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !network.nodes) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw links
    if (performanceLevel !== 'low' && network.links) {
      network.links.forEach(link => {
        const sourcePos = nodePositionsRef.current.get(link.source);
        const targetPos = nodePositionsRef.current.get(link.target);
        if (sourcePos && targetPos) {
          drawLink(ctx, sourcePos, targetPos);
        }
      });
    }
    
    // Draw nodes
    network.nodes.forEach(node => {
      const position = nodePositionsRef.current.get(node.id);
      if (position) {
        drawNode(ctx, node, position);
      }
    });
    
    // Draw particles (simplified)
    if (performanceLevel === 'high') {
      animationDataRef.current.particles.forEach(particle => {
        drawParticle(ctx, particle);
      });
    }
    
    // Update particles
    const now = Date.now();
    animationDataRef.current.particles = animationDataRef.current.particles.filter(particle => {
      particle.x += particle.vx * (deltaTime / 16);
      particle.y += particle.vy * (deltaTime / 16);
      particle.life -= deltaTime / 16;
      particle.opacity = Math.max(0, particle.life / particle.maxLife);
      return particle.life > 0;
    });
  }, [network, width, height, performanceLevel, drawNode, drawLink, drawParticle]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !network.nodes) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find clicked node
    for (const node of network.nodes) {
      const position = nodePositionsRef.current.get(node.id);
      if (position) {
        const distance = Math.sqrt(Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2));
        const nodeSize = getNodeSize(node.traits);
        if (distance <= nodeSize) {
          onSelectAgent(node.id);
          break;
        }
      }
    }
  }, [network.nodes, onSelectAgent, getNodeSize]);

  useEffect(() => {
    initializeNodePositions();
    
    const animationId = "canvas-network-renderer";
    const updateInterval = performanceLevel === 'low' ? 100 : performanceLevel === 'medium' ? 50 : 16;
    
    registerAnimation(animationId, render, 1, updateInterval);
    
    return () => {
      unregisterAnimation(animationId);
    };
  }, [initializeNodePositions, registerAnimation, unregisterAnimation, render, performanceLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      className="absolute inset-0 cursor-pointer"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default CanvasNetworkRenderer;
