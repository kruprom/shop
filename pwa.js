/* ครูพร้อมสอน — ตัวช่วยแอป (ใช้ร่วมกันทั้งร้านและ /admin/) v12.12
 * C: splash ตอนเปิดจากไอคอน · A: ปุ่มติดตั้งแอป · D: แจ้งเวอร์ชันใหม่ · ลงทะเบียน service worker */
(function () {
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var isAdmin = location.pathname.indexOf('/admin') === 0;
  var root = document.documentElement;

  /* ── C: splash (เฉพาะเปิดจากไอคอนแอป) ── */
  if (standalone) {
    var sp = document.createElement('div');
    sp.id = 'kpsSplash';
    sp.setAttribute('style', 'position:fixed;inset:0;z-index:2147483000;background:#fcfaf7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;transition:opacity .35s');
    sp.innerHTML = '<img src="' + (isAdmin ? '../' : '') + 'logo-kps.png?v=4" alt="" style="width:140px;height:auto;border-radius:22px">' +
      '<div style="width:34px;height:34px;border:4px solid #bae6fd;border-top-color:#0284c7;border-radius:50%;animation:kpsSpin .8s linear infinite"></div>' +
      '<style>@keyframes kpsSpin{to{transform:rotate(360deg)}}</style>';
    root.appendChild(sp);
    var t0 = Date.now();
    var hide = function () {
      var w = Math.max(0, 700 - (Date.now() - t0));
      setTimeout(function () { sp.style.opacity = '0'; setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 400); }, w);
    };
    if (document.readyState === 'complete') hide(); else window.addEventListener('load', hide);
    setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 6000);
  }

  function bar(id, html, bottom) {
    var old = document.getElementById(id); if (old) old.remove();
    var d = document.createElement('div'); d.id = id;
    d.setAttribute('style', 'position:fixed;left:50%;transform:translateX(-50%);bottom:' + (bottom || 84) + 'px;z-index:2147482000;width:min(92%,420px);background:#1e3a8a;color:#fff;border-radius:16px;padding:12px 14px;box-shadow:0 8px 24px rgba(0,0,0,.28);font:700 14px/1.4 Sarabun,sans-serif;display:flex;align-items:center;gap:10px');
    d.innerHTML = html; document.body.appendChild(d); return d;
  }
  var BTN = 'border:0;border-radius:10px;padding:8px 12px;font:800 13px Sarabun,sans-serif;cursor:pointer;';

  /* ── A: ปุ่มติดตั้งแอป ── */
  var dismissed = false; try { dismissed = localStorage.getItem('kps_inst_dismiss') === '1'; } catch (e) {}
  function showInstall(deferred) {
    if (standalone || dismissed || document.getElementById('kpsInstall')) return;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var msg = deferred ? '📲 ติดตั้งแอป ' + (isAdmin ? 'Admin' : 'ครูพร้อมสอน') + ' ไว้ที่หน้าจอมือถือ' :
      '📲 iPhone: กดปุ่มแชร์ <span style="font-size:16px">⬆️</span> แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”';
    var d = bar('kpsInstall', '<div style="flex:1">' + msg + '</div>' +
      (deferred ? '<button id="kpsInstBtn" style="' + BTN + 'background:#fff;color:#1e3a8a">ติดตั้ง</button>' : '') +
      '<button id="kpsInstX" aria-label="ปิด" style="' + BTN + 'background:rgba(255,255,255,.18);color:#fff">✕</button>');
    d.querySelector('#kpsInstX').onclick = function () { dismissed = true; try { localStorage.setItem('kps_inst_dismiss', '1'); } catch (e) {} d.remove(); };
    if (deferred) d.querySelector('#kpsInstBtn').onclick = function () {
      deferred.prompt(); deferred.userChoice.then(function () { d.remove(); });
    };
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); window.__kpsInstall = e;
    window.addEventListener('load', function () { setTimeout(function () { showInstall(e); }, 2500); });
    if (document.readyState === 'complete') setTimeout(function () { showInstall(e); }, 2500);
  });
  window.kpsInstallApp = function () {            // เรียกจากปุ่มในเมนูได้
    try { localStorage.removeItem('kps_inst_dismiss'); } catch (e) {}
    dismissed = false; showInstall(window.__kpsInstall || null);
  };
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone) {
    window.addEventListener('load', function () { setTimeout(function () { showInstall(null); }, 3500); });
  }

  /* ── service worker + D: แจ้งเวอร์ชันใหม่ ── */
  if ('serviceWorker' in navigator) {
    var hadCtl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadCtl) { hadCtl = true; return; }       // ติดตั้งครั้งแรก ไม่ต้องแจ้ง
      var d = bar('kpsUpdate', '<div style="flex:1">✨ มีเวอร์ชันใหม่แล้ว</div><button id="kpsUpBtn" style="' + BTN + 'background:#fff;color:#1e3a8a">อัปเดต</button>', 24);
      d.querySelector('#kpsUpBtn').onclick = function () { location.reload(); };
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/service-worker.js').then(function (reg) {
        var chk = function () { try { reg.update(); } catch (e) {} };
        document.addEventListener('visibilitychange', function () { if (!document.hidden) chk(); });
        setInterval(chk, 30 * 60 * 1000);
      }).catch(function () {});
    });
  }
})();
