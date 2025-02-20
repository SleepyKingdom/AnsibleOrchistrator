import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Job, User, Playbook } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlayCircle } from "lucide-react";

export default function JobDetailPage() {
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const jobId = parseInt(params.get("id") || "0");

  const { data: job } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
  });

  const { data: playbook } = useQuery<Playbook>({
    queryKey: [`/api/playbooks/${job?.playbookId}`],
    enabled: !!job?.playbookId,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const startJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}/status`, {
        status: "running",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      toast({
        title: "Success",
        description: "Job started successfully",
      });
    },
  });

  const assignJobMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}/assign`, {
        assignedTo: userId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      toast({
        title: "Success",
        description: "Job reassigned successfully",
      });
    },
  });

  const updateStartTimeMutation = useMutation({
    mutationFn: async (startTime: string) => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}/start-time`, {
        startTime,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      toast({
        title: "Success",
        description: "Start time updated successfully",
      });
    },
  });

  const assignedUser = users.find(u => u.id === job?.assignedTo);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-yellow-100 text-yellow-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!job || !playbook) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Playbook</h3>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">Name: {playbook.name}</p>
                <p className="text-sm text-muted-foreground">Description: {playbook.description}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Status</h3>
              <div className="mt-2 flex items-center gap-4">
                <Badge className={getStatusColor(job.status)}>
                  {job.status}
                </Badge>
                {job.status === 'planned' && (
                  <Button 
                    size="sm"
                    onClick={() => startJobMutation.mutate()}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Now
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Assigned To</h3>
              <div className="mt-2">
                {job.status === 'planned' ? (
                  <Select
                    value={job.assignedTo.toString()}
                    onValueChange={(value) => assignJobMutation.mutate(parseInt(value))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue>{assignedUser?.username}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">{assignedUser?.username}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Start Time</h3>
              {job.status === 'planned' ? (
                <Input
                  type="datetime-local"
                  value={job.startTime ? new Date(job.startTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateStartTimeMutation.mutate(e.target.value)}
                  className="w-[200px] mt-2"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  {job.startTime ? new Date(job.startTime).toLocaleString() : 'Started immediately'}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium">Created At</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}