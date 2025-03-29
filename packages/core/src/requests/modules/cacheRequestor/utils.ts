// 包装数据
export const wrapWithExpiry = <T>(data: T, duration: number) => {
    return {
        value: data,
        expiresAt: Date.now() + duration
    }
}

// 是否过期
export const isExpired = (cachedData: { expiresAt: number }) => {
    return Date.now() > cachedData.expiresAt
}