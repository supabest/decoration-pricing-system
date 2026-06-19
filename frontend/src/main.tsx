import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// 全局样式
const style = document.createElement('style')
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
                 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  input:focus { outline: none; }
  table { border-spacing: 0; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
