import { WorkflowClient, WorkflowClientOptions } from '@temporalio/client'
import { workflowIdForTopic } from '../common'

type PublisherOptions =
  WorkflowClientOptions &
  {
    brokerTaskQueue: string
  }

export class Publisher {
  private client: WorkflowClient
  private brokerTaskQueue

  constructor (options: PublisherOptions) {
    this.client = new WorkflowClient(options)
    this.brokerTaskQueue = options.brokerTaskQueue
  }

  async publish(topic: string, ...payload: any[]) {
    await this.client.signalWithStart('topic', {
      signal: 'publish',
      signalArgs: payload,
      taskQueue: this.brokerTaskQueue,
      workflowId: workflowIdForTopic(topic)
    })
  }
}
