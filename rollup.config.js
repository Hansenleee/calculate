/**
 * rollup config js
 */
export default {
  input: 'index.js',
  output: {
    file: './dist/bundle.js',
    format: 'umd',
    name: 'bundle'
  }
}