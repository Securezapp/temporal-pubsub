import { Broker } from '../src'

async function main () {
  const broker = await Broker.create('broker')
  void broker.run()
}

main()
