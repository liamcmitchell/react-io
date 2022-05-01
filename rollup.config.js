import babel from '@rollup/plugin-babel'

export default ['cjs', 'es', 'es2015'].map((format) => {
  return {
    input: './modules/index.js',
    output: {
      file: `dist/react-io.${format}.js`,
      format: format === 'cjs' ? 'cjs' : 'es',
    },
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
              targets: format !== 'es2015' ? '> 0.25%, not dead' : {node: true},
            },
          ],
          '@babel/preset-react',
        ].filter(Boolean),
        plugins: ['@babel/plugin-transform-runtime'],
        babelHelpers: 'runtime',
      }),
    ],
  }
})
