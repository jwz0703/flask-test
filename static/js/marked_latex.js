/**
 * md-renderer.js
 * 純前端 Markdown + LaTeX 渲染模組（無需 Node.js）
 *
 * 依賴（由呼叫端的 HTML 引入，或讓本模組自動注入）：
 *   - marked.js  https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js
 *   - MathJax 3  https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-chtml.min.js
 *
 * 使用方式：
 *   MDRenderer.render(selector, markdownString)
 *   MDRenderer.load(selector, url)
 *   MDRenderer.autoLoad()   // 掃描頁面上所有 data-md-src 屬性
 *
 * CSS 客製化：
 *   MDRenderer.render(selector, md, { theme: 'default' | 'minimal' | 'none' })
 *   或設定全域預設：MDRenderer.defaultTheme = 'minimal'
 */

(function (global) {
  "use strict";

  // ─── 預設 CDN ────────────────────────────────────────────────────────────────
  const CDN = {
    marked:
      "https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js",
    mathjax:
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-chtml.min.js",
  };

  // ─── 內建 CSS 主題 ──────────────────────────────────────────────────────────
  const THEMES = {
    /**
     * default：乾淨現代感，適合大多數場景
     */
    default: `
      .md-body {
        font-family: 'Georgia', 'Noto Serif TC', serif;
        font-size: 16px;
        line-height: 1.8;
        color: #1a1a2e;
        max-width: 780px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        word-break: break-word;
      }

      /* ── 標題 ─────────────────────────────────────── */
      .md-body h1,
      .md-body h2,
      .md-body h3,
      .md-body h4,
      .md-body h5,
      .md-body h6 {
        font-family: 'Helvetica Neue', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
        font-weight: 700;
        line-height: 1.3;
        margin: 2.2rem 0 0.8rem;
        color: #0d0d1a;
        letter-spacing: -0.01em;
      }
      .md-body h1 {
        font-size: 2rem;
        border-bottom: 3px solid var(--primary-color);
        padding-bottom: 0.4rem;
        margin-top: 0;
        
      }
      .md-body h2 {
        font-size: 1.5rem;
        border-bottom: 1px solid #e0e0ef;
        padding-bottom: 0.3rem;
      }
      .md-body h3 { font-size: 1.2rem; color: var(--primary-color); }
      .md-body h4 { font-size: 1.05rem; color: var(--primary-color); }
      .md-body h5 { font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.08em; color: #8b8d92ff; }
      .md-body h6 { font-size: 0.875rem; color: #979898ff; }

      /* ── 段落與正文 ───────────────────────────────── */
      .md-body p {
        margin: 0 0 1.2rem;
      }

      /* ── 連結 ─────────────────────────────────────── */
      .md-body a {
        color: #4f46e5;
        text-decoration: none;
        border-bottom: 1px solid #c7d2fe;
        transition: border-color 0.2s, color 0.2s;
      }
      .md-body a:hover {
        color: #3730a3;
        border-bottom-color: #4f46e5;
      }

      /* ── 粗體 / 斜體 ──────────────────────────────── */
      .md-body strong { font-weight: 700; color: #111827; }
      .md-body em     { font-style: italic; color: #374151; }

      /* ── 清單 ─────────────────────────────────────── */
      .md-body ul,
      .md-body ol {
        margin: 0 0 1.2rem;
        padding-left: 1.6rem;
      }
      .md-body li {
        margin-bottom: 0.35rem;
        line-height: 1.75;
      }
      .md-body ul > li { list-style-type: disc; }
      .md-body ol > li { list-style-type: decimal; }
      .md-body li > ul,
      .md-body li > ol {
        margin: 0.25rem 0 0.25rem 0.8rem;
      }

      /* ── 引用區塊 ─────────────────────────────────── */
      .md-body blockquote {
        margin: 1.5rem 0;
        padding: 0.8rem 1.2rem;
        border-left: 4px solid #6366f1;
        background: #f5f5ff;
        border-radius: 0 8px 8px 0;
        color: #374151;
        font-style: italic;
      }
      .md-body blockquote p { margin: 0; }

      /* ── 行內程式碼 ───────────────────────────────── */
      .md-body code {
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
        font-size: 0.875em;
        background: #eef2ff;
        color: #4338ca;
        padding: 0.15em 0.45em;
        border-radius: 4px;
        border: 1px solid #e0e7ff;
      }

      /* ── 程式碼區塊 ───────────────────────────────── */
      .md-body pre {
        margin: 1.5rem 0;
        padding: 1.25rem 1.5rem;
        background: #1e1e2e;
        border-radius: 10px;
        overflow-x: auto;
        line-height: 1.6;
        border: 1px solid #2d2d44;
      }
      .md-body pre code {
        font-size: 0.88em;
        background: none;
        color: #cdd6f4;
        padding: 0;
        border: none;
        border-radius: 0;
      }

      /* ── 水平分隔線 ───────────────────────────────── */
      .md-body hr {
        border: none;
        border-top: 2px solid #e5e7eb;
        margin: 2.5rem 0;
      }

      /* ── 表格 ─────────────────────────────────────── */
      .md-body table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.93rem;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 0 0 1px #e5e7eb;
      }
      .md-body thead tr {
        background: #4f46e5;
        color: #fff;
      }
      .md-body thead th {
        padding: 0.7rem 1rem;
        text-align: left;
        font-weight: 600;
        font-family: 'Helvetica Neue', sans-serif;
        letter-spacing: 0.02em;
      }
      .md-body tbody tr:nth-child(even) { background: #f8f8ff; }
      .md-body tbody tr:hover            { background: #eff0ff; }
      .md-body td {
        padding: 0.6rem 1rem;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
      }

      /* ── 圖片 ─────────────────────────────────────── */
      .md-body img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1rem 0;
        display: block;
      }

      /* ── 任務清單（GFM） ──────────────────────────── */
      .md-body input[type="checkbox"] {
        margin-right: 0.4em;
        accent-color: #4f46e5;
      }
    `,

    /**
     * minimal：極簡風，適合嵌入其他頁面或 UI 框架中
     */
    minimal: `
      .md-body {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 15px;
        line-height: 1.75;
        color: #111;
        max-width: 100%;
      }
      .md-body h1, .md-body h2, .md-body h3,
      .md-body h4, .md-body h5, .md-body h6 {
        font-weight: 600;
        margin: 1.6em 0 0.5em;
        line-height: 1.3;
      }
      .md-body h1 { font-size: 1.75rem; margin-top: 0; }
      .md-body h2 { font-size: 1.35rem; }
      .md-body h3 { font-size: 1.1rem;  }
      .md-body p  { margin: 0 0 1em; }
      .md-body pre {
        background: #f6f6f6;
        padding: 1em;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 0.875em;
      }
      .md-body code {
        font-family: monospace;
        background: #f0f0f0;
        padding: 0.1em 0.35em;
        border-radius: 3px;
        font-size: 0.875em;
      }
      .md-body pre code { background: none; padding: 0; }
      .md-body blockquote {
        border-left: 3px solid #ccc;
        margin: 1em 0;
        padding: 0.2em 1em;
        color: #555;
      }
      .md-body table { border-collapse: collapse; width: 100%; margin: 1em 0; }
      .md-body th, .md-body td {
        border: 1px solid #ddd;
        padding: 0.5em 0.75em;
        text-align: left;
      }
      .md-body th { background: #f0f0f0; font-weight: 600; }
      .md-body img { max-width: 100%; border-radius: 4px; }
      .md-body hr { border: none; border-top: 1px solid #e0e0e0; margin: 1.5em 0; }
      .md-body a { color: #0066cc; }
      .md-body ul, .md-body ol { padding-left: 1.5em; margin: 0 0 1em; }
    `,

    // 不注入任何樣式，由外部 CSS 全權控制
    none: ``,
  };

  // ─── 全域設定 ────────────────────────────────────────────────────────────────
  let _styleInjected = false;

  function injectStyles(theme) {
    const css = THEMES[theme] || THEMES["default"];
    if (!css) return; // theme === 'none'

    // 每個 theme 只注入一次
    const styleId = `md-renderer-style-${theme}`;
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ─── 工具：動態載入 script ───────────────────────────────────────────────────
  function loadScript(src, onload) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load: ${src}`));
      if (onload) s.onload = () => { onload(); resolve(); };
      document.head.appendChild(s);
    });
  }

  // ─── 工具：確保依賴已載入 ────────────────────────────────────────────────────
  async function ensureDeps() {
    if (!global.MathJax) {
      global.MathJax = {
        tex: {
          inlineMath: [["$", "$"], ["\\(", "\\)"]],
          displayMath: [["$$", "$$"], ["\\[", "\\]"]],
          processEscapes: true,
        },
        startup: { ready() { MathJax.startup.defaultReady(); } },
      };
    }
    if (!global.marked) await loadScript(CDN.marked);
    if (!global.MathJax?.typesetPromise) await loadScript(CDN.mathjax);
  }

  // ─── 核心：Markdown → HTML（保護 LaTeX）────────────────────────────────────
  function mdToHtml(markdown) {
    const placeholders = [];

    const protected_ = markdown.replace(
      /(\$\$[\s\S]*?\$\$)|(\$[^$\n]*?\$)/g,
      (match) => {
        const id = `MATH_${placeholders.length}_PLACEHOLDER`;
        placeholders.push(match);
        return id;
      }
    );

    let html = marked.parse(protected_);

    html = html.replace(/MATH_(\d+)_PLACEHOLDER/g, (_, i) => placeholders[+i]);
    return html;
  }

  // ─── 核心：寫入 DOM 並觸發 MathJax ─────────────────────────────────────────
  async function injectAndTypeset(el, html, theme) {
    // 注入主題樣式
    injectStyles(theme);

    // 確保目標元素帶有 md-body class
    if (!el.classList.contains("md-body")) {
      el.classList.add("md-body");
    }

    el.innerHTML = html;

    if (global.MathJax?.typesetPromise) {
      await MathJax.typesetPromise([el]).catch((e) =>
        console.warn("[MDRenderer] MathJax error:", e)
      );
    }
  }

  // ─── 解析選項 ────────────────────────────────────────────────────────────────
  function resolveTheme(opts) {
    if (opts && opts.theme !== undefined) return opts.theme;
    return MDRenderer.defaultTheme || "default";
  }

  // ─── 公開 API ────────────────────────────────────────────────────────────────
  const MDRenderer = {
    /** 全域預設主題，可設為 'default' | 'minimal' | 'none' */
    defaultTheme: "default",

    /**
     * 直接把 Markdown 字串渲染進指定選擇器
     * @param {string|Element} target
     * @param {string} markdown
     * @param {{ theme?: string }} [opts]
     */
    async render(target, markdown, opts) {
      await ensureDeps();
      const el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) throw new Error(`[MDRenderer] 找不到元素：${target}`);
      const html = mdToHtml(markdown);
      await injectAndTypeset(el, html, resolveTheme(opts));
    },

    /**
     * fetch 遠端或本地 .md 檔並渲染
     * @param {string|Element} target
     * @param {string} url
     * @param {RequestInit} [fetchOptions]
     * @param {{ theme?: string }} [opts]
     */
    async load(target, url, fetchOptions = {}, opts) {
      await ensureDeps();
      const el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) throw new Error(`[MDRenderer] 找不到元素：${target}`);

      el.dataset.mdLoading = "true";
      try {
        const res = await fetch(url, fetchOptions);
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
        const markdown = await res.text();
        const html = mdToHtml(markdown);
        await injectAndTypeset(el, html, resolveTheme(opts));
      } catch (e) {
        el.innerHTML = `<p style="color:red">[MDRenderer] 載入失敗：${e.message}</p>`;
        throw e;
      } finally {
        delete el.dataset.mdLoading;
      }
    },

    /**
     * 自動掃描頁面上所有 [data-md-src] 元素並載入
     * 可選：data-md-theme="minimal" 指定單一元素的主題
     */
    async autoLoad() {
      const elements = document.querySelectorAll("[data-md-src]");
      if (!elements.length) return;
      await ensureDeps();
      await Promise.all(
        [...elements].map((el) =>
          MDRenderer.load(
            el,
            el.dataset.mdSrc,
            {},
            { theme: el.dataset.mdTheme || MDRenderer.defaultTheme }
          )
        )
      );
    },

    /** 取得所有可用主題名稱 */
    get themes() {
      return Object.keys(THEMES);
    },

    /** 注冊自訂主題 */
    registerTheme(name, css) {
      THEMES[name] = css;
    },
  };

  global.MDRenderer = MDRenderer;

  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("[data-md-src]")) {
      MDRenderer.autoLoad();
    }
  });
})(window);