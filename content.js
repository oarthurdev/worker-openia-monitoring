// content.js — injeta o script externo de forma compatível com CSP
(() => {
  console.log("🧩 Content script carregado. Preparando injeção segura...");

  // Espera o runtime estar pronto
  function waitForExtensionReady(callback, retries = 10) {
    if (chrome?.runtime?.id) {
      callback();
    } else if (retries > 0) {
      setTimeout(() => waitForExtensionReady(callback, retries - 1), 500);
    } else {
      console.error("❌ Extensão não inicializou a tempo.");
    }
  }

  waitForExtensionReady(() => {
    console.log("🚀 Injetando script seguro via arquivo externo...");

    // ✅ injeta via arquivo externo (sem inline)
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("inject.js");
    script.type = "text/javascript";
    (document.head || document.documentElement).appendChild(script);

    // Conecta com o background
    const port = chrome.runtime.connect({ name: "ChatGPT-Interceptor" });
    console.log("🔗 Conectado ao background");

    // Repassa logs do contexto real
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (event.data?.type === "CHATGPT_INTERCEPT_LOG") {
        port.postMessage({ type: "INTERCEPT_LOG", data: event.data.payload });
      }
    });

    port.onDisconnect.addListener(() => {
      console.warn("⚠ Background desconectado, tentando reconectar...");
      setTimeout(() => location.reload(), 2000);
    });
  });
})();
