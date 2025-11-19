let injected = false;

export function injectNetworkInterceptor(): void {
  if (injected) return;
  injected = true;

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/network-interceptor.js');
  script.onload = () => {
    script.remove();
  };
  script.onerror = () => {
    injected = false;
  };

  (document.head || document.documentElement).appendChild(script);
}
