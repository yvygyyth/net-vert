import type { CreateRequestorConfig } from './types'
import { useRequestor } from './registry'
import { createRequestAdapter } from './utils/unifiedRequest'

export function createRequestor(
    config?: CreateRequestorConfig
){
    const { extensions, instanceKey } = config ?? {}

    const baseRequestor = useRequestor(instanceKey)

    const requestor = createRequestAdapter(baseRequestor, extensions)

    return requestor
}