import { supabase } from '@/lib/supabaseClient'

interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp: number
  metadata?: Record<string, any>
}

interface PageLoadMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
  domLoad: number // DOM Content Loaded
  windowLoad: number // Window Load
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  private isRecording = false
  private batchTimer: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 50
  private readonly BATCH_INTERVAL = 30000 // 30 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
      this.startBatchUpload()
    }
  }

  private initializeObservers() {
    // Observe paint timing
    if ('PerformanceObserver' in window) {
      try {
        // Paint timing observer
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              this.recordMetric({
                name: entry.name,
                value: entry.startTime,
                unit: 'ms',
                timestamp: Date.now()
              })
            }
          }
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.set('paint', paintObserver)

        // Largest Contentful Paint observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            this.recordMetric({
              name: 'largest-contentful-paint',
              value: lastEntry.startTime,
              unit: 'ms',
              timestamp: Date.now()
            })
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.set('lcp', lcpObserver)

        // Layout shift observer
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          this.recordMetric({
            name: 'cumulative-layout-shift',
            value: clsValue,
            unit: 'count',
            timestamp: Date.now()
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.set('cls', clsObserver)

        // First Input Delay observer
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              this.recordMetric({
                name: 'first-input-delay',
                value: (entry as any).processingStart - entry.startTime,
                unit: 'ms',
                timestamp: Date.now()
              })
            }
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.set('fid', fidObserver)

      } catch (error) {
        console.error('Error initializing performance observers:', error)
      }
    }

    // Navigation timing
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        const timing = window.performance.timing
        const navigationMetrics = {
          'time-to-first-byte': timing.responseStart - timing.fetchStart,
          'dom-content-loaded': timing.domContentLoadedEventEnd - timing.navigationStart,
          'window-load': timing.loadEventEnd - timing.navigationStart,
          'dns-lookup': timing.domainLookupEnd - timing.domainLookupStart,
          'tcp-connection': timing.connectEnd - timing.connectStart,
          'request-time': timing.responseEnd - timing.requestStart,
          'dom-processing': timing.domComplete - timing.domLoading,
        }

        Object.entries(navigationMetrics).forEach(([name, value]) => {
          this.recordMetric({
            name,
            value,
            unit: 'ms',
            timestamp: Date.now()
          })
        })
      })
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Upload if batch size reached
    if (this.metrics.length >= this.BATCH_SIZE) {
      this.uploadMetrics()
    }
  }

  // Custom timing measurement
  startTiming(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.recordMetric({
        name: `custom-timing-${name}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        metadata: { name }
      })
    }
  }

  // Measure API call performance
  async measureAPICall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    let success = true
    let error: any = null

    try {
      const result = await apiCall()
      return result
    } catch (err) {
      success = false
      error = err
      throw err
    } finally {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordMetric({
        name: `api-call-${name}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        metadata: {
          name,
          success,
          error: error?.message
        }
      })
    }
  }

  // Memory usage monitoring
  recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      
      this.recordMetric({
        name: 'js-heap-used',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        timestamp: Date.now()
      })

      this.recordMetric({
        name: 'js-heap-limit',
        value: memory.jsHeapSizeLimit,
        unit: 'bytes',
        timestamp: Date.now()
      })

      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      this.recordMetric({
        name: 'memory-usage-percentage',
        value: usagePercentage,
        unit: 'percentage',
        timestamp: Date.now()
      })
    }
  }

  // Resource timing
  recordResourceTiming() {
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource')
      
      // Group resources by type
      const resourceTypes: Record<string, number[]> = {}
      
      resources.forEach((resource: any) => {
        const type = this.getResourceType(resource.name)
        if (!resourceTypes[type]) {
          resourceTypes[type] = []
        }
        resourceTypes[type].push(resource.duration)
      })

      // Record average load time per resource type
      Object.entries(resourceTypes).forEach(([type, durations]) => {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length
        
        this.recordMetric({
          name: `resource-load-${type}`,
          value: avg,
          unit: 'ms',
          timestamp: Date.now(),
          metadata: {
            count: durations.length,
            total: durations.reduce((a, b) => a + b, 0)
          }
        })
      })
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)/)) return 'font'
    if (url.includes('/api/') || url.includes('/rest/')) return 'api'
    return 'other'
  }

  // Upload metrics to Supabase
  private async uploadMetrics() {
    if (this.metrics.length === 0) return

    const metricsToUpload = [...this.metrics]
    this.metrics = []

    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(
          metricsToUpload.map(metric => ({
            ...metric,
            user_agent: navigator.userAgent,
            url: window.location.href,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            connection_type: (navigator as any).connection?.effectiveType,
            device_memory: (navigator as any).deviceMemory,
            hardware_concurrency: navigator.hardwareConcurrency
          }))
        )

      if (error) {
        console.error('Error uploading performance metrics:', error)
        // Re-add metrics to queue for retry
        this.metrics.unshift(...metricsToUpload)
      }
    } catch (error) {
      console.error('Error uploading performance metrics:', error)
      // Re-add metrics to queue for retry
      this.metrics.unshift(...metricsToUpload)
    }
  }

  private startBatchUpload() {
    this.batchTimer = setInterval(() => {
      this.uploadMetrics()
      this.recordMemoryUsage()
      this.recordResourceTiming()
    }, this.BATCH_INTERVAL)
  }

  // Get Core Web Vitals
  getCoreWebVitals(): PageLoadMetrics | null {
    if (!window.performance) return null

    const metrics: Partial<PageLoadMetrics> = {}

    // Get navigation timing
    if (window.performance.timing) {
      const timing = window.performance.timing
      metrics.ttfb = timing.responseStart - timing.fetchStart
      metrics.domLoad = timing.domContentLoadedEventEnd - timing.navigationStart
      metrics.windowLoad = timing.loadEventEnd - timing.navigationStart
    }

    // Get paint metrics
    const paintEntries = window.performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    if (fcpEntry) {
      metrics.fcp = fcpEntry.startTime
    }

    // Get LCP from stored metrics
    const lcpMetric = this.metrics.find(m => m.name === 'largest-contentful-paint')
    if (lcpMetric) {
      metrics.lcp = lcpMetric.value
    }

    // Get FID from stored metrics
    const fidMetric = this.metrics.find(m => m.name === 'first-input-delay')
    if (fidMetric) {
      metrics.fid = fidMetric.value
    }

    // Get CLS from stored metrics
    const clsMetric = this.metrics.find(m => m.name === 'cumulative-layout-shift')
    if (clsMetric) {
      metrics.cls = clsMetric.value
    }

    return metrics as PageLoadMetrics
  }

  // Clean up
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
      this.batchTimer = null
    }
    
    // Upload remaining metrics
    this.uploadMetrics()
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor!
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const monitor = getPerformanceMonitor()

  const measureAction = useCallback((name: string) => {
    return monitor.startTiming(name)
  }, [monitor])

  const measureAPICall = useCallback(
    async <T,>(name: string, apiCall: () => Promise<T>) => {
      return monitor.measureAPICall(name, apiCall)
    },
    [monitor]
  )

  const getCoreWebVitals = useCallback(() => {
    return monitor.getCoreWebVitals()
  }, [monitor])

  return {
    measureAction,
    measureAPICall,
    getCoreWebVitals
  }
}

// Utility to report Web Vitals
export function reportWebVitals(metric: any) {
  const monitor = getPerformanceMonitor()
  
  monitor.recordMetric({
    name: `web-vital-${metric.name}`,
    value: metric.value,
    unit: metric.name === 'CLS' ? 'count' : 'ms',
    timestamp: Date.now(),
    metadata: {
      id: metric.id,
      navigationType: metric.navigationType
    }
  })
}

import { useCallback } from 'react'
