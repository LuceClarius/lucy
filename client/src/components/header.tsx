import { Button } from "@/components/ui/button";
import { Code, Plus, User, MessageCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  onNewScript: () => void;
}

export function Header({ onNewScript }: HeaderProps) {
  const { toast } = useToast();

  const triggerDiscordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/discord/trigger');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Discord message sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send Discord message",
        variant: "destructive",
      });
    },
  });

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Code className="text-primary text-2xl" />
            <h1 className="text-xl font-semibold text-gray-900">JS Script Runner</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => triggerDiscordMutation.mutate()}
              disabled={triggerDiscordMutation.isPending}
              variant="outline"
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {triggerDiscordMutation.isPending ? "Sending..." : "Send Discord Message"}
            </Button>
            <Button onClick={onNewScript} className="bg-primary text-white hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Script
            </Button>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
