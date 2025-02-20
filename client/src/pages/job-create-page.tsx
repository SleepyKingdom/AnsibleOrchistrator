import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Job, User, Playbook } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function JobCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const playbookId = parseInt(params.get("playbookId") || "0");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");

  const { data: playbook } = useQuery<Playbook>({
    queryKey: [`/api/playbooks/${playbookId}`],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: { playbookId: number; assignedTo: number; startTime: string }) => {
      const res = await apiRequest("POST", "/api/jobs", {
        ...data,
        status: "planned",
      });
      return res.json();
    },
    onSuccess: (job: Job) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      setLocation(`/jobs/${job.id}`);
    },
  });

  if (!playbook) {
    return <div>Loading...</div>;
  }

  const handleSubmit = () => {
    if (!selectedUser || !startTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createJobMutation.mutate({
      playbookId,
      assignedTo: parseInt(selectedUser),
      startTime: new Date(startTime).toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Playbook Details</h3>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">Name: {playbook.name}</p>
                <p className="text-sm text-muted-foreground">Description: {playbook.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full">
                Create Job
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}