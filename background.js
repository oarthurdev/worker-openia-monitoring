// 🚀 ChatGPT Interceptor - background.js (canal persistente com reconexão)
console.log("🛰️ Service Worker inicializado!");

// Cache para logs recebidos enquanto o servidor está offline
let pendingLogs = [];

// Função auxiliar para enviar dados ao servidor configurado
async function sendToServer(data) {
  const { serverUrl = "http://localhost:5000/api/chatgpt-intercept" } =
    (await chrome.storage.local.get("serverUrl")) || {};

  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    console.log(`✅ Log enviado para ${serverUrl}`);
    return true;
  } catch (err) {
    console.warn("⚠ Falha ao enviar log, salvando localmente:", err.message);

    // Armazena localmente se falhar
    pendingLogs.push({ ...data, error: err.message, offline: true });
    await chrome.storage.local.set({ interceptLogs: pendingLogs });
    return false;
  }
}

// Reenvia logs locais quando o SW acordar
chrome.runtime.onStartup.addListener(async () => {
  const { interceptLogs = [] } = await chrome.storage.local.get("interceptLogs");
  if (interceptLogs.length > 0) {
    console.log(`🔁 Reenviando ${interceptLogs.length} logs pendentes...`);
    for (const log of interceptLogs) await sendToServer(log);
    await chrome.storage.local.set({ interceptLogs: [] });
    pendingLogs = [];
  }
});

// Mantém conexão aberta com cada aba do ChatGPT
chrome.runtime.onConnect.addListener((port) => {
  console.log(`🔌 Conexão estabelecida com: ${port.name}`);

  port.onMessage.addListener(async (message) => {
    if (message.type === "INTERCEPT_LOG") {
      const logData = {
        ...message.data,
        source: message.data.source || "unknown",
        timestamp: new Date().toISOString(),
      };

      console.log("📩 Log recebido:", logData);
      await sendToServer(logData);
    }
  });

  port.onDisconnect.addListener(() => {
    console.warn("❌ Conexão perdida com content script:", port.name);
  });
});

// Limpa logs antigos ao instalar
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ interceptLogs: [] });
  console.log("✨ Extensão instalada e storage limpo!");
});
