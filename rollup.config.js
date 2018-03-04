export default {
  input: './modules/index.js',
  output: [
    {
      file: 'dist/react-io.js',
      format: 'cjs',
    },
    {
      file: 'dist/react-io.es.js',
      format: 'es',
    },
  ],
  // Treat absolute imports as external.
  external: (id) => /^\w/.test(id),
}
