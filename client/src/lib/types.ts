import type { Script, Execution, Schedule } from "@shared/schema";

export interface ScriptWithExecutions extends Script {
  executions?: Execution[];
}

export interface ScheduleWithScript extends Schedule {
  script?: Script;
}

export interface ExecutionWithScript extends Execution {
  script?: Script;
}

export interface ExecutionResult {
  executionId: number;
  status: 'success' | 'error';
  output?: string;
  error?: string;
  duration: number;
}
