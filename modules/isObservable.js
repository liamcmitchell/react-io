export default function isObservable(o) {
  return o && typeof o.next === 'function'
}
