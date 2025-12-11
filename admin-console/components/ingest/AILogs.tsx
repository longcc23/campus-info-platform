'use client'

interface AILogsProps {
  logs: string[]
}

export default function AILogs({ logs }: AILogsProps) {
  if (logs.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">AI 处理日志</h3>
      <div className="space-y-1">
        {logs.map((log, index) => (
          <div key={index} className="text-sm text-gray-800 font-mono">
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}

