import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

export default defineConfig({
	resolve: {
		alias: {
			'@': `${path.resolve(__dirname, 'src')}`,
		},
	},

	build: {
		minify: true,
	},

	plugins: [
		vue(),
	],

	server: {
		port: 8080,
		proxy: {
			"^/socket.io": {
				target: "http://127.0.0.1:8095",
				ws: true
			},
			"^/api": {
				target: "http://127.0.0.1:8095"
			}
		}
	},
})
