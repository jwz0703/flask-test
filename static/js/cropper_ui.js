(() => {
  /* ── 載入 Cropper.js CDN ── */
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
  document.head.appendChild(css);

  let ready = null;
  const load = () => {
    if (ready) return ready;
    ready = new Promise(resolve => {
      if (window.Cropper) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
      s.onload = resolve;
      document.head.appendChild(s);
    });
    return ready;
  };
  load();

  /* ── 注入樣式 ── */
  const st = document.createElement('style');
  st.textContent = [
    '.ci-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:99999}',
    '.ci-bx{background:#1c1c2e;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:14px;max-width:92vw;max-height:92vh;box-shadow:0 24px 80px rgba(0,0,0,.65)}',
    '.ci-wp{overflow:hidden;max-height:70vh;line-height:0;border-radius:6px}',
    '.ci-wp img{display:block;max-width:100%}',
    '.ci-bt{display:flex;justify-content:flex-end;gap:10px}',
    '.ci-bt button{padding:10px 32px;border:none;border-radius:8px;font-size:15px;cursor:pointer;font-weight:600;transition:all .15s;outline:none}',
    '.ci-cn{background:#2a2a3d;color:#999}',
    '.ci-cn:hover{background:#38384f;color:#fff}',
    '.ci-ok{background:#6366f1;color:#fff}',
    '.ci-ok:hover{background:#4f46e5}',
    /* 隱藏邊中點與邊線 */
    '.cropper-point.point-n,.cropper-point.point-s,.cropper-point.point-e,.cropper-point.point-w{display:none!important}',
    '.cropper-line{background-color:transparent!important;pointer-events:none!important}',
    /* 隱藏九宮格虛線 */
    '.cropper-dashed{display:none!important}',
    /* 四角共用：重設大小、背景、邊框、margin */
    '.cropper-point.point-nw,.cropper-point.point-ne,.cropper-point.point-sw,.cropper-point.point-se{width:24px!important;height:24px!important;background:transparent!important;opacity:1!important;margin:0!important;border:none!important;box-sizing:border-box!important}',
    /* 左上 */
    '.cropper-point.point-nw{border-top:3px solid #fff!important;border-left:3px solid #fff!important;top:0!important;left:0!important}',
    /* 右上 */
    '.cropper-point.point-ne{border-top:3px solid #fff!important;border-right:3px solid #fff!important;top:0!important;right:0!important;left:auto!important}',
    /* 左下 */
    '.cropper-point.point-sw{border-bottom:3px solid #fff!important;border-left:3px solid #fff!important;bottom:0!important;left:0!important;top:auto!important}',
    /* 右下 */
    '.cropper-point.point-se{border-bottom:3px solid #fff!important;border-right:3px solid #fff!important;bottom:0!important;right:0!important;top:auto!important;left:auto!important}',
    '.cropper-view-box{outline:1px solid rgba(255,255,255,.45)!important}'
  ].join('\n');
  document.head.appendChild(st);

  /* ── cropImage(imageUrl) → Promise<Blob> ── */
  window.cropImage = async (imageUrl) => {
    await load();

    return new Promise((resolve, reject) => {
      const ov = document.createElement('div');     ov.className = 'ci-ov';
      const bx = document.createElement('div');     bx.className = 'ci-bx';
      const wp = document.createElement('div');     wp.className = 'ci-wp';
      const img = document.createElement('img');    img.src = imageUrl;
      wp.appendChild(img);

      const bt = document.createElement('div');       bt.className = 'ci-bt';
      const btnCn = document.createElement('button'); btnCn.className = 'ci-cn'; btnCn.textContent = '取消';
      const btnOk = document.createElement('button'); btnOk.className = 'ci-ok'; btnOk.textContent = '確定';
      bt.appendChild(btnCn);
      bt.appendChild(btnOk);
      bx.appendChild(wp);
      bx.appendChild(bt);
      ov.appendChild(bx);
      document.body.appendChild(ov);

      const cropper = new Cropper(img, {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.75,
        responsive: true,
        guides: false,
        center: false,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false
      });

      let closed = false;
      const close = (blob) => {
        if (closed) return;
        closed = true;
        cropper.destroy();
        ov.remove();
        if (blob) resolve(blob);
        else reject(new Error('使用者取消裁切'));
      };

      btnCn.onclick = () => close(null);
      ov.addEventListener('click', (e) => { if (e.target === ov) close(null); });
      btnOk.onclick = () => {
        const canvas = cropper.getCroppedCanvas();
        canvas.toBlob((blob) => close(blob), 'image/png');
      };
    });
  };
})();