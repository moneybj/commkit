import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.ANTHROPIC_API_KEY ||= env.ANTHROPIC_API_KEY

  return {
    plugins: [
      {
        name: 'commkit-local-api',
        configureServer(server) {
          server.middlewares.use('/api/generate', async (req, res) => {
            const { default: handler } = await import('./api/generate.js')
            req.body = await readJsonBody(req)

            const response = createViteResponse(res)
            await handler(req, response)
          })
        },
      },
    ],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            // Keep bundle lean — single chunk for PWA
          }
        }
      }
    },
    server: {
      port: 3000,
      open: true,
    },
    preview: {
      port: 4000
    }
  }
})

function readJsonBody(req) {
  return new Promise(resolve => {
    let raw = ''
    req.on('data', chunk => {
      raw += chunk
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function createViteResponse(res) {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code
      res.statusCode = code
      return this
    },
    json(payload) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(payload))
      return this
    },
  }
}
