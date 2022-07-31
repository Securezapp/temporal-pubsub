const PREFIX = '@tps:topic:'
export function workflowIdForTopic (topic: string): string {
  return `${PREFIX}${topic}`
}

export function topicNameFromWorkflowId (workflowId: string): string {
  return workflowId.substring(PREFIX.length)
}
