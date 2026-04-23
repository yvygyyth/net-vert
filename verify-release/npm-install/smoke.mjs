import { inject, createRequestor, idempotent, cache } from 'net-vert';

inject(async config => {
    return {
        code: 200,
        msg: 'ok',
        data: {
            url: config.url,
            method: config.method,
        },
    };
});

const requestor = createRequestor({
    extensions: [idempotent(), cache({ duration: 5000 })],
});

const res = await requestor.get('/health');

if (!res || res.code !== 200) {
    console.error('[verify-release:npm-install] npm 安装后的运行验证失败');
    process.exit(1);
}

console.log('[verify-release:npm-install] npm 安装后的运行验证通过');
