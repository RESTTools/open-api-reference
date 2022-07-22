import StandaloneLayout from "./layout"
import MainContainerPlugin from "plugins/main-container"
import ConfigsPlugin from "corePlugins/configs"
import SafeRenderPlugin from "core/plugins/safe-render"

// the Standalone preset

export default [
  MainContainerPlugin,
  ConfigsPlugin,
  () => {
    return {
      components: { StandaloneLayout }
    }
  },
  SafeRenderPlugin({
    fullOverride: true,
    componentList: [
      "Topbar",
      "StandaloneLayout",
      "onlineValidatorBadge"
    ]
  })
]
