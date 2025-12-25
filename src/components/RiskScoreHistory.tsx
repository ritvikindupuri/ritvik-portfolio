import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface RiskScoreEntry {
  id: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  created_at: string;
}

export const RiskScoreHistory = () => {
  const [history, setHistory] = useState<RiskScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("risk_score_history")
        .select("id, risk_score, risk_level, summary, created_at")
        .order("created_at", { ascending: true })
        .limit(30);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error fetching risk score history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const chartData = history.map((entry) => ({
    date: format(new Date(entry.created_at), "MMM d, HH:mm"),
    score: entry.risk_score,
    level: entry.risk_level,
    fullDate: format(new Date(entry.created_at), "PPpp"),
  }));

  const getTrend = () => {
    if (history.length < 2) return null;
    const latest = history[history.length - 1].risk_score;
    const previous = history[history.length - 2].risk_score;
    const diff = latest - previous;
    
    if (diff > 5) return { icon: TrendingUp, label: "Increasing", color: "text-red-500" };
    if (diff < -5) return { icon: TrendingDown, label: "Decreasing", color: "text-green-500" };
    return { icon: Minus, label: "Stable", color: "text-yellow-500" };
  };

  const trend = getTrend();
  const avgScore = history.length > 0 
    ? Math.round(history.reduce((sum, h) => sum + h.risk_score, 0) / history.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 75) return "hsl(0, 84%, 60%)"; // red
    if (score >= 50) return "hsl(25, 95%, 53%)"; // orange
    if (score >= 25) return "hsl(48, 96%, 53%)"; // yellow
    return "hsl(142, 76%, 36%)"; // green
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Risk Score History
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-xs text-muted-foreground text-center py-6">
            No historical data yet. Risk scores will be recorded as you analyze security.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Risk Score History
            </CardTitle>
            <div className="flex items-center gap-4">
              {trend && (
                <div className={`flex items-center gap-1 text-xs ${trend.color}`}>
                  <trend.icon className="w-3 h-3" />
                  <span>{trend.label}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Avg: <span className="font-medium">{avgScore}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                          <p className="text-xs font-medium">{data.fullDate}</p>
                          <p className="text-sm mt-1">
                            Score: <span className="font-bold" style={{ color: getScoreColor(data.score) }}>{data.score}</span>
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            Level: {data.level}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={25} stroke="hsl(142, 76%, 36%)" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={50} stroke="hsl(48, 96%, 53%)" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={75} stroke="hsl(0, 84%, 60%)" strokeDasharray="3 3" strokeOpacity={0.5} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Low (&lt;25)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Medium (25-50)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>High (50-75)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Critical (&gt;75)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
