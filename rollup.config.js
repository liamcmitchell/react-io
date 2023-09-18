import babel from '@rollup/plugin-babel'

export default {
  input: './modules/index.js',
  output: ['cjs', 'es'].map((format) => ({
    file: `dist/react-io.${format}.js`,
    format,
  })),
  // Treat absolute imports as external.
  external: (id) => /^(\w|@)/.test(id),
  plugins: [
    babel({
      babelrc: false,
      presets: [
        [
          '@babel/preset-env',
          {
            loose: true,
            modules: false,
            targets: 'defaults',
          },
        ],
        ['@babel/preset-react', {useSpread: true}],
      ],
      babelHelpers: 'bundled',
    }),
  ],
}
