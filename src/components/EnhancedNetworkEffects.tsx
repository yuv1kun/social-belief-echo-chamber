
import React from "react";

interface EnhancedNetworkEffectsProps {
  svgRef: React.RefObject<SVGSVGElement>;
}

const EnhancedNetworkEffects: React.FC<EnhancedNetworkEffectsProps> = ({ svgRef }) => {
  React.useEffect(() => {
    if (!svgRef.current) return;

    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current);
      
      // Remove existing defs if they exist
      svg.select("defs").remove();
      
      // Create enhanced visual effects
      const defs = svg.append("defs");

      // Enhanced holographic glow
      const holographicFilter = defs.append("filter")
        .attr("id", "holographicGlow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");

      holographicFilter.append("feGaussianBlur")
        .attr("stdDeviation", "3")
        .attr("result", "coloredBlur");

      const holographicMerge = holographicFilter.append("feMerge");
      holographicMerge.append("feMergeNode").attr("in", "coloredBlur");
      holographicMerge.append("feMergeNode").attr("in", "SourceGraphic");

      // Particle glow effect
      const particleFilter = defs.append("filter")
        .attr("id", "particleGlow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");

      particleFilter.append("feGaussianBlur")
        .attr("stdDeviation", "2")
        .attr("result", "particleBlur");

      const particleMerge = particleFilter.append("feMerge");
      particleMerge.append("feMergeNode").attr("in", "particleBlur");
      particleMerge.append("feMergeNode").attr("in", "SourceGraphic");

      // Pulsing glow for active agents
      const pulseFilter = defs.append("filter")
        .attr("id", "pulseGlow")
        .attr("x", "-100%")
        .attr("y", "-100%")
        .attr("width", "300%")
        .attr("height", "300%");

      pulseFilter.append("feGaussianBlur")
        .attr("stdDeviation", "5")
        .attr("result", "pulseBlur");

      pulseFilter.append("feColorMatrix")
        .attr("in", "pulseBlur")
        .attr("type", "matrix")
        .attr("values", "1 0 1 0 0  0 1 1 0 0  1 0 1 0 0  0 0 0 1 0")
        .attr("result", "pulseColor");

      const pulseMerge = pulseFilter.append("feMerge");
      pulseMerge.append("feMergeNode").attr("in", "pulseColor");
      pulseMerge.append("feMergeNode").attr("in", "SourceGraphic");

      // Gradient definitions for enhanced styling
      const believerGradient = defs.append("radialGradient")
        .attr("id", "believerGradient")
        .attr("cx", "30%")
        .attr("cy", "30%");

      believerGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#A855F7")
        .attr("stop-opacity", 1);

      believerGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#7C3AED");

      const skepticGradient = defs.append("radialGradient")
        .attr("id", "skepticGradient")
        .attr("cx", "30%")
        .attr("cy", "30%");

      skepticGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#E2E8F0")
        .attr("stop-opacity", 1);

      skepticGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#94A3B8");

      // Animated background pattern
      const pattern = defs.append("pattern")
        .attr("id", "networkPattern")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 100)
        .attr("height", 100)
        .attr("patternUnits", "userSpaceOnUse");

      pattern.append("circle")
        .attr("cx", 50)
        .attr("cy", 50)
        .attr("r", 1)
        .attr("fill", "#06B6D4")
        .attr("opacity", 0.1);
    });
  }, [svgRef]);

  return null;
};

export default EnhancedNetworkEffects;
