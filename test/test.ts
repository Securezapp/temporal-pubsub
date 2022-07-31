import { Broker, Publisher, Subscriber } from '../'

async function main () {
  const broker = await Broker.create('broker')
  void broker.run()

  const subscriber = await Subscriber.create({
    brokerTaskQueue: 'broker',
    subscriptions: {
      hello: async (name: string) => { console.log(`Hello, ${name}!`) }
    }
  })
  void subscriber.run()

  const publisher = new Publisher({
    brokerTaskQueue: 'broker'
  })
  await publisher.publish('hello', 'world')

  // await subscriber.shutdown()
  // await broker.shutdown()
}

main()
