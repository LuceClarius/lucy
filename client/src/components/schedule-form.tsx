import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Script } from "@shared/schema";

interface ScheduleFormProps {
  scripts: Script[];
}

export function ScheduleForm({ scripts }: ScheduleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    scriptId: "",
    frequency: "",
    startTime: "",
    enabled: true,
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/schedules', {
        scriptId: parseInt(data.scriptId),
        frequency: data.frequency,
        startTime: new Date(data.startTime),
        enabled: data.enabled,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
      setFormData({
        scriptId: "",
        frequency: "",
        startTime: "",
        enabled: true,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create schedule",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.scriptId || !formData.frequency || !formData.startTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createScheduleMutation.mutate(formData);
  };

  // Set default start time to current time
  const getDefaultStartTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-gray-900">Schedule Automation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="script" className="block text-sm font-medium text-gray-700 mb-2">
              Select Script
            </Label>
            <Select
              value={formData.scriptId}
              onValueChange={(value) => setFormData({ ...formData, scriptId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a script" />
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

          <div>
            <Label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
              Execution Frequency
            </Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every hour</SelectItem>
                <SelectItem value="6hourly">Every 6 hours</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </Label>
            <Input
              type="datetime-local"
              id="startTime"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              min={getDefaultStartTime()}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, enabled: checked as boolean })
              }
            />
            <Label htmlFor="enabled" className="text-sm text-gray-700">
              Enable immediately
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-blue-700"
            disabled={createScheduleMutation.isPending}
          >
            {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
