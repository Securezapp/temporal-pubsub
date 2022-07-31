import { Subscriber } from '../src'

async function main () {
  const subscriber = await Subscriber.create({
    brokerTaskQueue: 'broker',
    subscriptions: {
      hello: async (name: string) => { console.log(`Hello, ${name}!`) }
    }
  })
  await subscriber.run()
}

main()
