export default function isPromise(o) {
  return o && typeof o.next === 'function'
}
