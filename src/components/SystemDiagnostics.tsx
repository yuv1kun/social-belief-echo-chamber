
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, Zap, Wifi, Clock, Database } from "lucide-react";

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  messageQueue: number;
  apiCalls: number;
  uptime: number;
}

const SystemDiagnostics: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    networkLatency: 0,
    messageQueue: 0,
    apiCalls: 0,
    uptime: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpuUsage: Math.max(10, Math.min(95, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 8)),
        networkLatency: Math.max(5, Math.min(150, prev.networkLatency + (Math.random() - 0.5) * 20)),
        messageQueue: Math.max(0, Math.min(50, prev.messageQueue + Math.floor((Math.random() - 0.5) * 5))),
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 3),
        uptime: prev.uptime + 1,
      }));
    }, 2000);

    // Initialize with some values
    setMetrics({
      cpuUsage: 35 + Math.random() * 20,
      memoryUsage: 45 + Math.random() * 15,
      networkLatency: 20 + Math.random() * 30,
      messageQueue: Math.floor(Math.random() * 10),
      apiCalls: Math.floor(Math.random() * 100),
      uptime: Math.floor(Date.now() / 1000),
    });

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return "text-green-400";
    if (value < thresholds[1]) return "text-yellow-400";
    return "text-red-400";
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Diagnostics
          <Badge variant="outline" className="border-green-400 text-green-400 bg-green-400/10">
            ONLINE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* CPU Usage */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-300">CPU</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.cpuUsage.toFixed(1)}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.cpuUsage < 50 ? 'bg-green-400' : 
                  metrics.cpuUsage < 80 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${metrics.cpuUsage}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-300">Memory</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.memoryUsage.toFixed(1)}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  metrics.memoryUsage < 60 ? 'bg-green-400' : 
                  metrics.memoryUsage < 80 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${metrics.memoryUsage}%` }}
              />
            </div>
          </div>

          {/* Network Latency */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-300">Latency</span>
            </div>
            <div className={`text-lg font-bold ${getStatusColor(metrics.networkLatency, [50, 100])}`}>
              {metrics.networkLatency.toFixed(0)}ms
            </div>
            <div className="text-xs text-gray-400">Network Delay</div>
          </div>

          {/* Message Queue */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-300">Queue</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.messageQueue}</div>
            <div className="text-xs text-gray-400">Pending Messages</div>
          </div>

          {/* API Calls */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-300">API Calls</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.apiCalls}</div>
            <div className="text-xs text-gray-400">Total Requests</div>
          </div>

          {/* Uptime */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-300">Uptime</span>
            </div>
            <div className="text-lg font-bold text-green-400">{formatUptime(metrics.uptime)}</div>
            <div className="text-xs text-gray-400">Session Duration</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemDiagnostics;
