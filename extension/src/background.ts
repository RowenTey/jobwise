function getStorageValue(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result: Record<string, unknown>) => {
      resolve((result[key] as string) ?? null);
    });
  });
}

chrome.runtime.onMessage.addListener(
  (
    request: { type: string; payload: Record<string, unknown> },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; error?: string }) => void
  ) => {
    console.log("[Background] Received message:", request);
    if (request.type !== "SAVE_JOB") return true;

    (async () => {
      try {
        const apiKey = await getStorageValue("apiKey");
        const apiUrl = await getStorageValue("apiUrl");

        if (!apiKey || !apiUrl) {
          sendResponse({ success: false, error: "Extension not configured" });
          return;
        }

        const url = `${apiUrl.replace(/\/+$/, "")}/applications`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify(request.payload),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          sendResponse({ success: false, error: text || `HTTP ${res.status}` });
          return;
        }

        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
    })();

    return true;
  }
);
