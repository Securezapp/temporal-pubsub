import {
  defineQuery,
  defineSignal,
  proxyActivities,
  setHandler,
  sleep,
  workflowInfo
} from '@temporalio/workflow';

import { topicNameFromWorkflowId } from '../common'

export type SubscribeInput = [string]
export type PublishInput = any[]
export type SubscribersOutput = any[]

const subscribeSignal = defineSignal<SubscribeInput>('subscribe')
const publishSignal = defineSignal<PublishInput>('publish')
const subscribersQuery = defineQuery<void, SubscribersOutput>('subscribers')

export async function topic (): Promise<void> {
  const topicName = topicNameFromWorkflowId(workflowInfo().workflowId)
  const subscribers = new Set<string>()

  setHandler(subscribeSignal, (taskQueue) => {
    console.log(`Adding subscriber: "${taskQueue}"`)
    subscribers.add(taskQueue)
    return Promise.resolve(undefined)
  })

  setHandler(publishSignal, async (...payload) => {
    console.log(`Message published: ${payload}`)
    for await (const subscriber of subscribers) {
      console.log(`Notifying subscriber: ${subscriber}`)
      const { [topicName]: handler } = proxyActivities({
        taskQueue: subscriber,
        startToCloseTimeout: '1 hour'
      })
      await handler(...payload)
    }
    return Promise.resolve(undefined)
  })

  setHandler(subscribersQuery, () => {
    return [...subscribers.values()]
  })

  console.log(`Created topic ${topicName}`)

  while (true) {
    await sleep('1 year')
  }
}
