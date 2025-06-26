import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import type { Execution, Script } from "@shared/schema";

export function ExecutionHistory() {
  const { data: executions = [] } = useQuery<Execution[]>({
    queryKey: ["/api/executions"],
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Less than an hour ago";
  };

  const getScriptName = (scriptId: number) => {
    const script = scripts.find(s => s.id === scriptId);
    return script?.name || "Unknown script";
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return "N/A";
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-gray-900">Recent Executions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {executions.length === 0 ? (
          <div className="text-sm text-gray-500">No executions yet</div>
        ) : (
          executions.slice(0, 10).map((execution) => (
            <div
              key={execution.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  execution.status === 'success' 
                    ? 'bg-green-500' 
                    : execution.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}>
                  {execution.status === 'success' ? (
                    <Check className="text-white h-4 w-4" />
                  ) : execution.status === 'error' ? (
                    <X className="text-white h-4 w-4" />
                  ) : (
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getScriptName(execution.scriptId)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(execution.executedAt)}
                  </p>
                </div>
              </div>
              <div className="text-xs">
                {execution.status === 'error' ? (
                  <Badge variant="destructive">Failed</Badge>
                ) : (
                  <span className="text-gray-500">
                    {formatDuration(execution.duration)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
