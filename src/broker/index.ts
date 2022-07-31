import { Worker, WorkerOptions } from '@temporalio/worker'

export class Broker {
  static async create (taskQueue: string, options: Partial<WorkerOptions> = {}) {
    return Worker.create({
      ...options,
      workflowsPath: require.resolve('./workflows'),
      taskQueue
    })
  }
}
