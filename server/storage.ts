import { IStorage } from "./types";
import { User, InsertUser, Playbook, Job } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { ansibleService } from "./services/ansible";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private playbooks: Map<number, Playbook>;
  private jobs: Map<number, Job>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.playbooks = new Map();
    this.jobs = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPlaybook(playbook: Omit<Playbook, "id">): Promise<Playbook> {
    const id = this.currentId++;
    const newPlaybook = { ...playbook, id };

    // Save playbook content to Ansible directory
    await ansibleService.savePlaybook(
      `playbook_${id}`,
      playbook.content
    );

    this.playbooks.set(id, newPlaybook);
    return newPlaybook;
  }

  async updatePlaybook(id: number, playbook: Omit<Playbook, "id">): Promise<Playbook | undefined> {
    const existing = this.playbooks.get(id);
    if (!existing) return undefined;

    // Update playbook content in Ansible directory
    await ansibleService.savePlaybook(
      `playbook_${id}`,
      playbook.content
    );

    const updatedPlaybook = { ...playbook, id };
    this.playbooks.set(id, updatedPlaybook);
    return updatedPlaybook;
  }

  async deletePlaybook(id: number): Promise<boolean> {
    return this.playbooks.delete(id);
  }

  async getPlaybooks(): Promise<Playbook[]> {
    return Array.from(this.playbooks.values());
  }

  async getPlaybook(id: number): Promise<Playbook | undefined> {
    return this.playbooks.get(id);
  }

  async createJob(job: Omit<Job, "id">): Promise<Job> {
    const id = this.currentId++;
    const newJob = { ...job, id };
    this.jobs.set(id, newJob);

    // If job status is "running", execute the playbook
    if (job.status === "running") {
      const playbook = await this.getPlaybook(job.playbookId);
      if (playbook) {
        const result = await ansibleService.executePlaybook(`playbook_${playbook.id}`);
        if (!result.success) {
          // Update job status to failed if execution failed
          await this.updateJobStatus(id, "failed");
        } else {
          // Update job status to done if execution succeeded
          await this.updateJobStatus(id, "done");
        }
      }
    }

    return newJob;
  }

  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async updateJobStatus(id: number, status: string): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (job) {
      const updatedJob = { ...job, status };
      this.jobs.set(id, updatedJob);

      // If status changed to "running", execute the playbook
      if (status === "running") {
        const playbook = await this.getPlaybook(job.playbookId);
        if (playbook) {
          const result = await ansibleService.executePlaybook(`playbook_${playbook.id}`);
          if (!result.success) {
            // Update job status to failed if execution failed
            await this.updateJobStatus(id, "failed");
          } else {
            // Update job status to done if execution succeeded
            await this.updateJobStatus(id, "done");
          }
        }
      }

      return updatedJob;
    }
    return undefined;
  }

  async updateJobAssignment(id: number, assignedTo: number): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (job) {
      const updatedJob = { ...job, assignedTo };
      this.jobs.set(id, updatedJob);
      return updatedJob;
    }
    return undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async updateJobStartTime(id: number, startTime: Date): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (job) {
      const updatedJob = { ...job, startTime };
      this.jobs.set(id, updatedJob);
      return updatedJob;
    }
    return undefined;
  }
}

export const storage = new MemStorage();