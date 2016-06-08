export default function allowRecursion(source) {
  return function(request) {
    if (!request.source) {
      request.source = allowRecursion(source)
    }
    return source(request)
  }
}
