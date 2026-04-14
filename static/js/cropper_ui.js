(() => {
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

  const st = document.createElement('style');
  st.textContent = [
    /* ── Overlay ── */
    '.ci-ov{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:99999}',

    /* ── Dialog box ── */
    '.ci-bx{background:#fff;border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:16px;max-width:92vw;max-height:92vh}',

    /* ── Image wrapper ── */
    '.ci-wp{overflow:hidden;max-height:70vh;line-height:0;border-radius:12px}',
    '.ci-wp img{display:block;max-width:100%}',

    /* ── Buttons row ── */
    '.ci-bt{display:flex;justify-content:flex-end;gap:10px}',
    '.ci-bt button{padding:10px 28px;border-radius:980px;font-size:15px;cursor:pointer;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;transition:all .2s ease;outline:none;-webkit-tap-highlight-color:transparent}',

    /* Cancel — ghost style */
    '.ci-cn{background:transparent;color:#0071E3;border:1px solid #0071E3}',
    '.ci-cn:hover{background:#e8f1fb}',
    '.ci-cn:active{background:#d0e5f8;transform:scale(.98)}',

    /* Confirm — filled style */
    '.ci-ok{background:#0071E3;color:#fff;border:none}',
    '.ci-ok:hover{background:#0077ed}',
    '.ci-ok:active{background:#006bd6;transform:scale(.98)}',

    /* ── Cropper UI tweaks ── */
    '.cropper-point.point-n,.cropper-point.point-s,.cropper-point.point-e,.cropper-point.point-w{display:none!important}',
    '.cropper-line{background-color:transparent!important;pointer-events:none!important}',
    '.cropper-dashed{display:none!important}',

    '.cropper-point.point-nw,.cropper-point.point-ne,.cropper-point.point-sw,.cropper-point.point-se{width:22px!important;height:22px!important;background:transparent!important;opacity:1!important;margin:0!important;border:none!important;box-sizing:border-box!important}',
    '.cropper-point.point-nw{border-top:2.5px solid #0071E3!important;border-left:2.5px solid #0071E3!important;top:0!important;left:0!important;border-radius:4px 0 0 0!important}',
    '.cropper-point.point-ne{border-top:2.5px solid #0071E3!important;border-right:2.5px solid #0071E3!important;top:0!important;right:0!important;left:auto!important;border-radius:0 4px 0 0!important}',
    '.cropper-point.point-sw{border-bottom:2.5px solid #0071E3!important;border-left:2.5px solid #0071E3!important;bottom:0!important;left:0!important;top:auto!important;border-radius:0 0 0 4px!important}',
    '.cropper-point.point-se{border-bottom:2.5px solid #0071E3!important;border-right:2.5px solid #0071E3!important;bottom:0!important;right:0!important;top:auto!important;left:auto!important;border-radius:0 0 4px 0!important}',
    '.cropper-view-box{outline:1px solid rgba(0,113,227,.5)!important}'
  ].join('\n');
  document.head.appendChild(st);

  window.cropImage = async (imageUrl) => {
    await load();
    return new Promise((resolve, reject) => {
      const ov  = document.createElement('div');    ov.className  = 'ci-ov';
      const bx  = document.createElement('div');    bx.className  = 'ci-bx';
      const wp  = document.createElement('div');    wp.className  = 'ci-wp';
      const img = document.createElement('img');    img.src       = imageUrl;
      wp.appendChild(img);

      const bt    = document.createElement('div');       bt.className    = 'ci-bt';
      const btnCn = document.createElement('button');    btnCn.className = 'ci-cn'; btnCn.textContent = '取消';
      const btnOk = document.createElement('button');    btnOk.className = 'ci-ok'; btnOk.textContent = '確定';
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