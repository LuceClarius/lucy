import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileCode, Play, Trash2, Upload, Clock, X } from "lucide-react";
import type { Script, Schedule } from "@shared/schema";
import type { ScheduleWithScript } from "@/lib/types";

interface ScriptSidebarProps {
  selectedScript: Script | null;
  onScriptSelect: (script: Script) => void;
  onRunScript: (scriptId: number) => void;
}

export function ScriptSidebar({ selectedScript, onScriptSelect, onRunScript }: ScriptSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { data: scripts = [], isLoading: scriptsLoading } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest('POST', '/api/scripts/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Success",
        description: "Script uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload script",
        variant: "destructive",
      });
    },
  });

  const deleteScriptMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      await apiRequest('DELETE', `/api/scripts/${scriptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Success",
        description: "Script deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete script",
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      await apiRequest('DELETE', `/api/schedules/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.endsWith('.js')) {
      toast({
        title: "Invalid File",
        description: "Only .js files are allowed",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const formatLastRun = (lastRun: Date | null) => {
    if (!lastRun) return "Never run";
    const now = new Date();
    const diff = now.getTime() - new Date(lastRun).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Less than an hour ago";
  };

  const getFrequencyText = (frequency: string) => {
    const frequencies: Record<string, string> = {
      'hourly': 'Every hour',
      '6hourly': 'Every 6 hours',
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
    };
    return frequencies[frequency] || frequency;
  };

  const schedulesWithScripts: ScheduleWithScript[] = schedules.map(schedule => ({
    ...schedule,
    script: scripts.find(s => s.id === schedule.scriptId),
  }));

  return (
    <div className="space-y-6">
      {/* Script Library */}
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold text-gray-900">Script Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
              isDragOver
                ? "border-primary bg-blue-50"
                : "border-gray-300 hover:border-primary"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="text-gray-400 text-2xl mb-2 mx-auto" />
            <p className="text-sm text-gray-600">
              Drop .js files here or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".js"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Script List */}
          <div className="space-y-2">
            {scriptsLoading ? (
              <div className="text-sm text-gray-500">Loading scripts...</div>
            ) : scripts.length === 0 ? (
              <div className="text-sm text-gray-500">No scripts uploaded yet</div>
            ) : (
              scripts.map((script) => (
                <div
                  key={script.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                    selectedScript?.id === script.id
                      ? "bg-blue-50 border-primary border"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => onScriptSelect(script)}
                >
                  <div className="flex items-center space-x-3">
                    <FileCode className="text-primary h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {script.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last run: {formatLastRun(script.lastRun)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunScript(script.id);
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScriptMutation.mutate(script.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold text-gray-900">Scheduled Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedulesWithScripts.length === 0 ? (
            <div className="text-sm text-gray-500">No scheduled tasks</div>
          ) : (
            schedulesWithScripts.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {schedule.script?.name || "Unknown script"}
                  </p>
                  <p className="text-xs text-green-600">
                    {getFrequencyText(schedule.frequency)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={schedule.enabled ? "default" : "secondary"}>
                    <Clock className="h-3 w-3 mr-1" />
                    {schedule.enabled ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
