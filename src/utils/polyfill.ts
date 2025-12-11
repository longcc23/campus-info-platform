/**
 * Polyfill for 微信小程序环境
 * 提供 URL, Headers, AbortSignal, AbortController, fetch 等 API
 */

// 1. URL Polyfill
if (typeof globalThis.URL === 'undefined') {
  class SimpleURL {
    href: string
    origin: string
    protocol: string
    host: string
    hostname: string
    port: string
    pathname: string
    search: string
    hash: string

    constructor(input: string, base?: string | SimpleURL) {
      let url = String(input).trim()
      
      // 处理 base URL
      if (base) {
        const baseUrl = base instanceof SimpleURL ? base : new SimpleURL(base as string)
        if (url.startsWith('/')) {
          url = baseUrl.origin + url
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
          const basePath = baseUrl.pathname.endsWith('/') 
            ? baseUrl.pathname 
            : (baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1) || '/')
          url = baseUrl.origin + basePath + url
        }
      }

      // 解析 URL - 支持包含点的 hostname
      const match = url.match(/^(https?):\/\/([^\/\?#:]+(?:\.[^\/\?#:]+)*)(?::(\d+))?(\/[^\?#]*)?(\?[^#]*)?(#.*)?$/)
      if (!match) {
        throw new TypeError(`Invalid URL: ${url}`)
      }

      this.protocol = match[1] + ':'
      this.hostname = match[2]
      this.port = match[3] || ''
      this.host = this.port ? `${this.hostname}:${this.port}` : this.hostname
      this.origin = `${match[1]}://${this.host}`
      this.pathname = match[4] || '/'
      this.search = match[5] || ''
      this.hash = match[6] || ''
      this.href = url
    }

    toString() {
      return this.href
    }
  }

  globalThis.URL = SimpleURL as any
}

// 2. Headers Polyfill
if (typeof globalThis.Headers === 'undefined') {
  class SimpleHeaders {
    private map: Map<string, string> = new Map()

    constructor(init?: any) {
      if (init) {
        if (init instanceof SimpleHeaders) {
          init.map.forEach((value, key) => this.map.set(key, value))
        } else if (Array.isArray(init)) {
          init.forEach(([k, v]: [string, string]) => this.map.set(k.toLowerCase(), String(v)))
        } else {
          Object.entries(init).forEach(([k, v]: [string, any]) => 
            this.map.set(k.toLowerCase(), String(v))
          )
        }
      }
    }

    get(name: string) {
      return this.map.get(name.toLowerCase()) || null
    }

    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), value)
    }

    has(name: string) {
      return this.map.has(name.toLowerCase())
    }

    delete(name: string) {
      this.map.delete(name.toLowerCase())
    }

    forEach(callback: (value: string, key: string) => void) {
      this.map.forEach(callback)
    }
  }

  globalThis.Headers = SimpleHeaders as any
}

// 3. EventTarget Polyfill
if (typeof globalThis.EventTarget === 'undefined') {
  class SimpleEventTarget {
    private listeners: Map<string, Set<EventListener>> = new Map()

    addEventListener(type: string, listener: EventListener) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set())
      }
      this.listeners.get(type)!.add(listener)
    }

    removeEventListener(type: string, listener: EventListener) {
      const listeners = this.listeners.get(type)
      if (listeners) {
        listeners.delete(listener)
      }
    }

    dispatchEvent(event: Event): boolean {
      const listeners = this.listeners.get(event.type)
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener.call(this, event)
          } catch (e) {
            console.error('Event listener error:', e)
          }
        })
      }
      return true
    }
  }

  globalThis.EventTarget = SimpleEventTarget as any
}

// 4. AbortSignal Polyfill
if (typeof globalThis.AbortSignal === 'undefined') {
  const EventTargetClass = globalThis.EventTarget as any
  class SimpleAbortSignal extends EventTargetClass {
    aborted = false
    reason?: any

    constructor() {
      super()
    }

    static abort(reason?: any) {
      const signal = new SimpleAbortSignal()
      signal.aborted = true
      signal.reason = reason
      return signal
    }
  }

  globalThis.AbortSignal = SimpleAbortSignal as any
}

// 5. AbortController Polyfill
if (typeof globalThis.AbortController === 'undefined') {
  class SimpleAbortController {
    signal: any

    constructor() {
      const AbortSignalClass = globalThis.AbortSignal as any
      this.signal = new AbortSignalClass()
    }

    abort(reason?: any) {
      if (!this.signal.aborted) {
        this.signal.aborted = true
        this.signal.reason = reason
        if (this.signal.dispatchEvent) {
          this.signal.dispatchEvent(new Event('abort'))
        }
      }
    }
  }

  globalThis.AbortController = SimpleAbortController as any
}

console.log('✅ Polyfills 已加载 (URL, Headers, EventTarget, AbortSignal, AbortController)')