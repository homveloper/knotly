/**
 * Performance Test - Grid with 50 Nodes
 *
 * Measures rendering performance when 50 nodes are displayed on canvas
 * Verifies that 60fps is maintained with grid enabled and snap enabled
 */

import { useCanvasStore } from '../store/canvasStore';

/**
 * Measure FPS by counting frame renders in 1 second
 */
function measureFPS(): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();

    function countFrame() {
      frameCount++;
      const elapsed = performance.now() - startTime;

      if (elapsed < 1000) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = (frameCount / elapsed) * 1000;
        resolve(fps);
      }
    }

    requestAnimationFrame(countFrame);
  });
}

/**
 * Create 50 nodes distributed across canvas
 */
function create50Nodes() {
  const store = useCanvasStore.getState();
  const { createNode, toggleGrid, toggleSnap } = store;

  // Enable grid and snap for this test
  toggleGrid(); // Grid ON
  toggleSnap(); // Snap ON

  console.log('Creating 50 nodes...');

  // Create nodes in a 7x7 grid pattern (49 nodes + 1)
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const x = 200 + col * 200; // 200px spacing
      const y = 200 + row * 200;
      createNode({ x, y });
    }
  }

  // Add one more to reach 50
  createNode({ x: 1600, y: 200 });

  console.log(`Created ${useCanvasStore.getState().nodes.length} nodes`);
}

/**
 * Run performance test
 */
export async function runPerformanceTest() {
  console.log('=== Grid Performance Test ===');
  console.log('Test: 50 nodes with grid enabled and snap enabled');

  create50Nodes();

  // Wait for nodes to render
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Measure FPS
  console.log('Measuring FPS for 1 second...');
  const fps = await measureFPS();

  console.log(`\n=== Results ===`);
  console.log(`FPS: ${fps.toFixed(2)}`);
  console.log(`Target: 60 fps`);
  console.log(`Status: ${fps >= 55 ? '✅ PASS' : '❌ FAIL'}`);

  if (fps >= 55) {
    console.log('\nPerformance is acceptable (>55 fps)');
  } else {
    console.log('\nPerformance warning: FPS below target');
  }

  return fps;
}
