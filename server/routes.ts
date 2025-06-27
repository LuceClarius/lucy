import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScriptSchema, insertExecutionSchema, insertScheduleSchema } from "@shared/schema";
import * as vm from "vm";
import { z } from "zod";
import multer from "multer";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) === '.js') {
      cb(null, true);
    } else {
      cb(new Error('Only .js files are allowed'));
    }
  },
  limits: {
    fileSize: 1024 * 1024, // 1MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Scripts endpoints
  app.get("/api/scripts", async (req, res) => {
    try {
      const scripts = await storage.getScripts();
      res.json(scripts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scripts" });
    }
  });

  app.get("/api/scripts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const script = await storage.getScript(id);
      if (!script) {
        return res.status(404).json({ message: "Script not found" });
      }
      res.json(script);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch script" });
    }
  });

  app.post("/api/scripts", async (req, res) => {
    try {
      const validatedData = insertScriptSchema.parse(req.body);
      
      // Check if script name already exists
      const existingScript = await storage.getScriptByName(validatedData.name);
      if (existingScript) {
        return res.status(409).json({ message: "Script with this name already exists" });
      }
      
      const script = await storage.createScript(validatedData);
      res.status(201).json(script);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid script data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create script" });
    }
  });

  app.put("/api/scripts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertScriptSchema.partial().parse(req.body);
      
      const script = await storage.updateScript(id, validatedData);
      if (!script) {
        return res.status(404).json({ message: "Script not found" });
      }
      res.json(script);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid script data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update script" });
    }
  });

  app.delete("/api/scripts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteScript(id);
      if (!deleted) {
        return res.status(404).json({ message: "Script not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete script" });
    }
  });

  // File upload endpoint
  app.post("/api/scripts/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const content = req.file.buffer.toString('utf8');
      const name = req.file.originalname;
      
      // Check if script name already exists
      const existingScript = await storage.getScriptByName(name);
      if (existingScript) {
        return res.status(409).json({ message: "Script with this name already exists" });
      }

      const script = await storage.createScript({ name, content });
      res.status(201).json(script);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload script" });
    }
  });

  // Script execution endpoint
  app.post("/api/scripts/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const script = await storage.getScript(id);
      
      if (!script) {
        return res.status(404).json({ message: "Script not found" });
      }

      const startTime = Date.now();
      let execution = await storage.createExecution({
        scriptId: id,
        status: 'running',
        output: null,
        error: null,
        duration: null,
      });

      try {
        // Create a safe execution context
        const logs: string[] = [];
        const context = {
          console: {
            log: (...args: any[]) => {
              logs.push(`[${new Date().toISOString()}] ${args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' ')}`);
            },
            error: (...args: any[]) => {
              logs.push(`[${new Date().toISOString()}] ERROR: ${args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' ')}`);
            },
            warn: (...args: any[]) => {
              logs.push(`[${new Date().toISOString()}] WARN: ${args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' ')}`);
            },
          },
          require: (module: string) => {
            // Only allow safe modules
            const allowedModules = ['path', 'util', 'crypto'];
            if (allowedModules.includes(module)) {
              return require(module);
            }
            throw new Error(`Module '${module}' is not allowed`);
          },
          setTimeout,
          clearTimeout,
          setInterval,
          clearInterval,
          Date,
          Math,
          JSON,
          Buffer,
        };

        // Execute the script in a VM context with timeout
        const vmContext = vm.createContext(context);
        const result = vm.runInContext(script.content, vmContext, {
          timeout: 30000, // 30 second timeout
          filename: script.name,
        });

        const duration = Date.now() - startTime;
        const output = logs.length > 0 ? logs.join('\n') : 'Script executed successfully (no output)';

        execution = await storage.updateExecution(execution.id, {
          status: 'success',
          output,
          duration,
        }) || execution;

        // Update script last run time
        await storage.updateScript(id, { lastRun: new Date() });

        res.json({
          executionId: execution.id,
          status: 'success',
          output,
          duration,
        });

      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        execution = await storage.updateExecution(execution.id, {
          status: 'error',
          error: errorMessage,
          duration,
        }) || execution;

        res.status(400).json({
          executionId: execution.id,
          status: 'error',
          error: errorMessage,
          duration,
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to execute script" });
    }
  });

  // Executions endpoints
  app.get("/api/executions", async (req, res) => {
    try {
      const executions = await storage.getExecutions();
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch executions" });
    }
  });

  app.get("/api/executions/script/:scriptId", async (req, res) => {
    try {
      const scriptId = parseInt(req.params.scriptId);
      const executions = await storage.getExecutionsByScript(scriptId);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch executions" });
    }
  });

  // Schedules endpoints
  app.get("/api/schedules", async (req, res) => {
    try {
      const schedules = await storage.getSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSchedule(id);
      if (!deleted) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Manual trigger endpoint for Discord bot
  app.post("/api/discord/trigger", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const lucyScheduler = await import("./lucy-scheduler");
      await lucyScheduler.triggerLucyBot();
      res.status(200).json({ message: "Discord message sent successfully" });
    } catch (error) {
      console.error("Failed to trigger Discord bot:", error);
      res.status(500).json({ message: "Failed to send Discord message", error: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
