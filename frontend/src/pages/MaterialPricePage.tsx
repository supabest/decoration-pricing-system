import React, { useEffect } from 'react'

export default function MaterialPricePage() {
  useEffect(() => {
    // 跳转到 admin.html 的信息价录入 Tab
    const baseUrl = import.meta.env.BASE_URL || '/'
    window.location.href = baseUrl + 'admin.html#prices'
  }, [])
  return (
    <div style={{ padding: 80, textAlign: 'center', color: '#888', fontSize: 15 }}>
      ⏳ 跳转到信息价管理页面...
    </div>
  )
}
