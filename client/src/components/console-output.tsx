import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { ExecutionResult } from "@/lib/types";

interface ConsoleOutputProps {
  lastExecution: ExecutionResult | null;
  isRunning: boolean;
}

export function ConsoleOutput({ lastExecution, isRunning }: ConsoleOutputProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lastExecution]);

  const clearConsole = () => {
    // This would clear the console in a real implementation
    console.clear();
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return (
        <Badge className="bg-yellow-500">
          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
          Running
        </Badge>
      );
    }
    
    if (!lastExecution) {
      return (
        <Badge variant="secondary">
          <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
          Ready
        </Badge>
      );
    }

    return (
      <Badge variant={lastExecution.status === 'success' ? 'default' : 'destructive'}>
        <div className={`w-2 h-2 rounded-full mr-2 ${
          lastExecution.status === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        {lastExecution.status === 'success' ? 'Success' : 'Error'}
      </Badge>
    );
  };

  const formatOutput = () => {
    if (isRunning) {
      return (
        <div className="space-y-1">
          <div className="text-blue-400">[{new Date().toLocaleString()}] Script execution started...</div>
          <div className="text-gray-500 animate-pulse">_</div>
        </div>
      );
    }

    if (!lastExecution) {
      return (
        <div className="space-y-1">
          <div className="text-gray-500">Console ready. Run a script to see output.</div>
          <div className="text-gray-500">_</div>
        </div>
      );
    }

    const timestamp = new Date().toLocaleString();
    
    if (lastExecution.status === 'error') {
      return (
        <div className="space-y-1">
          <div className="text-blue-400">[{timestamp}] Script execution started...</div>
          <div className="text-red-400">[{timestamp}] ✗ Execution failed</div>
          <div className="text-red-300">[{timestamp}] {lastExecution.error}</div>
          <div className="text-blue-400">[{timestamp}] Execution time: {lastExecution.duration}ms</div>
          <div className="text-gray-500">_</div>
        </div>
      );
    }

    const outputLines = lastExecution.output?.split('\n') || [];
    
    return (
      <div className="space-y-1">
        <div className="text-blue-400">[{timestamp}] Script execution started...</div>
        {outputLines.map((line, index) => (
          <div key={index} className="text-gray-300">{line}</div>
        ))}
        <div className="text-green-400">[{timestamp}] ✓ Script execution completed successfully</div>
        <div className="text-blue-400">[{timestamp}] Execution time: {lastExecution.duration}ms</div>
        <div className="text-gray-500">_</div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold text-gray-900">Console Output</CardTitle>
          <div className="flex items-center space-x-3">
            {getStatusBadge()}
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-gray-600"
              onClick={clearConsole}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={outputRef}
          className="bg-gray-900 text-gray-100 font-mono text-sm p-6 min-h-64 max-h-96 overflow-auto"
        >
          {formatOutput()}
        </div>
      </CardContent>
    </Card>
  );
}
