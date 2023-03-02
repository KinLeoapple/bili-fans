const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // options placed here will be merged with default configuration and passed to electron-builder
        "directories": {
          "buildResources": "build"
        },
        "extraFiles": [
          "assets",
        ],
        "win": {
          "target": [
            "msi",
            "nsis"
          ],
          "icon": "src/assets/img/logo.ico"
        },
        "nsis": {
          "oneClick": false,
          "language": "2052",
          "perMachine": true,
          "allowToChangeInstallationDirectory": true
        }
      }
    }
  }
})
