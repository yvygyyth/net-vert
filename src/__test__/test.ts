const customRequest3 = <R = any, D = any>(_config: D) =>
    Promise.resolve({
        code: 0,
        msg: '成功',
        payload: {
            result: {
                data: {} as R,
            },
        },
    });

const customRequest4 = <D = any>(_config: D) =>
    Promise.resolve({
        date: 1,
    });

type RequestorResponse<R> = ReturnType<typeof customRequest3<R>>;
