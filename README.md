# Temporal Pub/Sub

Temporal is great for service-to-service communication. With horizontal scaling,
each service might consist of several worker instances. When a service schedules
an activity implemented by another service, Temporal ensures that only a single
worker instance of that service will execute the activity. Occasionally, we have
a need for one service to broadcast out a message that _every_ worker instance
of one or more other services should receive.

This project is an attempt to implement a simple pub/sub protocol on top of
Temporal. Temporal provides a small but powerful set of primitives, including
workflows and task queues, which can be combined to extend its capabilities with
new feature easily and in a robust and scaleable manner.

*Warning:* This project is only an early proof-of-concept and should not be used
to run production workloads.

## Demo Usage

1. Run `yarn broker` to start the broker workflow worker.
2. Run `yarn subscriber` in a separate terminal to start the subscriber worker.
3. Run `yarn publisher` in a third terminal to publish a message.

## The Pub/Sub Protocol

### Actors

The Temporal Pub/Sub protocol involves 3 actors:
* Publishers, which publish messages to topics.
* Subscribers, which receive messages from one or more topics.
* Brokers, which manage topics and subscribers, and broadcast messages from
  publishes of a topic to all subscribers of that topic.

In Temporal, Publishers are workflow clients, Subscribers are activity workers,
and Brokers are workflow workers.

### Topics

Each topic is a workflow running on a Broker. Subscribers subscribe to a topic
by sending a subscription signal to the workflow with a unique task queue.
Publishers publish messages to a topic by sending a publish signal. The topic
workflow maintains a list of subscribers and their task queues. When they
receive a publish signal, they broadcast the signal payload to all subscribers
of the topic by scheduling an activity on each subscribers’ unique task queue.
Each topic is associated with a specific activity interface that both the
subscriber and publisher are expected to know.

### Broker Protocol

A Broker implements a topic workflow. The workflow runs indefinitely and supports 3 signals:

* `subscribe(task queue)` - workflow adds the task queue to a list of
  subscribers.
* `unsubscribe(task queue)` - workflow removes the task queue from the list of
  subscribers.
* `publish(payload)` - workflow iterates through the list of subscribers and
  schedules an activity named after the topic with the payload as input.

The broker uses a static task queue, that both the subscribers and publishers are expected to know.

### Publisher Protocol

A Publisher uses the Temporal Client API to create topics, and publish messages
to topics:

* `createTopic(name)` - creates a new workflow instance of type topic with the
  name of the topic.
* `publish(topic, payload)` - sends a publish signal with the given payload to
  the topic workflow with the name of the topic.

### Subscriber Protocol

The Publisher implements an activity worker and creates a unique task queue. It
can subscribe to topics and is expected to implement a specific activity
function for each topic:

* `subscribe(topic, task queue)` - sends a signal to the workflow of type topic
  with the name of the topic. The payload of the signal is the subscriber’s
  unique task queue. Optionally uses signal-with-start to create the topic
  workflow, if it doesn’t exist yet.

## Unsolved Problems

### The Ghost Subscriber

The subscribers of topics are individual worker instances. Worker instances are
expected to occasionally terminate unexpectedly without performing a clean
shutdown. So we cannot expect all topic subscribers to unsubscribe from a topic
when the subscribers worker terminates.

The easy solution would be for the broker’s topic workflow to automatically
remove subscribers, if the subscriber’s activity function times out.
Subscriptions should be robust and survive temporary unavailability of the
subscriber’s worker, e.g. due to networking issues. We also don’t want to
implement a lot of complex timeout/retry logic in the topic worker and instead
rely as much as possible on Temporal’s normal behavior.

Another, more complex option might be for the subscriber to implement an
indefinitely running subscription activity and send regular heartbeats for that
activity. That would allow the topic workflow to detect a missing subscribers
independently of an message broadcasts and remove them. The subscription worker
would also be able to detect if the subscription activity has failed and gets
rescheduled by Temporal. 
