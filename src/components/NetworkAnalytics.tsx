
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "@/lib/simulation";
import { Share2, TrendingUp, Users, Zap, Target, AlertTriangle, Activity, Brain } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

interface NetworkAnalyticsProps {
  network: Network;
}

const NetworkAnalytics: React.FC<NetworkAnalyticsProps> = ({ network }) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [dataFlowRate, setDataFlowRate] = useState(0);

  // Animation for data flow indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 100);
      setDataFlowRate(Math.random() * 100 + 50);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const analytics = useMemo(() => {
    const believers = network.nodes.filter(n => n.believer);
    const nonBelievers = network.nodes.filter(n => !n.believer);
    
    // Calculate advanced centrality metrics
    const centralityMetrics = network.nodes.map(node => {
      const connections = network.links.filter(l => l.source === node.id || l.target === node.id);
      const connectedNodes = connections.map(l => l.source === node.id ? l.target : l.source);
      
      // Betweenness centrality (simplified)
      let betweenness = 0;
      for (let i = 0; i < network.nodes.length; i++) {
        for (let j = i + 1; j < network.nodes.length; j++) {
          if (network.nodes[i].id !== node.id && network.nodes[j].id !== node.id) {
            // Check if node is on shortest path between i and j (simplified)
            const iConnectedToNode = connectedNodes.includes(network.nodes[i].id);
            const jConnectedToNode = connectedNodes.includes(network.nodes[j].id);
            if (iConnectedToNode && jConnectedToNode) betweenness++;
          }
        }
      }

      // Closeness centrality
      const closeness = connections.length / (network.nodes.length - 1);

      // Eigenvector centrality (simplified - based on connections to well-connected nodes)
      const eigenvector = connectedNodes.reduce((acc, connectedId) => {
        const connectedNodeLinks = network.links.filter(l => l.source === connectedId || l.target === connectedId);
        return acc + connectedNodeLinks.length;
      }, 0) / Math.max(1, connectedNodes.length);

      return {
        id: node.id,
        believer: node.believer,
        degree: connections.length,
        betweenness: betweenness / 10, // Normalized
        closeness: closeness * 100,
        eigenvector: eigenvector / 10,
        influence: connections.length * (node.believer ? 1.5 : 1.0),
      };
    });

    // Cluster detection (simplified communities)
    const clusters = [];
    const visited = new Set();
    
    believers.forEach(believer => {
      if (!visited.has(believer.id)) {
        const cluster = [];
        const queue = [believer.id];
        
        while (queue.length > 0) {
          const nodeId = queue.shift();
          if (!visited.has(nodeId)) {
            visited.add(nodeId);
            const node = network.nodes.find(n => n.id === nodeId);
            if (node?.believer) {
              cluster.push(nodeId);
              const connections = network.links
                .filter(l => l.source === nodeId || l.target === nodeId)
                .map(l => l.source === nodeId ? l.target : l.source);
              queue.push(...connections);
            }
          }
        }
        
        if (cluster.length > 1) {
          clusters.push(cluster);
        }
      }
    });

    // Information cascade metrics
    const cascadeStrength = believers.length > 0 ? 
      (network.messageLog.length / believers.length) * 100 : 0;

    const influenceHeatMap = centralityMetrics.map(metric => ({
      id: metric.id,
      heat: metric.influence * (metric.believer ? 1.2 : 0.8),
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));

    return {
      centralityMetrics,
      clusters,
      cascadeStrength,
      influenceHeatMap,
      topInfluencers: centralityMetrics.sort((a, b) => b.influence - a.influence).slice(0, 8),
      networkDensity: (network.links.length / (network.nodes.length * (network.nodes.length - 1) / 2)) * 100,
      clusterCount: clusters.length,
      avgClusterSize: clusters.length > 0 ? clusters.reduce((acc, c) => acc + c.length, 0) / clusters.length : 0,
    };
  }, [network]);

  const believerScatterData = analytics.topInfluencers
    .filter(inf => inf.believer)
    .map(inf => ({
      x: inf.degree,
      y: inf.influence,
      id: inf.id,
    }));

  const nonBelieverScatterData = analytics.topInfluencers
    .filter(inf => !inf.believer)
    .map(inf => ({
      x: inf.degree,
      y: inf.influence,
      id: inf.id,
    }));

  const centralityData = analytics.centralityMetrics.slice(0, 10).map(metric => ({
    id: metric.id,
    betweenness: metric.betweenness,
    closeness: metric.closeness,
    eigenvector: metric.eigenvector,
  }));

  const cascadeData = Array.from({ length: 20 }, (_, i) => ({
    step: i,
    cascade: Math.sin(i * 0.3 + animationStep * 0.1) * 30 + 50,
    flow: Math.cos(i * 0.2 + animationStep * 0.05) * 20 + dataFlowRate,
  }));

  return (
    <div className="space-y-6">
      {/* Data Throughput Panel */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 animate-pulse" />
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Data Throughput Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
              <div className="text-lg font-bold text-cyan-400">{dataFlowRate.toFixed(0)}</div>
              <div className="text-xs text-gray-400">Messages/Min</div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div 
                  className="bg-cyan-400 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, dataFlowRate)}%` }}
                />
              </div>
            </div>
            <div className="text-center bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
              <div className="text-lg font-bold text-purple-400">{analytics.cascadeStrength.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Cascade Power</div>
            </div>
            <div className="text-center bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
              <div className="text-lg font-bold text-green-400">{analytics.clusterCount}</div>
              <div className="text-xs text-gray-400">Active Clusters</div>
            </div>
            <div className="text-center bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
              <div className="text-lg font-bold text-yellow-400">{analytics.avgClusterSize.toFixed(1)}</div>
              <div className="text-xs text-gray-400">Avg Cluster Size</div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={cascadeData}>
              <defs>
                <linearGradient id="cascadeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="step" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Area 
                type="monotone" 
                dataKey="cascade" 
                stroke="#06b6d4" 
                fill="url(#cascadeGradient)"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="flow" 
                stroke="#8B5CF6" 
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Centrality Metrics */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Centrality Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={centralityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="id" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Line 
                  type="monotone" 
                  dataKey="betweenness" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="Betweenness"
                />
                <Line 
                  type="monotone" 
                  dataKey="closeness" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  name="Closeness"
                />
                <Line 
                  type="monotone" 
                  dataKey="eigenvector" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Eigenvector"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-2 mt-2 text-xs">
              <Badge variant="outline" className="border-purple-400 text-purple-400 bg-purple-400/10">
                Betweenness
              </Badge>
              <Badge variant="outline" className="border-cyan-400 text-cyan-400 bg-cyan-400/10">
                Closeness
              </Badge>
              <Badge variant="outline" className="border-green-400 text-green-400 bg-green-400/10">
                Eigenvector
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Influence Heat Map */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Influence Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  type="number"
                  dataKey="x" 
                  name="Connections"
                  stroke="#94a3b8"
                  label={{ value: 'Connections', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                />
                <YAxis 
                  type="number"
                  dataKey="y" 
                  name="Influence"
                  stroke="#94a3b8"
                  label={{ value: 'Influence', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Scatter 
                  data={believerScatterData}
                  fill="#8B5CF6"
                />
                <Scatter 
                  data={nonBelieverScatterData}
                  fill="#94A3B8"
                />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-4">
              <Badge variant="outline" className="border-purple-400 text-purple-400 bg-purple-400/10">
                Believers: High Influence
              </Badge>
              <Badge variant="outline" className="border-gray-400 text-gray-400 bg-gray-400/10">
                Skeptics: Variable Influence
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Detection Visualization */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Belief Community Clusters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.clusters.slice(0, 4).map((cluster, index) => (
              <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20 text-center">
                <div className="text-2xl font-bold text-cyan-400">{cluster.length}</div>
                <div className="text-xs text-gray-400">Cluster {index + 1}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {cluster.slice(0, 6).map(nodeId => (
                    <div 
                      key={nodeId} 
                      className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${nodeId * 100}ms` }}
                    />
                  ))}
                  {cluster.length > 6 && (
                    <div className="text-xs text-gray-400">+{cluster.length - 6}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {analytics.clusters.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div>No significant clusters detected</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkAnalytics;
