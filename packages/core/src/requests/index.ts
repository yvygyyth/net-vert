import cacheRequestor from './modules/cacheRequestor'
import idempotencyRequestor from './modules/idempotencyRequestor'
import retryRequestor from './modules/retryRequestor'

const requestModules = {
  cacheRequestor,
  idempotencyRequestor,
  retryRequestor
}

export default requestModules
