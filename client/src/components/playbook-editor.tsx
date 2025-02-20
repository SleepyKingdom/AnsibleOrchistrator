import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Playbook } from "@shared/schema";

interface PlaybookEditorProps {
  playbook?: Playbook | null;
  onCancel?: () => void;
}

export function PlaybookEditor({ playbook, onCancel }: PlaybookEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (playbook) {
      setName(playbook.name);
      setDescription(playbook.description);
      setContent(playbook.content);
    }
  }, [playbook]);

  const createPlaybookMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; content: string }) => {
      const res = await apiRequest("POST", "/api/playbooks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      toast({
        title: "Success",
        description: "Playbook created successfully",
      });
      setName("");
      setDescription("");
      setContent("");
    },
  });

  const updatePlaybookMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description: string; content: string }) => {
      const res = await apiRequest("PATCH", `/api/playbooks/${data.id}`, {
        name: data.name,
        description: data.description,
        content: data.content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      toast({
        title: "Success",
        description: "Playbook updated successfully",
      });
      if (onCancel) onCancel();
    },
  });

  const handleSubmit = () => {
    if (playbook) {
      updatePlaybookMutation.mutate({
        id: playbook.id,
        name,
        description,
        content,
      });
    } else {
      createPlaybookMutation.mutate({ name, description, content });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <Input
          placeholder="Playbook name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder="Playbook description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!name || !description || !content}
            className="flex-1"
          >
            {playbook ? 'Update' : 'Save'} Playbook
          </Button>
          {playbook && (
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Editor
            height="400px"
            defaultLanguage="yaml"
            value={content}
            onChange={(value) => setContent(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}