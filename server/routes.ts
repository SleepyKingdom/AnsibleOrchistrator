import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPlaybookSchema, insertJobSchema } from "@shared/schema";
import { ansibleService } from "./services/ansible";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get("/api/playbooks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const playbooks = await storage.getPlaybooks();
    res.json(playbooks);
  });

  app.post("/api/playbooks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertPlaybookSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(parsed.error);
    }

    // Validate Ansible playbook syntax
    try {
        const isValid = await ansibleService.validatePlaybook(parsed.data.content);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid Ansible playbook syntax" });
        }

        const playbook = await storage.createPlaybook({
            ...parsed.data,
            createdBy: req.user.id,
        });

        return res.status(201).json(playbook);
    } catch (error: any) {
        console.error("Playbook validation error:", error);
        return res.status(500).json({ message: error.message || "An error occurred while validating the playbook" });
    }
});


  app.patch("/api/playbooks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const parsed = insertPlaybookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    // Validate Ansible playbook syntax
    const isValid = await ansibleService.validatePlaybook(parsed.data.content);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid Ansible playbook syntax" });
    }

    const playbook = await storage.updatePlaybook(id, {
      ...parsed.data,
      createdBy: req.user.id,
    });
    if (!playbook) {
      return res.status(404).json({ message: "Playbook not found" });
    }
    res.json(playbook);
  });

  app.delete("/api/playbooks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const success = await storage.deletePlaybook(id);
    if (!success) {
      return res.status(404).json({ message: "Playbook not found" });
    }
    res.sendStatus(204);
  });

  app.get("/api/playbooks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const playbook = await storage.getPlaybook(parseInt(req.params.id));
    if (!playbook) {
      return res.status(404).json({ message: "Playbook not found" });
    }
    res.json(playbook);
  });

  app.get("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.post("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertJobSchema.safeParse({
      ...req.body,
      assignedTo: req.user.id,
      startTime: req.body.startTime || new Date(),
    });
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const job = await storage.createJob({
      ...parsed.data,
      createdAt: new Date(),
    });
    res.status(201).json(job);
  });

  app.patch("/api/jobs/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { status } = req.body;
    if (!["planned", "running", "done", "failed", "archived"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const job = await storage.updateJobStatus(parseInt(req.params.id), status);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  app.patch("/api/jobs/:id/assign", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { assignedTo } = req.body;
    const job = await storage.updateJobAssignment(parseInt(req.params.id), assignedTo);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const success = await storage.deleteJob(id);
    if (!success) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.sendStatus(204);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const job = await storage.getJob(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  app.patch("/api/jobs/:id/start-time", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { startTime } = req.body;
    const job = await storage.updateJobStartTime(parseInt(req.params.id), new Date(startTime));
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  const httpServer = createServer(app);
  return httpServer;
}