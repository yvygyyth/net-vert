import cacheRequestor from './modules/cacheRequestor'
import idempotencyRequestor from './modules/idempotencyRequestor'
import retryRequestor from './modules/retryRequestor'
import concurrentPoolRequestor from './modules/concurrentPoolRequestor'

const requestModules = {
  cacheRequestor,
  idempotencyRequestor,
  retryRequestor,
  concurrentPoolRequestor
}

export default requestModules
