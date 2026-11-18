// Configuració de Metro. Només cal per a la versió web (proves visuals al navegador):
// expo-sqlite a web necessita els fitxers .wasm i SharedArrayBuffer (capçaleres COOP/COEP).
// No afecta l'app d'Android.
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm')
}

const enhanceMiddleware = config.server.enhanceMiddleware
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhanced = enhanceMiddleware ? enhanceMiddleware(middleware, metroServer) : middleware
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    return enhanced(req, res, next)
  }
}

module.exports = config
