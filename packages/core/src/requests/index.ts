import createCacheRequestor from './modules/createCacheRequestor'
import createIdempotencyRequestor from './modules/createIdempotencyRequestor'
import createRetryRequestor from './modules/createRetryRequestor'

const requestModules = {
  createCacheRequestor,
  createIdempotencyRequestor,
  createRetryRequestor
}

export default requestModules
