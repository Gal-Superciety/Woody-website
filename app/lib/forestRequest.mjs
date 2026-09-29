// Bound both response headers and body reads; a slow service must not strand the UI.
export async function forestRequest(url, options = {}, timeoutMs = 20000, fetcher = fetch) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('profile_request_timeout'));
    }, timeoutMs);
  });
  try {
    return await Promise.race([deadline, (async () => {
      const response = await fetcher(url, { ...options, signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'profile_service_unavailable');
      return body;
    })()]);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}
