
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "@/lib/simulation";
import { Share2, TrendingUp, Users, Zap, Target, AlertTriangle } from "lucide-react";
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
} from "recharts";

interface NetworkAnalyticsProps {
  network: Network;
}

const NetworkAnalytics: React.FC<NetworkAnalyticsProps> = ({ network }) => {
  const analytics = useMemo(() => {
    const believers = network.nodes.filter(n => n.believer);
    const nonBelievers = network.nodes.filter(n => !n.believer);
    
    // Calculate influence scores
    const influenceScores = network.nodes.map(node => {
      const connections = network.links.filter(l => l.source === node.id || l.target === node.id);
      const connectedBelievers = connections.filter(l => {
        const otherId = l.source === node.id ? l.target : l.source;
        const otherNode = network.nodes.find(n => n.id === otherId);
        return otherNode?.believer;
      });
      return {
        id: node.id,
        believer: node.believer,
        connections: connections.length,
        influence: connections.length * (node.believer ? 1.2 : 0.8),
        believerConnections: connectedBelievers.length,
      };
    });

    // Network density calculation
    const maxPossibleConnections = (network.nodes.length * (network.nodes.length - 1)) / 2;
    const networkDensity = network.links.length / maxPossibleConnections;

    // Clustering coefficient (simplified)
    const avgClustering = influenceScores.reduce((acc, node) => {
      if (node.connections < 2) return acc;
      const possibleTriangles = (node.connections * (node.connections - 1)) / 2;
      return acc + (node.believerConnections / possibleTriangles);
    }, 0) / influenceScores.filter(n => n.connections >= 2).length || 0;

    // Information flow efficiency
    const flowEfficiency = believers.length > 0 ? 
      (believers.reduce((acc, b) => {
        const bInfluence = influenceScores.find(i => i.id === b.id);
        return acc + (bInfluence?.connections || 0);
      }, 0) / believers.length) / network.nodes.length : 0;

    return {
      networkDensity: networkDensity * 100,
      clusteringCoefficient: avgClustering * 100,
      influenceSpread: (believers.length / network.nodes.length) * 100,
      informationFlow: flowEfficiency * 100,
      topInfluencers: influenceScores.sort((a, b) => b.influence - a.influence).slice(0, 5),
      believerClusters: Math.ceil(believers.length / 8),
      networkResilience: (1 - (influenceScores.filter(i => i.connections > 5).length / network.nodes.length)) * 100,
    };
  }, [network]);

  const radarData = [
    { metric: 'Density', value: analytics.networkDensity, fullMark: 100 },
    { metric: 'Clustering', value: analytics.clusteringCoefficient, fullMark: 100 },
    { metric: 'Influence', value: analytics.influenceSpread, fullMark: 100 },
    { metric: 'Flow', value: analytics.informationFlow, fullMark: 100 },
    { metric: 'Resilience', value: analytics.networkResilience, fullMark: 100 },
  ];

  const scatterData = analytics.topInfluencers.map(inf => ({
    x: inf.connections,
    y: inf.influence,
    believer: inf.believer,
    id: inf.id,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Network Topology Radar */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Network Topology Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <Radar
                name="Network Metrics"
                dataKey="value"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{analytics.networkDensity.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Network Density</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{analytics.believerClusters}</div>
              <div className="text-xs text-gray-400">Belief Clusters</div>
            </div>
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
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="x" 
                name="Connections"
                stroke="#94a3b8"
                label={{ value: 'Connections', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
              />
              <YAxis 
                dataKey="y" 
                name="Influence"
                stroke="#94a3b8"
                label={{ value: 'Influence', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Scatter 
                dataKey="y" 
                fill={(entry: any) => entry.believer ? "#8B5CF6" : "#94A3B8"}
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

      {/* Key Metrics Grid */}
      <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Advanced Network Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20 text-center">
              <Users className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{analytics.topInfluencers.length}</div>
              <div className="text-xs text-gray-400">Key Influencers</div>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20 text-center">
              <Zap className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{analytics.informationFlow.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Info Flow Rate</div>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20 text-center">
              <Share2 className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{analytics.clusteringCoefficient.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Clustering Index</div>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20 text-center">
              <AlertTriangle className="h-6 w-6 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{analytics.networkResilience.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Network Resilience</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkAnalytics;
