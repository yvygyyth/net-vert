import { retry } from './modules/retry'
import { idempotent } from './modules/idempotent'
import { concurrent } from './modules/concurrent'
import { cache } from './modules/cache'
import { throttle } from './modules/throttle'
// import { sync } from './modules/sync'


// sync 中间件已移除，以简化类型系统
// 如需 Suspense 风格的同步调用，请在业务层自行封装并使用类型断言
export { retry, idempotent, concurrent, cache, throttle /* , sync */ }
