export const isObservable = (o) => o && typeof o.subscribe === 'function'

export const unsubscribe = (subscriptions) => {
  for (const prop in subscriptions) {
    subscriptions[prop].unsubscribe()
    delete subscriptions[prop]
  }
}
