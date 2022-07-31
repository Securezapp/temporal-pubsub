import { Connection, WorkflowClient } from '@temporalio/client'
import { UntypedActivities } from '@temporalio/common'
import { Worker, WorkerOptions } from '@temporalio/worker'
import { nanoid } from 'nanoid'

import type { topic as TopicWorkflow, SubscribeInput } from '../broker/workflows'

import { workflowIdForTopic } from '../common'

export type SubscriberOptions =
  Omit<WorkerOptions, 'activities' | 'taskQueue' | 'workflowsPath' | 'workflowBundle' | 'interceptors'> &
  {
    brokerTaskQueue: string,
    brokerConnection?: Connection,
    subscriptions: UntypedActivities
  }

export class Subscriber {
  static async create (options: SubscriberOptions) {
    const { subscriptions } = options
    const taskQueue = nanoid()
    const worker = await Worker.create({
      ...options,
      activities: subscriptions,
      taskQueue
    })
    console.log(`Creating subscriber on task queue "${taskQueue}"`)

    const client = new WorkflowClient({
      ...options,
      connection: options.brokerConnection
    })
    for (const topic in subscriptions) {
      if (subscriptions.hasOwnProperty(topic)) {
        console.log(`Subscribing to topic "${topic}"`)
        await client.signalWithStart<typeof TopicWorkflow, SubscribeInput>('topic', {
          signal: 'subscribe',
          signalArgs: [taskQueue],
          taskQueue: options.brokerTaskQueue,
          workflowId: workflowIdForTopic(topic)
        })
      }
    }

    return worker
  }
}
