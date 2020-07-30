// API likely to change in future versions of React.
// In a separate module to allow mocking.
// Current suspense API is not testable with enzyme.
export const suspend = (promise) => {
  throw promise
}
