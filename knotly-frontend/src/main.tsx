import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useCanvasStore } from './store/canvasStore'

// Expose performance testing utilities to console for manual testing
declare global {
  interface Window {
    __perf: {
      create50Nodes: () => void
      measureFPS: () => Promise<number>
      testPerformance: () => Promise<void>
    }
  }
}

// Add console utilities
window.__perf = {
  /**
   * Create 50 nodes distributed across canvas with grid and snap enabled
   */
  create50Nodes: () => {
    const store = useCanvasStore.getState()
    const { createNode, toggleGrid, toggleSnap, gridEnabled, snapEnabled } = store

    // Enable grid and snap if not already enabled
    if (!gridEnabled) toggleGrid()
    if (!snapEnabled) toggleSnap()

    console.log('Creating 50 nodes...')

    // Create nodes in a 7x7 grid pattern (49 nodes + 1)
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const x = 200 + col * 200
        const y = 200 + row * 200
        createNode({ x, y })
      }
    }

    // Add one more to reach 50
    createNode({ x: 1600, y: 200 })

    console.log(`✅ Created ${useCanvasStore.getState().nodes.length} nodes`)
  },

  /**
   * Measure FPS by counting frame renders in 1 second
   */
  measureFPS: async () => {
    return new Promise((resolve) => {
      let frameCount = 0
      const startTime = performance.now()

      function countFrame() {
        frameCount++
        const elapsed = performance.now() - startTime

        if (elapsed < 1000) {
          requestAnimationFrame(countFrame)
        } else {
          const fps = (frameCount / elapsed) * 1000
          resolve(fps)
        }
      }

      requestAnimationFrame(countFrame)
    })
  },

  /**
   * Run full performance test: create 50 nodes and measure FPS
   */
  testPerformance: async () => {
    console.log('=== Grid Performance Test ===')
    console.log('Test: 50 nodes with grid enabled and snap enabled')

    window.__perf.create50Nodes()

    // Wait for nodes to render
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Measure FPS
    console.log('Measuring FPS for 1 second...')
    const fps = await window.__perf.measureFPS()

    console.log(`\n=== Results ===`)
    console.log(`FPS: ${fps.toFixed(2)}`)
    console.log(`Target: 60 fps`)
    console.log(`Status: ${fps >= 55 ? '✅ PASS' : '⚠️ WARN'} - ${fps.toFixed(0)} fps`)

    if (fps >= 55) {
      console.log('\n✅ Performance is acceptable (>55 fps)')
    } else {
      console.log('\n⚠️ Performance warning: FPS below target')
    }
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
