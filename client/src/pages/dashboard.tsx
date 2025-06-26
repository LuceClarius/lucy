import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { ScriptSidebar } from "@/components/script-sidebar";
import { CodeEditor } from "@/components/code-editor";
import { ConsoleOutput } from "@/components/console-output";
import { ExecutionHistory } from "@/components/execution-history";
import { ScheduleForm } from "@/components/schedule-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Script } from "@shared/schema";
import type { ExecutionResult } from "@/lib/types";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [lastExecution, setLastExecution] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showNewScriptDialog, setShowNewScriptDialog] = useState(false);
  const [newScriptForm, setNewScriptForm] = useState({
    name: "",
    content: "// New JavaScript file\nconsole.log('Hello, World!');"
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const createScriptMutation = useMutation({
    mutationFn: async (data: { name: string; content: string }) => {
      const response = await apiRequest('POST', '/api/scripts', data);
      return response.json();
    },
    onSuccess: (newScript) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      setSelectedScript(newScript);
      setShowNewScriptDialog(false);
      setNewScriptForm({
        name: "",
        content: "// New JavaScript file\nconsole.log('Hello, World!');"
      });
      toast({
        title: "Success",
        description: "Script created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create script",
        variant: "destructive",
      });
    },
  });

  const executeScriptMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      const response = await apiRequest('POST', `/api/scripts/${scriptId}/execute`);
      return response.json();
    },
    onMutate: () => {
      setIsRunning(true);
    },
    onSuccess: (result: ExecutionResult) => {
      setLastExecution(result);
      setIsRunning(false);
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
    },
    onError: () => {
      setIsRunning(false);
      toast({
        title: "Error",
        description: "Failed to execute script",
        variant: "destructive",
      });
    },
  });

  const handleScriptSelect = (script: Script) => {
    setSelectedScript(script);
  };

  const handleRunScript = (scriptId: number) => {
    executeScriptMutation.mutate(scriptId);
  };

  const handleExecutionComplete = (result: ExecutionResult) => {
    setLastExecution(result);
    setIsRunning(false);
  };

  const handleNewScript = () => {
    setShowNewScriptDialog(true);
  };

  const handleCreateScript = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newScriptForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Script name is required",
        variant: "destructive",
      });
      return;
    }

    // Ensure .js extension
    let scriptName = newScriptForm.name.trim();
    if (!scriptName.endsWith('.js')) {
      scriptName += '.js';
    }

    createScriptMutation.mutate({
      name: scriptName,
      content: newScriptForm.content,
    });
  };

  // Select first script if none selected and scripts are available
  if (!selectedScript && scripts.length > 0) {
    setSelectedScript(scripts[0]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNewScript={handleNewScript} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ScriptSidebar
              selectedScript={selectedScript}
              onScriptSelect={handleScriptSelect}
              onRunScript={handleRunScript}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Code Editor */}
            <CodeEditor
              scripts={scripts}
              selectedScript={selectedScript}
              onScriptSelect={handleScriptSelect}
              onExecutionComplete={handleExecutionComplete}
            />

            {/* Console Output */}
            <ConsoleOutput
              lastExecution={lastExecution}
              isRunning={isRunning}
            />

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExecutionHistory />
              <ScheduleForm scripts={scripts} />
            </div>
          </div>
        </div>
      </div>

      {/* New Script Dialog */}
      <Dialog open={showNewScriptDialog} onOpenChange={setShowNewScriptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Script</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateScript} className="space-y-4">
            <div>
              <Label htmlFor="scriptName">Script Name</Label>
              <Input
                id="scriptName"
                value={newScriptForm.name}
                onChange={(e) => setNewScriptForm({ ...newScriptForm, name: e.target.value })}
                placeholder="e.g., data-processor.js"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="scriptContent">Initial Content</Label>
              <Textarea
                id="scriptContent"
                value={newScriptForm.content}
                onChange={(e) => setNewScriptForm({ ...newScriptForm, content: e.target.value })}
                className="mt-1 font-mono text-sm"
                rows={10}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewScriptDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createScriptMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {createScriptMutation.isPending ? "Creating..." : "Create Script"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
