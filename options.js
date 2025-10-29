// 🧠 ChatGPT Interceptor - Options logic

document.addEventListener("DOMContentLoaded", () => {
  const serverUrlInput = document.getElementById("server-url");
  const saveButton = document.getElementById("save");
  const clearButton = document.getElementById("clear-logs");
  const logCount = document.getElementById("log-count");

  // Carrega configs salvas
  chrome.storage.local.get(["serverUrl", "interceptLogs"], (data) => {
    if (data.serverUrl) serverUrlInput.value = data.serverUrl;
    if (data.interceptLogs) logCount.textContent = data.interceptLogs.length;
  });

  // Salvar URL personalizada
  saveButton.addEventListener("click", async () => {
    const url = serverUrlInput.value.trim();
    if (!url.startsWith("http")) {
      alert("Insira uma URL válida iniciando com http:// ou https://");
      return;
    }
    await chrome.storage.local.set({ serverUrl: url });
    alert("✅ Configurações salvas!");
  });

  // Limpar logs locais
  clearButton.addEventListener("click", async () => {
    await chrome.storage.local.set({ interceptLogs: [] });
    logCount.textContent = 0;
    alert("🧹 Logs locais limpos!");
  });
});
