import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Save } from "lucide-react";
import type { Script } from "@shared/schema";
import type { ExecutionResult } from "@/lib/types";

interface CodeEditorProps {
  scripts: Script[];
  selectedScript: Script | null;
  onScriptSelect: (script: Script) => void;
  onExecutionComplete: (result: ExecutionResult) => void;
}

declare global {
  interface Window {
    monaco: any;
  }
}

export function CodeEditor({ scripts, selectedScript, onScriptSelect, onExecutionComplete }: CodeEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<any>(null);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  useEffect(() => {
    // Load Monaco Editor
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
    script.onload = () => {
      if (window.monaco) {
        setIsMonacoLoaded(true);
        initializeEditor();
      } else {
        // @ts-ignore
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
        // @ts-ignore
        require(['vs/editor/editor.main'], () => {
          setIsMonacoLoaded(true);
          initializeEditor();
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedScript && monacoEditorRef.current) {
      monacoEditorRef.current.setValue(selectedScript.content);
      setEditorContent(selectedScript.content);
    }
  }, [selectedScript]);

  const initializeEditor = () => {
    if (!editorRef.current || !window.monaco) return;

    monacoEditorRef.current = window.monaco.editor.create(editorRef.current, {
      value: selectedScript?.content || '// Welcome to JS Script Runner\n// Write your JavaScript code here\n\nconsole.log("Hello, World!");',
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: 'Fira Code, monospace',
      scrollBeyondLastLine: false,
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
    });

    monacoEditorRef.current.onDidChangeModelContent(() => {
      setEditorContent(monacoEditorRef.current.getValue());
    });
  };

  const saveScriptMutation = useMutation({
    mutationFn: async () => {
      if (!selectedScript) throw new Error("No script selected");
      
      const response = await apiRequest('PUT', `/api/scripts/${selectedScript.id}`, {
        content: editorContent,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Success",
        description: "Script saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save script",
        variant: "destructive",
      });
    },
  });

  const runScriptMutation = useMutation({
    mutationFn: async () => {
      if (!selectedScript) throw new Error("No script selected");
      
      // Save first if there are changes
      if (editorContent !== selectedScript.content) {
        await apiRequest('PUT', `/api/scripts/${selectedScript.id}`, {
          content: editorContent,
        });
      }
      
      const response = await apiRequest('POST', `/api/scripts/${selectedScript.id}/execute`);
      return response.json();
    },
    onSuccess: (result: ExecutionResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      onExecutionComplete(result);
      
      toast({
        title: result.status === 'success' ? "Execution Complete" : "Execution Failed",
        description: result.status === 'success' 
          ? `Script executed in ${result.duration}ms`
          : "Check console output for details",
        variant: result.status === 'success' ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to execute script",
        variant: "destructive",
      });
    },
  });

  const handleScriptChange = (scriptId: string) => {
    const script = scripts.find(s => s.id === parseInt(scriptId));
    if (script) {
      onScriptSelect(script);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="font-semibold text-gray-900">Code Editor</CardTitle>
            <Select
              value={selectedScript?.id.toString() || ""}
              onValueChange={handleScriptChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a script" />
              </SelectTrigger>
              <SelectContent>
                {scripts.map((script) => (
                  <SelectItem key={script.id} value={script.id.toString()}>
                    {script.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => runScriptMutation.mutate()}
              disabled={!selectedScript || runScriptMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="mr-2 h-4 w-4" />
              {runScriptMutation.isPending ? "Running..." : "Run Script"}
            </Button>
            <Button
              onClick={() => saveScriptMutation.mutate()}
              disabled={!selectedScript || saveScriptMutation.isPending}
              variant="outline"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveScriptMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!isMonacoLoaded ? (
          <div className="bg-gray-900 text-gray-100 p-6 min-h-96 flex items-center justify-center">
            <div className="text-gray-400">Loading editor...</div>
          </div>
        ) : (
          <div ref={editorRef} className="min-h-96" />
        )}
      </CardContent>
    </Card>
  );
}
