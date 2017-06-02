const Merge = require('webpack-merge');
const CommonConfig = require('./webpack.common.ts');

module.exports = function(env) {
  return Merge(
    CommonConfig,
    {
    }
  )
}
