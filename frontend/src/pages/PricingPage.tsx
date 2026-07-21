import React from 'react'

const TOOL_URL = './tool.html'

export default function PricingPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <iframe
        src={TOOL_URL}
        style={{ flex: 1, border: 'none' }}
        title="套价工具"
      />
    </div>
  )
}
