import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { PlaybookEditor } from "@/components/playbook-editor";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Playbook } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Edit, Trash2, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PlaybooksPage() {
  const [search, setSearch] = useState("");
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [, setLocation] = useLocation();

  const { data: playbooks = [] } = useQuery<Playbook[]>({
    queryKey: ["/api/playbooks"],
  });
  const { toast } = useToast();

  const createJobMutation = useMutation({
    mutationFn: async (playbookId: number) => {
      const res = await apiRequest("POST", "/api/jobs", {
        playbookId,
        status: "planned",
      });
      return res.json();
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      setLocation(`/jobs/${job.id}`);
    },
  });

  const deletePlaybookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/playbooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      toast({
        title: "Success",
        description: "Playbook deleted successfully",
      });
    },
  });

  const handleRunPlaybook = (playbookId: number) => {
    createJobMutation.mutate(playbookId);
  };

  const filteredPlaybooks = playbooks.filter(playbook =>
    playbook.name.toLowerCase().includes(search.toLowerCase()) ||
    playbook.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingPlaybook ? 'Edit Playbook' : 'Create New Playbook'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlaybookEditor
                playbook={editingPlaybook}
                onCancel={() => setEditingPlaybook(null)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Playbooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search playbooks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-4">
                  {filteredPlaybooks.map((playbook) => (
                    <div
                      key={playbook.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{playbook.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {playbook.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRunPlaybook(playbook.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPlaybook(playbook)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePlaybookMutation.mutate(playbook.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}