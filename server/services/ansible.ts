import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { log } from "../vite";

interface AnsibleResult {
  success: boolean;
  output: string;
  error?: string;
}

export class AnsibleService {
  private playbookDir: string;
  private inventoryPath: string;

  constructor() {
    // Use absolute paths to ensure correct file locations
    this.playbookDir = path.join(process.cwd(), "ansible", "playbooks");
    this.inventoryPath = path.join(process.cwd(), "ansible", "inventory.ini");
    this.initializeAnsibleDirectory();
  }

  private async initializeAnsibleDirectory() {
    try {
      // Create ansible directory structure with recursive option
      await fs.mkdir(this.playbookDir, { recursive: true });

      // Create default inventory file if it doesn't exist
      try {
        await fs.access(this.inventoryPath);
      } catch {
        // Ensure the parent directory exists
        await fs.mkdir(path.dirname(this.inventoryPath), { recursive: true });
        await fs.writeFile(this.inventoryPath, `[local]\nlocalhost ansible_connection=local\n`);
        log("Created default inventory file", "ansible");
      }

      log("Ansible directory initialized successfully", "ansible");
    } catch (error) {
      log(`Error initializing Ansible directory: ${error}`, "ansible");
      throw new Error(`Failed to initialize Ansible directory: ${error}`);
    }
  }

  async savePlaybook(name: string, content: string): Promise<boolean> {
    try {
      const playbookPath = path.join(this.playbookDir, `${name}.yml`);

      // Ensure the directory exists
      await fs.mkdir(this.playbookDir, { recursive: true });

      // Write the playbook file
      await fs.writeFile(playbookPath, content);
      log(`Playbook saved successfully: ${name}`, "ansible");
      return true;
    } catch (error) {
      log(`Error saving playbook: ${error}`, "ansible");
      return false;
    }
  }

  async executePlaybook(playbookName: string): Promise<AnsibleResult> {
    const playbookPath = path.join(this.playbookDir, `${playbookName}.yml`);

    try {
      // Check if playbook exists
      await fs.access(playbookPath);
    } catch {
      log(`Playbook not found: ${playbookPath}`, "ansible");
      return { 
        success: false, 
        output: "", 
        error: "Playbook file not found" 
      };
    }

    log(`Executing playbook: ${playbookName}`, "ansible");

    return new Promise((resolve) => {
      const ansible = spawn("ansible-playbook", [
        "-i",
        this.inventoryPath,
        playbookPath,
        // Add verbose output for better debugging
        "-v"
      ]);

      let output = "";
      let error = "";

      ansible.stdout.on("data", (data) => {
        const chunk = data.toString();
        output += chunk;
        log(`Playbook output: ${chunk.trim()}`, "ansible");
      });

      ansible.stderr.on("data", (data) => {
        const chunk = data.toString();
        error += chunk;
        log(`Playbook error: ${chunk.trim()}`, "ansible");
      });

      ansible.on("close", (code) => {
        if (code === 0) {
          log(`Playbook executed successfully: ${playbookName}`, "ansible");
          resolve({ success: true, output });
        } else {
          log(`Playbook execution failed: ${playbookName}`, "ansible");
          resolve({ success: false, output, error });
        }
      });
    });
  }

  async validatePlaybook(content: string): Promise<boolean> {
    try {
      const tempPath = path.join(this.playbookDir, "_validate.yml");

      // Ensure the directory exists
      await fs.mkdir(this.playbookDir, { recursive: true });

      // Write the temporary playbook file
      await fs.writeFile(tempPath, content);

      log("Validating playbook syntax", "ansible");

      return new Promise((resolve) => {
        const ansible = spawn("ansible-playbook", [
          "--syntax-check",
          "-i",
          this.inventoryPath,
          tempPath,
        ]);

        let error = "";

        ansible.stderr.on("data", (data) => {
          error += data.toString();
          log(`Validation error: ${data.toString().trim()}`, "ansible");
        });

        ansible.on("close", async (code) => {
          try {
            await fs.unlink(tempPath);
            log("Temporary validation file removed", "ansible");
          } catch (error) {
            log(`Error removing temp file: ${error}`, "ansible");
          }

          if (code === 0) {
            log("Playbook validation successful", "ansible");
          } else {
            log(`Playbook validation failed: ${error}`, "ansible");
          }

          resolve(code === 0);
        });
      });
    } catch (error) {
      log(`Error validating playbook: ${error}`, "ansible");
      return false;
    }
  }
}

export const ansibleService = new AnsibleService();