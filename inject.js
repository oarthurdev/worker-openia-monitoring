(() => {
  console.log("%c[Interceptor] Ativo no contexto da página!", "color:#4CAF50;font-weight:bold;");

  // Espera o DOM estar pronto antes de injetar UI
  function onDOMReady(cb) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      cb();
    } else {
      document.addEventListener("DOMContentLoaded", cb, { once: true });
    }
  }

  onDOMReady(() => {
    // === 🔧 Criação do painel visual ===
    const panel = document.createElement("div");
    Object.assign(panel.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "380px",
      maxHeight: "45vh",
      background: "rgba(0,0,0,0.9)",
      color: "#0f0",
      fontFamily: "monospace",
      fontSize: "12px",
      borderRadius: "8px",
      padding: "8px",
      overflowY: "auto",
      boxShadow: "0 0 10px rgba(0,255,0,0.3)",
      zIndex: "999999",
      display: "flex",
      flexDirection: "column",
      transition: "opacity 0.3s ease",
    });

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "5px";
    header.innerHTML = `
      <span style="font-weight:bold; color:#0f0;">🧠 ChatGPT Interceptor Console</span>
      <div>
        <button id="toggle" style="margin-right:6px;">−</button>
        <button id="clear">🗑</button>
      </div>
    `;

    const logContainer = document.createElement("div");
    Object.assign(logContainer.style, {
      flexGrow: "1",
      overflowY: "auto",
      scrollbarWidth: "thin",
      scrollbarColor: "#0f0 #000",
    });

    const counter = document.createElement("div");
    counter.textContent = "Interceptadas: 0";
    counter.style.marginTop = "5px";
    counter.style.textAlign = "right";
    counter.style.color = "#aaa";

    panel.appendChild(header);
    panel.appendChild(logContainer);
    panel.appendChild(counter);
    document.body.appendChild(panel);

    let logCount = 0;
    let minimized = false;

    // === 🧩 Funções de controle ===
    header.querySelector("#clear").onclick = () => {
      logContainer.innerHTML = "";
      logCount = 0;
      counter.textContent = "Interceptadas: 0";
    };

    header.querySelector("#toggle").onclick = () => {
      minimized = !minimized;
      logContainer.style.display = minimized ? "none" : "block";
      counter.style.display = minimized ? "none" : "block";
      header.querySelector("#toggle").textContent = minimized ? "+" : "−";
    };

    // === 🧾 Função para adicionar logs ===
    function showLog({ type, url, method }) {
      const item = document.createElement("div");
      item.textContent = `[${type.toUpperCase()}] ${method} → ${url}`;
      Object.assign(item.style, {
        color: "#0f0",
        marginBottom: "3px",
        borderBottom: "1px solid rgba(0,255,0,0.2)",
        paddingBottom: "2px",
        wordBreak: "break-all",
      });
      logContainer.appendChild(item);
      logContainer.scrollTop = logContainer.scrollHeight;
      counter.textContent = `Interceptadas: ${++logCount}`;
    }

    // === 🔥 Lógica de interceptação ===
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    function notifyExtension(payload) {
      showLog(payload);
      window.postMessage({ type: "CHATGPT_INTERCEPT_LOG", payload }, "*");
    }

    // Intercepta fetch()
    window.fetch = async function (...args) {
      const [input, init] = args;
      const url = typeof input === "string" ? input : input.url;

      if (url.includes("api.openai.com") || url.includes("chatgpt.com/backend-api")) {
        const bodyPreview =
          init?.body && typeof init.body === "string"
            ? init.body.slice(0, 1500)
            : init?.body
            ? "[binary body]"
            : null;

        notifyExtension({
          source: "fetch",
          url,
          method: init?.method || "GET",
          headers: init?.headers || {},
          bodyPreview,
          timestamp: new Date().toISOString(),
          type: "fetch",
        });
      }

      return originalFetch(...args);
    };

    // Intercepta XHR
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this._method = method;
      this._url = url;
      return originalXHROpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (body) {
      if (
        this._url &&
        (this._url.includes("api.openai.com") || this._url.includes("chatgpt.com/backend-api"))
      ) {
        const bodyPreview =
          typeof body === "string" ? body.slice(0, 1500) : body ? "[binary body]" : null;

        notifyExtension({
          source: "xhr",
          url: this._url,
          method: this._method,
          bodyPreview,
          timestamp: new Date().toISOString(),
          type: "xhr",
        });
      }
      return originalXHRSend.call(this, body);
    };
  });
})();
