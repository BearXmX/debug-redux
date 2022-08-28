/*
 * @Date: 2022-05-01 14:16:00
 * @LastEditors: 熊明祥
 * @LastEditTime: 2022-05-04 16:48:32
 * @Description: 
 */
const CracoLessPlugin = require("craco-less");
const path = require('path')
const themeColor = {
  '@primary-color': '#5b6aff',// 全局主色
  '@gray-color': '#9da2ac'
}

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'course': path.resolve(__dirname, 'src/course')
    }
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: themeColor,
            javascriptEnabled: true
          }
        }
      }
    }
  ],
}
