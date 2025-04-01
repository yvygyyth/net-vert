import cacheRequestor from './modules/cacheRequestor'
import idempotencyRequestor from './modules/idempotencyRequestor'
import retryRequestor from './modules/retryRequestor'
import concurrentPoolRequestor from './modules/concurrentPoolRequestor'
import syncRequestor from './modules/syncRequestor'

const requestModules = {
  cacheRequestor,
  idempotencyRequestor,
  retryRequestor,
  concurrentPoolRequestor,
  syncRequestor
}

export default requestModules
