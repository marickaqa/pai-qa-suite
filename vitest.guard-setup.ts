// Guard-only global setup for tiers that don't need token caching
// (known-bugs, monitoring). Runs the production interlock and nothing else.
import path from 'path'
import dotenv from 'dotenv'
import { assertNotProd } from './utils/prodGuard'

dotenv.config({ path: path.resolve(__dirname, '.env') })

export async function setup() {
  assertNotProd()
}
