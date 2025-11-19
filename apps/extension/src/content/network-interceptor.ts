const INJECTION_FLAG = '__LEETRACK_NETWORK_INTERCEPTOR__';
const MESSAGE_SOURCE = 'leetrack';
const GRAPHQL_PATH = '/graphql/';

(() => {
  if ((window as any)[INJECTION_FLAG]) {
    return;
  }
  (window as any)[INJECTION_FLAG] = true;
  (window as any).__LEETRACK_NETWORK_READY__ = false;

  const log = (...args: any[]) => console.debug('[LeeTrack injector]', ...args);

  const postMessage = (type: string, payload: any): void => {
    window.postMessage({ source: MESSAGE_SOURCE, type, payload }, '*');
  };

  const handleGraphqlResponse = (requestInfo: any, data: any): void => {
    if (!data || !data.data) {
      return;
    }

    const submission = data.data.submissionDetails;
    if (submission) {
      log('submissionDetails response detected', submission.submissionId, requestInfo);
      postMessage('SUBMISSION_DETAILS', {
        submission,
        variables: requestInfo?.variables || {},
        submissionId: requestInfo?.variables?.submissionId ?? submission.submissionId ?? null,
      });
    }

    if (requestInfo?.operationName === 'questionDetail' && data.data.question) {
      const question = data.data.question;
      log('questionDetail response detected', question.titleSlug);
      postMessage('QUESTION_DETAIL', {
        questionId: Number(question.questionId),
        titleSlug: question.titleSlug,
        title: question.title || question.questionTitle || '',
        difficulty: question.difficulty || 'Medium',
      });
    }
  };

  const parseBody = (bodyText: string | null): any => {
    if (!bodyText) return null;
    try {
      return JSON.parse(bodyText);
    } catch {
      return null;
    }
  };

  const shouldInspect = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.pathname === GRAPHQL_PATH;
    } catch {
      return false;
    }
  };

  const readRequestBody = (input: RequestInfo | URL, init?: RequestInit): Promise<string | null> => {
    if (input instanceof Request) {
      try {
        return input.clone().text();
      } catch {
        return Promise.resolve(null);
      }
    }

    const body = init && init.body;
    if (typeof body === 'string') {
      return Promise.resolve(body);
    }

    if (body && typeof body === 'object' && 'text' in body && typeof (body as any).text === 'function') {
      try {
        return (body as any).text();
      } catch {
        return Promise.resolve(null);
      }
    }

    return Promise.resolve(null);
  };

  const extractUrl = (input: RequestInfo | URL): string => {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    if (input && typeof input === 'object' && 'url' in input) {
      return (input as Request).url;
    }
    return '';
  };

  const readXhrResponse = (xhr: XMLHttpRequest): Promise<string | null> => {
    const type = xhr.responseType as XMLHttpRequestResponseType | '';
    if (!type || type === 'text') {
      return Promise.resolve(xhr.responseText);
    }

    if (type === 'blob' && xhr.response instanceof Blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsText(xhr.response);
      });
    }

    if (type === 'arraybuffer' && xhr.response instanceof ArrayBuffer) {
      const decoder = new TextDecoder();
      return Promise.resolve(decoder.decode(xhr.response));
    }

    return Promise.resolve(null);
  };

  const interceptFetch = (): void => {
    if (!window.fetch) return;
    const originalFetch = window.fetch;
    log('Patching fetch');
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const bodyPromise = readRequestBody(input, init);
      const url = extractUrl(input);
      return originalFetch.apply(this, arguments as any).then((response) => {
        if (!shouldInspect(url)) {
          return response;
        }
        log('GraphQL fetch detected', url);

        bodyPromise
          .then((bodyText) => parseBody(bodyText))
          .then((parsed) => {
            log('Parsed fetch body', parsed?.operationName ?? 'unknown');
            response
              .clone()
              .json()
              .then((data) => {
                log(
                  'Fetch response parsed',
                  data?.data?.submissionDetails ? 'contains submission' : 'no submission'
                );
                handleGraphqlResponse(parsed || undefined, data);
              })
              .catch((error) => {
                log('Failed to parse fetch response JSON', error);
              });
          })
          .catch((error) => {
            log('Failed to parse fetch body', error);
          });

        return response;
      });
    };
    (window as any).__LEETRACK_FETCH_PATCHED__ = true;
  };

  const interceptXhr = (): void => {
    if (!window.XMLHttpRequest) return;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    log('Patching XHR');

    XMLHttpRequest.prototype.open = function (method: string, url?: string | URL | null) {
      (this as any).__leetrack = (this as any).__leetrack || {};
      (this as any).__leetrack.url = typeof url === 'string' ? url : url?.toString();
      return originalOpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      (this as any).__leetrack = (this as any).__leetrack || {};
      (this as any).__leetrack.body = typeof body === 'string' ? body : null;

      if (!(this as any).__leetrack.__listenerAttached) {
        this.addEventListener('readystatechange', function () {
          if (this.readyState !== 4 || this.status < 200 || this.status >= 300) {
            return;
          }

          const info = (this as any).__leetrack || {};
          const url = info.url;
          if (!shouldInspect(url)) {
            return;
          }
          log('GraphQL XHR detected', url);

          readXhrResponse(this)
            .then((text) => {
              if (!text) return;
              let data: any = null;
              try {
                data = JSON.parse(text);
              } catch (error) {
                log('Failed to parse XHR response JSON', error);
                return;
              }

              const parsedBody = parseBody(info.body);
              log('Parsed XHR body', parsedBody?.operationName ?? 'unknown');
              handleGraphqlResponse(parsedBody || undefined, data);
            })
            .catch((error) => {
              log('Failed to read XHR response', error);
            });
        });
        (this as any).__leetrack.__listenerAttached = true;
      }

      return originalSend.apply(this, arguments as any);
    };
    (window as any).__LEETRACK_XHR_PATCHED__ = true;
  };

  interceptFetch();
  interceptXhr();
  (window as any).__LEETRACK_NETWORK_READY__ = true;
  log('Network interceptor ready');
})();
