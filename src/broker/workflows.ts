import {
  defineQuery,
  defineSignal,
  proxyActivities,
  setHandler,
  sleep,
  workflowInfo
} from '@temporalio/workflow';

export type SubscribeInput = [string]
export type PublishInput = any[]
export type SubscribersOutput = any[]

const subscribeSignal = defineSignal<SubscribeInput>('subscribe')
const publishSignal = defineSignal<PublishInput>('publish')
const subscribersQuery = defineQuery<void, SubscribersOutput>('subscribers')

export async function topic (): Promise<void> {
  const topicName = workflowInfo().workflowId
  const subscribers = new Set<string>()

  console.log(`Creating new topic ${topicName}`)

  setHandler(subscribeSignal, (taskQueue) => {
    console.log(`Adding subsciber: "${taskQueue}"`)
    subscribers.add(taskQueue)
    return Promise.resolve(undefined)
  })

  setHandler(publishSignal, async (...payload) => {
    console.log(`Message published: ${payload}`)
    for await (const subscriber of subscribers) {
      console.log(`Notifying subscriber: ${subscriber}`)
      const { [topicName]: handler } = proxyActivities({
        taskQueue: subscriber
      })
      await handler(...payload)
    }
    return Promise.resolve(undefined)
  })

  setHandler(subscribersQuery, async () => {
    return Promise.resolve(subscribers)
  })

  console.log(`Setup for topic ${topicName} completed`)

  while (true) {
    sleep('1 year')
  }
}
