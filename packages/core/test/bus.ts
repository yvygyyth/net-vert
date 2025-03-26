import { requestor } from './index'
import { inject, useRequestor, extendRequestor } from '../src/index'

inject(requestor)


const request = useRequestor();
const cacheRequest = extendRequestor.createCacheRequestor({
    cacheTime:({ config, response })=>{
        console.log('===>cache', '缓存时间', config, response)
        return 1000 * 60 * 60 * 24 * 7
    }
});
// const requestPost = () =>{
//     return request.post('/api/v1/user/login', 
//     { 
//         username: 'admin', password: '123456' ,
        
//     },
//     {
//         onUploadProgress:(e)=>{

//         }
//     })
// }



// const requestCache = ():Promise<any> =>{
//     return cacheRequest.post('/api/v1/user/list', 
//     { 
//         username: 'admin', password: '123456' ,
        
//     })
// }




