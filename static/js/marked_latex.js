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
    // MathJax 需在 marked 前設定 config
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

    // 先佔位保護 LaTeX，避免被 marked 破壞
    const protected_ = markdown.replace(
      /(\$\$[\s\S]*?\$\$)|(\$[^$\n]*?\$)/g,
      (match) => {
        const id = `MATH_${placeholders.length}_PLACEHOLDER`;
        placeholders.push(match);
        return id;
      }
    );

    let html = marked.parse(protected_);

    // 還原 LaTeX
    html = html.replace(/MATH_(\d+)_PLACEHOLDER/g, (_, i) => placeholders[+i]);
    return html;
  }

  // ─── 核心：寫入 DOM 並觸發 MathJax ─────────────────────────────────────────
  async function injectAndTypeset(el, html) {
    el.innerHTML = html;
    if (global.MathJax?.typesetPromise) {
      await MathJax.typesetPromise([el]).catch((e) =>
        console.warn("[MDRenderer] MathJax error:", e)
      );
    }
  }

  // ─── 公開 API ────────────────────────────────────────────────────────────────
  const MDRenderer = {
    /**
     * 直接把 Markdown 字串渲染進指定選擇器
     * @param {string|Element} target  CSS 選擇器或 DOM 元素
     * @param {string} markdown
     */
    async render(target, markdown) {
      await ensureDeps();
      const el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) throw new Error(`[MDRenderer] 找不到元素：${target}`);
      const html = mdToHtml(markdown);
      await injectAndTypeset(el, html);
    },

    /**
     * fetch 遠端或本地 .md 檔並渲染
     * @param {string|Element} target  CSS 選擇器或 DOM 元素
     * @param {string} url            .md 檔的 URL（相對或絕對路徑）
     * @param {RequestInit} [fetchOptions]  fetch 選項（選用）
     */
    async load(target, url, fetchOptions = {}) {
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
        await injectAndTypeset(el, html);
      } catch (e) {
        el.innerHTML = `<p style="color:red">[MDRenderer] 載入失敗：${e.message}</p>`;
        throw e;
      } finally {
        delete el.dataset.mdLoading;
      }
    },

    /**
     * 自動掃描頁面上所有 [data-md-src] 元素並載入
     * 範例：<div data-md-src="./doc.md"></div>
     */
    async autoLoad() {
      const elements = document.querySelectorAll("[data-md-src]");
      if (!elements.length) return;
      await ensureDeps();
      await Promise.all(
        [...elements].map((el) => MDRenderer.load(el, el.dataset.mdSrc))
      );
    },
  };

  // 掛到全域
  global.MDRenderer = MDRenderer;

  // 若頁面有 data-md-src 元素，DOMContentLoaded 後自動啟動
  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("[data-md-src]")) {
      MDRenderer.autoLoad();
    }
  });
})(window);