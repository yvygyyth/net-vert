import type { UnifiedRequestor, UnifiedConfig } from '../src/type'

export type progressEvent = {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

export type XHRConfig = {
  url: string;
  method?: "get" | "post" | "delete" | "put" | "request";
  baseURL?: string;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  responseType?: XMLHttpRequestResponseType;
  onUploadProgress?: (progressEvent: progressEvent) => void;
};

export interface Response<T = any> {
  data: T
  code: number
  msg: string
  count?: number
}

function xhrRequest<T extends any>(config: XHRConfig): Promise<Response<T>> {
  return new Promise((resolve, reject) => {
    // 1. 创建 XHR 实例
    const xhr = new XMLHttpRequest();

    // 2. 处理基础 URL 和完整 URL
    const fullUrl = config.baseURL 
      ? new URL(config.url, config.baseURL).href 
      : config.url;

    // 3. 初始化请求（兼容 GET 参数拼接到 URL）
    const method = config.method?.toUpperCase() || 'GET';

    if (config.onUploadProgress) {
      xhr.upload.onprogress = (nativeEvent: ProgressEvent) => {
        config.onUploadProgress?.({
          lengthComputable: nativeEvent.lengthComputable,
          loaded: nativeEvent.loaded,
          total: nativeEvent.total
        });
      };
    }

    xhr.open(method, fullUrl, true);

    // 4. 设置请求头
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    // 5. 配置超时（参考 Axios 的 60s 默认值）
    xhr.timeout = config.timeout || 60000;
    xhr.ontimeout = () => reject(new Error(`Timeout of ${xhr.timeout}ms exceeded`));

    // 6. 响应类型处理（如 JSON/Blob）
    if (config.responseType) {
      xhr.responseType = config.responseType;
    }

    // 7. 事件监听
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // 自动解析 JSON 响应（类似 Axios 行为）
            const data = xhr.responseType === 'json' 
              ? xhr.response 
              : JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            reject(new Error('Failed to parse JSON response'));
          }
        } else {
          reject(new Error(`Request failed with status ${xhr.status}`));
        }
      }
    };

    // 8. 错误处理
    xhr.onerror = () => reject(new Error('Network Error'));

    // 9. 发送请求体（兼容不同数据格式）
    let requestBody: BodyInit | null = null;
    if (config.data) {
      const contentType = config.headers?.['Content-Type'];
      requestBody = contentType?.includes('application/json') 
        ? JSON.stringify(config.data) 
        : new URLSearchParams(config.data).toString();
    }
    
    xhr.send(requestBody);
  });
}

export const requestor: UnifiedRequestor = (config: UnifiedConfig) => {
  return xhrRequest(config as XHRConfig).then((response:Response) => response.data);
}