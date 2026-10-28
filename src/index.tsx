import { Hono } from 'hono'
// HTML は public/index.html の 1 か所だけで管理（Vercel ではこのファイルを静的配信、Cloudflare ではビルド時に埋め込む）
import shell from '../public/index.html?raw'

const app = new Hono()

app.get('/', (c) => c.html(shell))

export default app
