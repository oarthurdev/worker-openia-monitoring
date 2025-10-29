# ChatGPT Interceptor - Extension

**Versão:** 1.0.0  
**Autor:** Vortex Hub

---

## Resumo
Extensão Chrome/Edge (Manifest V3) para **interceptar** requisições do ChatGPT (fetch + XHR) no contexto da página, enviar logs para um servidor local (ex.: `http://localhost:5000/api/chatgpt-intercept`), e exibir um **painel visual de debug** (console flutuante) no canto da página.

Use com responsabilidade — esta extensão captura tráfego de API e pode conter informações sensíveis.

---

## Estrutura do projeto
- `manifest.json` — manifesto MV3.
- `background.js` — service worker; recebe logs via `port` persistente e envia ao servidor; salva logs offline.
- `content.js` — content script que injeta `inject.js` na página de forma compatível com CSP e mantém a conexão com o background.
- `inject.js` — script executado no *contexto da página*; intercepta `fetch` e `XMLHttpRequest`, exibe o painel visual e envia logs para o content script via `window.postMessage`.
- `options.html` / `options.js` — interface para configurar `SERVER_URL` e limpar logs.
- `icon.png` — ícone (opcional).

---

## Instalação (modo desenvolvedor)
1. Acesse `chrome://extensions` (ou `edge://extensions` no Edge).
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** (Load unpacked) e selecione a pasta do projeto (a pasta que contém `manifest.json`).
4. Recarregue a extensão sempre que alterar arquivos.

---

## Uso
1. Abra `https://chat.openai.com/` (ou `https://chatgpt.com/`).
2. Abra o DevTools (F12) e observe:
   - Console do Service Worker (em `chrome://extensions` → Inspecionar views) para logs de envio ao servidor.
   - Na página do ChatGPT você verá o painel flutuante com requisições interceptadas.
3. Configure o endpoint do servidor (ex.: `http://localhost:5000/api/chatgpt-intercept`) em **Extensão → Opções** (Options). Ou abra `options.html` via botão da extensão.

---

## Backend (recomendado)
Crie um endpoint HTTP `POST /api/chatgpt-intercept` que aceite JSON. Para desenvolvimento com **FastAPI**, habilite CORS. Exemplo mínimo:

```py
# server.py (FastAPI)
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*", "http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chatgpt-intercept")
async def intercept(req: Request):
    payload = await req.json()
    print("Intercepted:", payload.get("url"))
    return {"ok": True}
```

**Nota:** Para extensões, o valor de `origin` pode ser algo como `chrome-extension://<EXT_ID>` — você pode usar `allow_origins=["*"]` durante dev (temporariamente) ou listar especificamente.

---

## Troubleshooting / Dicas importantes

- **`Extension context invalidated`**: normal no MV3. O content script tenta reconectar; implementamos backoff e fila de mensagens para garantir que nada se perca.
- **CSP / Inline script blocked**: resolvido injetando `inject.js` como recurso `web_accessible_resources` e carregando via `chrome.runtime.getURL()` — evita hashes/nonce.
- **CORS / Failed to fetch**: verifique o servidor backend e habilite CORS (veja exemplo FastAPI acima). Também confira `host_permissions` no `manifest.json`.
- **Service Worker "dorme"**: a extensão usa `chrome.runtime.connect()` com fila; ainda assim, abra o painel de background (inspecionar views) durante testes para ver logs.
- **Não vejo toasts**: confirme que `inject.js` foi carregado (Procure log `[Interceptor] Ativo no contexto da página!` no console da página). Se o site bloquear recursos, verifique `web_accessible_resources` no manifest.

---

## Segurança & Privacidade
- Esta extensão captura tráfego que pode conter dados sensíveis. **Use apenas em ambientes de desenvolvimento ou com consentimento**.
- Não deixe `SERVER_URL` apontando para servidores públicos sem autenticação.

---

## Como contribuir / próximos passos
- Adicionar filtros por endpoint (ex.: ignorar telemetry).
- Habilitar gravação seletiva de requisições/respostas.
- Adicionar UI de replay/inspeção de payloads no painel.
- Persistir logs em IndexedDB para análise offline.

---