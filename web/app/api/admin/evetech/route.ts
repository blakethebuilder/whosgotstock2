import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { execFileSync } from 'child_process'

export async function GET() {
  // Resolve potential script paths
  const candidates = [
    path.resolve(process.cwd(), 'worker/evetech_worker.py'),
    path.resolve(process.cwd(), '../../../../worker/evetech_worker.py')
  ]
  let script: string | null = null
  for (const c of candidates) {
    if (fs.existsSync(c)) { script = c; break; }
  }
  if (!script) {
    return NextResponse.json({ error: 'evetech_worker.py not found' }, { status: 500 })
  }

  try {
    const stdout = execFileSync('python3', [script!], { encoding: 'utf8' })
    return NextResponse.json({ stdout })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'execution error' }, { status: 500 })
  }
}
