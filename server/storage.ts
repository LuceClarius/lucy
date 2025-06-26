import { users, scripts, executions, schedules, type User, type InsertUser, type Script, type InsertScript, type Execution, type InsertExecution, type Schedule, type InsertSchedule } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Scripts
  getScripts(): Promise<Script[]>;
  getScript(id: number): Promise<Script | undefined>;
  getScriptByName(name: string): Promise<Script | undefined>;
  createScript(script: InsertScript): Promise<Script>;
  updateScript(id: number, script: Partial<InsertScript>): Promise<Script | undefined>;
  deleteScript(id: number): Promise<boolean>;
  
  // Executions
  getExecutions(): Promise<Execution[]>;
  getExecutionsByScript(scriptId: number): Promise<Execution[]>;
  createExecution(execution: InsertExecution): Promise<Execution>;
  updateExecution(id: number, execution: Partial<InsertExecution>): Promise<Execution | undefined>;
  
  // Schedules
  getSchedules(): Promise<Schedule[]>;
  getSchedulesByScript(scriptId: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scripts: Map<number, Script>;
  private executions: Map<number, Execution>;
  private schedules: Map<number, Schedule>;
  private currentUserId: number;
  private currentScriptId: number;
  private currentExecutionId: number;
  private currentScheduleId: number;

  constructor() {
    this.users = new Map();
    this.scripts = new Map();
    this.executions = new Map();
    this.schedules = new Map();
    this.currentUserId = 1;
    this.currentScriptId = 1;
    this.currentExecutionId = 1;
    this.currentScheduleId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getScripts(): Promise<Script[]> {
    return Array.from(this.scripts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getScript(id: number): Promise<Script | undefined> {
    return this.scripts.get(id);
  }

  async getScriptByName(name: string): Promise<Script | undefined> {
    return Array.from(this.scripts.values()).find(script => script.name === name);
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    const id = this.currentScriptId++;
    const script: Script = {
      ...insertScript,
      id,
      lastRun: null,
      createdAt: new Date(),
    };
    this.scripts.set(id, script);
    return script;
  }

  async updateScript(id: number, scriptUpdate: Partial<InsertScript>): Promise<Script | undefined> {
    const script = this.scripts.get(id);
    if (!script) return undefined;
    
    const updatedScript = { ...script, ...scriptUpdate };
    this.scripts.set(id, updatedScript);
    return updatedScript;
  }

  async deleteScript(id: number): Promise<boolean> {
    return this.scripts.delete(id);
  }

  async getExecutions(): Promise<Execution[]> {
    return Array.from(this.executions.values()).sort((a, b) => 
      new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
  }

  async getExecutionsByScript(scriptId: number): Promise<Execution[]> {
    return Array.from(this.executions.values())
      .filter(execution => execution.scriptId === scriptId)
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
  }

  async createExecution(insertExecution: InsertExecution): Promise<Execution> {
    const id = this.currentExecutionId++;
    const execution: Execution = {
      ...insertExecution,
      id,
      executedAt: new Date(),
    };
    this.executions.set(id, execution);
    return execution;
  }

  async updateExecution(id: number, executionUpdate: Partial<InsertExecution>): Promise<Execution | undefined> {
    const execution = this.executions.get(id);
    if (!execution) return undefined;
    
    const updatedExecution = { ...execution, ...executionUpdate };
    this.executions.set(id, updatedExecution);
    return updatedExecution;
  }

  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedulesByScript(scriptId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(schedule => schedule.scriptId === scriptId);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentScheduleId++;
    const schedule: Schedule = {
      ...insertSchedule,
      id,
      lastRun: null,
      createdAt: new Date(),
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, scheduleUpdate: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...scheduleUpdate };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }
}

export const storage = new MemStorage();
