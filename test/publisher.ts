import { Publisher } from '../src'

async function main () {
  const publisher = new Publisher({
    brokerTaskQueue: 'broker'
  })
  await publisher.publish('hello', 'world')
}

main()
