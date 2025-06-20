
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "@/lib/simulation";
import { Activity, Eye, Zap, Users, Share2, Target } from "lucide-react";

interface MetricsOverviewProps {
  network: Network;
  statistics: {
    totalAgents: number;
    believers: number;
    nonBelievers: number;
    believerPercentage: number;
    averageSusceptibility: number;
    averageDegree: number;
  };
}

const MetricsOverview: React.FC<MetricsOverviewProps> = ({ network, statistics }) => {
  // Calculate dynamic advanced metrics based on actual network data
  const advancedMetrics = {
    // Network efficiency based on actual connections vs possible connections
    networkEfficiency: statistics.totalAgents > 1 
      ? (network.links.length / (statistics.totalAgents * (statistics.totalAgents - 1) / 2)) * 100
      : 0,
    
    // Influence index based on believers' connectivity and percentage
    influenceIndex: statistics.totalAgents > 0 
      ? (statistics.averageDegree * statistics.believerPercentage / 100) * (statistics.believers / statistics.totalAgents)
      : 0,
    
    // Propagation rate based on actual message activity
    propagationRate: statistics.totalAgents > 0 && network.messageLog.length > 0
      ? network.messageLog.length / statistics.totalAgents
      : 0,
    
    // Social cohesion based on network density and susceptibility
    socialCohesion: statistics.totalAgents > 0
      ? ((statistics.averageSusceptibility * 100) + (network.links.length / Math.max(1, statistics.totalAgents - 1))) / 2
      : 0,
    
    // Message velocity based on recent messages (last 30 seconds)
    messageVelocity: network.messageLog.filter(m => {
      const messageTime = new Date(m.timestamp || Date.now()).getTime();
      return Date.now() - messageTime < 30000;
    }).length,
    
    // Network stability based on belief distribution balance and connections
    networkStability: statistics.totalAgents > 0
      ? Math.min(100, (100 - Math.abs(50 - statistics.believerPercentage)) + (statistics.averageDegree * 10))
      : 0,
  };

  const getMetricColor = (value: number, thresholds: [number, number]) => {
    if (value >= thresholds[1]) return "text-green-400";
    if (value >= thresholds[0]) return "text-yellow-400";
    return "text-red-400";
  };

  const getMetricBadgeColor = (value: number, thresholds: [number, number]) => {
    if (value >= thresholds[1]) return "border-green-400 text-green-400 bg-green-400/10";
    if (value >= thresholds[0]) return "border-yellow-400 text-yellow-400 bg-yellow-400/10";
    return "border-red-400 text-red-400 bg-red-400/10";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Network Efficiency */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Network Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">
            {advancedMetrics.networkEfficiency.toFixed(2)}%
          </div>
          <Badge variant="outline" className={getMetricBadgeColor(advancedMetrics.networkEfficiency, [30, 60])}>
            {advancedMetrics.networkEfficiency > 60 ? "OPTIMAL" : 
             advancedMetrics.networkEfficiency > 30 ? "MODERATE" : "LOW"}
          </Badge>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                advancedMetrics.networkEfficiency > 60 ? 'bg-green-400' : 
                advancedMetrics.networkEfficiency > 30 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(100, advancedMetrics.networkEfficiency)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Influence Index */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Influence Index
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">
            {advancedMetrics.influenceIndex.toFixed(2)}
          </div>
          <Badge variant="outline" className={getMetricBadgeColor(advancedMetrics.influenceIndex, [2, 5])}>
            {advancedMetrics.influenceIndex > 5 ? "HIGH" : 
             advancedMetrics.influenceIndex > 2 ? "MEDIUM" : "LOW"}
          </Badge>
          <div className="text-xs text-gray-400 mt-1">
            Belief Propagation Power
          </div>
        </CardContent>
      </Card>

      {/* Propagation Rate */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Propagation Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">
            {advancedMetrics.propagationRate.toFixed(1)}
          </div>
          <Badge variant="outline" className={getMetricBadgeColor(advancedMetrics.propagationRate, [1, 3])}>
            {advancedMetrics.propagationRate > 3 ? "VIRAL" : 
             advancedMetrics.propagationRate > 1 ? "ACTIVE" : "SLOW"}
          </Badge>
          <div className="text-xs text-gray-400 mt-1">
            Messages per Agent
          </div>
        </CardContent>
      </Card>

      {/* Social Cohesion */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Social Cohesion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">
            {advancedMetrics.socialCohesion.toFixed(1)}%
          </div>
          <Badge variant="outline" className={getMetricBadgeColor(advancedMetrics.socialCohesion, [40, 70])}>
            {advancedMetrics.socialCohesion > 70 ? "STRONG" : 
             advancedMetrics.socialCohesion > 40 ? "MODERATE" : "WEAK"}
          </Badge>
          <div className="text-xs text-gray-400 mt-1">
            Group Susceptibility
          </div>
        </CardContent>
      </Card>

      {/* Message Velocity */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Message Velocity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">
            {advancedMetrics.messageVelocity}
          </div>
          <Badge variant="outline" className={getMetricBadgeColor(advancedMetrics.messageVelocity, [5, 15])}>
            {advancedMetrics.messageVelocity > 15 ? "RAPID" : 
             advancedMetrics.messageVelocity > 5 ? "STEADY" : "QUIET"}
          </Badge>
          <div className="text-xs text-gray-400 mt-1">
            Recent Messages/30s
          </div>
        </CardContent>
      </Card>

      {/* Network Stability */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Network Stability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">
            {advancedMetrics.networkStability.toFixed(1)}%
          </div>
          <Badge variant="outline" className={getMetricBadgeColor(advancedMetrics.networkStability, [60, 80])}>
            {advancedMetrics.networkStability > 80 ? "STABLE" : 
             advancedMetrics.networkStability > 60 ? "VOLATILE" : "UNSTABLE"}
          </Badge>
          <div className="text-xs text-gray-400 mt-1">
            Equilibrium Index
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsOverview;
