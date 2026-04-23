import netVert from 'net-vert';
import type { RequestConfig } from 'net-vert';

const { inject, createRequestor, idempotent, cache } = netVert;

type ApiResponse<T = any> = {
    code: number;
    msg: string;
    data: T;
};

type HealthData = {
    url: string;
    method: string;
};

/**
 * 请求器函数签名：
 * - D: 入参 data 类型（对应 RequestConfig<D>）
 * - R: 响应 data 类型（最终包装在 ApiResponse<R>.data）
 */
type AppRequestor = <R = any, D = any>(config: RequestConfig<D>) => Promise<ApiResponse<R>>;

/**
 * 业务侧类型注入（模块扩展）
 * - RequestorRegistry：声明 key -> 请求器函数类型
 * - ResponseRegistry：声明 key -> 最终响应包装类型
 */
declare module 'net-vert' {
    interface RequestorRegistry {
        default: AppRequestor;
        backup: AppRequestor;
    }

    interface ResponseRegistry<R = any, D = any> {
        default: ApiResponse<R>;
        backup: ApiResponse<R>;
    }
}

const appRequestor: AppRequestor = async config => {
    return {
        code: 200,
        msg: 'ok',
        data: {
            url: config.url,
            method: config.method,
        } as any,
    };
};

// 注入 default / backup 两个实例，验证 instanceKey 的类型链路
inject(appRequestor);
inject(appRequestor, 'backup');

// 不传 key，默认走 default
const requestor = createRequestor({
    extensions: [idempotent(), cache({ duration: 5000 })],
});

// 传 key，走 backup
const backupRequestor = createRequestor({
    instanceKey: 'backup',
    extensions: [idempotent(), cache({ duration: 3000 })],
});

const res = await requestor.get<HealthData>('/health');
const backupRes = await backupRequestor.get<HealthData>('/health-backup');

// 类型可用性检查（这里能正确访问字段，说明类型注入生效）
res.data.url;
backupRes.data.method;

if (!res || res.code !== 200) {
    console.error('[verify-release:npm-install] npm 安装后的运行验证失败');
    process.exit(1);
}

console.log('[verify-release:npm-install] npm 安装后的运行验证通过');
