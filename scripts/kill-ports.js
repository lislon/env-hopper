#!/usr/bin/env node
import { execSync } from 'child_process'

const ports = [3999, 4000, 4001]

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      // Windows
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
      const lines = output.split('\n').filter(line => line.includes('LISTENING'))
      
      const pids = new Set()
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && !isNaN(pid)) {
          pids.add(pid)
        }
      })
      
      pids.forEach(pid => {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
          console.log(`✓ Killed process ${pid} on port ${port}`)
        } catch (e) {
          // Process might already be dead
        }
      })
    } else {
      // Unix-like (macOS, Linux)
      const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8' })
      const pids = output.trim().split('\n').filter(pid => pid)
      
      pids.forEach(pid => {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
          console.log(`✓ Killed process ${pid} on port ${port}`)
        } catch (e) {
          // Process might already be dead
        }
      })
    }
  } catch (error) {
    // No process found on this port
    console.log(`  No process found on port ${port}`)
  }
}

console.log('Killing processes on ports 4000 and 4001...')
ports.forEach(killPort)
console.log('Done!')
