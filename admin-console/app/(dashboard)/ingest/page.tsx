'use client'

import { useState } from 'react'
import IngestView from '@/components/ingest/IngestView'

export default function IngestPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI 智能采集台</h1>
      <IngestView />
    </div>
  )
}

