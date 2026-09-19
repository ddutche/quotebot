// Quotebot customer chat widget.
// Zero dependencies, plain browser JavaScript, one <script> tag, Shadow DOM isolated.
//
// Embed contract:
//   <script src=".../widget.js" data-client="<clientId>"
//           data-mode="floating|inline" data-target="<css selector>"
//           data-open="true" async></script>
//
// This file is copied unchanged to public/widget.js by scripts/build-widget.mjs.

(function () {
  "use strict";

  var TAG = "quotebot-widget";
  var MAX_PHOTOS = 3;
  var MAX_SIDE = 1600;
  var JPEG_QUALITY = 0.8;
  var GREETING = "Hi! Tell me what needs fixing and I'll get you a quick estimate. A photo helps.";

  // ---------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------

  function digitsOnly(phone) {
    return String(phone || "").replace(/[^\d+]/g, "");
  }

  function findScript() {
    return (
      document.currentScript ||
      document.querySelector('script[src*="widget.js"][data-client]')
    );
  }

  function loadImageEl(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("decode failed"));
      };
      img.src = url;
    });
  }

  /** Decodes an image file, draws it at <=1600px on the longest side, returns a JPEG data URL. */
  async function shrinkToJpeg(file) {
    var source = null;
    var objectUrl = null;
    try {
      source = await createImageBitmap(file);
    } catch (e) {
      source = await loadImageEl(file);
      objectUrl = source.src;
    }
    var width = source.width;
    var height = source.height;
    if (!width || !height) throw new Error("decode failed");
    var scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    var w = Math.max(1, Math.round(width * scale));
    var h = Math.max(1, Math.round(height * scale));
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(source, 0, 0, w, h);
    if (typeof source.close === "function") source.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }

  function ensureFontLoaded(family) {
    if (!family) return;
    window.__qbFonts = window.__qbFonts || Object.create(null);
    if (window.__qbFonts[family]) return;
    window.__qbFonts[family] = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(family).replace(/%20/g, "+") +
      ":wght@400;700&display=swap";
    document.head.appendChild(link);
  }

  // ---------------------------------------------------------------------
  // Stylesheet (all values come from --qb-* custom properties set from the theme)
  // ---------------------------------------------------------------------

  var CSS_TEXT = [
    '*, *::before, *::after { box-sizing: border-box; }',
    '.qb-root { font-family: var(--qb-font); color: var(--qb-color-text); font-size: var(--qb-text-base);',
    '  line-height: var(--qb-leading-normal); font-weight: var(--qb-weight-regular); position: relative; }',
    'button, input, select, textarea { font: inherit; color: inherit; }',
    'a { color: inherit; }',

    ':host(.qb-floating) { position: fixed; right: var(--qb-space-5); bottom: var(--qb-space-5);',
    '  z-index: 2147483000; display: block; }',
    ':host(.qb-inline) { display: block; width: 100%; }',

    '.qb-launcher { display: inline-flex; align-items: center; justify-content: center;',
    '  min-height: var(--qb-tap-target); min-width: var(--qb-tap-target); padding: var(--qb-space-2) var(--qb-space-4);',
    '  border: none; border-radius: var(--qb-radius-pill); background: var(--qb-color-brand); color: var(--qb-color-brand-contrast);',
    '  font-weight: var(--qb-weight-bold); font-size: var(--qb-text-base); box-shadow: var(--qb-shadow-button); cursor: pointer;',
    '  transition: transform var(--qb-motion-fast) ease; }',
    '.qb-launcher:hover { transform: scale(1.03); }',
    '.qb-launcher:focus-visible { outline: 1px solid var(--qb-color-brand); outline-offset: 1px; }',
    ':host(.qb-open) .qb-launcher { display: none; }',

    ':host(.qb-floating) .qb-panel { position: absolute; right: 0; bottom: calc(var(--qb-tap-target) + var(--qb-space-3));',
    '  width: var(--qb-widget-width); max-height: var(--qb-widget-max-height); display: flex; flex-direction: column;',
    '  background: var(--qb-color-surface); border-radius: var(--qb-radius-lg); box-shadow: var(--qb-shadow-panel); overflow: hidden; }',
    ':host(.qb-inline) .qb-panel { position: relative; width: 100%; height: min(var(--qb-widget-max-height), 640px);',
    '  display: flex; flex-direction: column; background: var(--qb-color-surface); border-radius: var(--qb-radius-lg);',
    '  box-shadow: var(--qb-shadow-panel); overflow: hidden; }',
    '.qb-panel[hidden] { display: none !important; }',

    '@media (max-width: 639px) {',
    // Full screen only while open. Closed, the host is just the launcher, so the page stays tappable.
    '  :host(.qb-floating.qb-open) { right: 0; bottom: 0; left: 0; top: 0; }',
    '  :host(.qb-floating) .qb-panel { position: fixed; inset: 0; width: 100%; height: 100dvh; max-height: 100dvh; border-radius: 0; }',
    '}',

    '.qb-header { display: flex; align-items: center; gap: var(--qb-space-3); padding: var(--qb-space-4);',
    '  border-bottom: 1px solid var(--qb-color-border); flex: 0 0 auto; }',
    '.qb-logo { width: var(--qb-space-7); height: var(--qb-space-7); object-fit: contain; border-radius: var(--qb-radius-sm); flex: 0 0 auto; }',
    '.qb-header-text { flex: 1 1 auto; min-width: 0; }',
    '.qb-business-name { font-weight: var(--qb-weight-bold); font-size: var(--qb-text-base); overflow: hidden;',
    '  text-overflow: ellipsis; white-space: nowrap; }',
    '.qb-reply-note, .qb-demo-note { color: var(--qb-color-text-muted); font-size: var(--qb-text-sm); }',
    '.qb-close-btn { flex: 0 0 auto; min-width: var(--qb-tap-target); min-height: var(--qb-tap-target); border: none;',
    '  background: transparent; font-size: var(--qb-text-xl); line-height: var(--qb-leading-tight); cursor: pointer;',
    '  border-radius: var(--qb-radius-sm); }',
    '.qb-close-btn:hover { background: var(--qb-color-surface-muted); }',
    '.qb-close-btn:focus-visible { outline: 1px solid var(--qb-color-brand); outline-offset: 1px; }',

    '.qb-messages { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: var(--qb-space-4); display: flex; flex-direction: column;',
    '  gap: var(--qb-space-3); }',
    '.qb-row { display: flex; flex-direction: column; gap: var(--qb-space-2); max-width: 100%; }',
    '.qb-row-assistant { align-items: flex-start; }',
    '.qb-row-user { align-items: flex-end; }',

    '.qb-bubble { max-width: 85%; padding: var(--qb-space-3) var(--qb-space-4); border-radius: var(--qb-radius-md);',
    '  font-size: var(--qb-text-base); white-space: pre-wrap; word-break: break-word; }',
    '.qb-bubble-assistant { background: var(--qb-color-surface-muted); color: var(--qb-color-text); }',
    '.qb-bubble-user { background: var(--qb-color-brand); color: var(--qb-color-brand-contrast); }',

    '.qb-bubble-thumbs, .qb-tray-thumbs { display: flex; gap: var(--qb-space-2); flex-wrap: wrap; margin-top: var(--qb-space-2); }',
    '.qb-bubble-thumb { width: var(--qb-space-8); height: var(--qb-space-8); object-fit: cover; border-radius: var(--qb-radius-sm); }',

    '.qb-call-link { display: inline-flex; align-items: center; min-height: var(--qb-tap-target); color: var(--qb-color-brand-text);',
    '  font-size: var(--qb-text-base); text-decoration: underline; align-self: flex-start; }',

    '.qb-quick-replies { display: flex; flex-wrap: wrap; gap: var(--qb-space-2); }',
    '.qb-chip { min-height: var(--qb-tap-target); padding: var(--qb-space-2) var(--qb-space-4); border-radius: var(--qb-radius-pill);',
    '  border: 1px solid var(--qb-color-border); background: var(--qb-color-surface); color: var(--qb-color-text);',
    '  font-size: var(--qb-text-base); cursor: pointer; }',
    '.qb-chip:hover { background: var(--qb-color-surface-muted); }',
    '.qb-chip:focus-visible { outline: 1px solid var(--qb-color-brand); outline-offset: 1px; }',

    '.qb-card { margin-top: var(--qb-space-2); padding: var(--qb-space-4); border: 1px solid var(--qb-color-border);',
    '  border-radius: var(--qb-radius-lg); background: var(--qb-color-surface); max-width: 100%; width: 100%; }',
    '.qb-estimate-range { font-size: var(--qb-text-2xl); font-weight: var(--qb-weight-bold); margin-bottom: var(--qb-space-3); }',
    '.qb-includes-label { font-weight: var(--qb-weight-bold); font-size: var(--qb-text-sm); margin: 0 0 var(--qb-space-1) 0; }',
    '.qb-includes-list { margin: 0 0 var(--qb-space-3) 0; padding-left: var(--qb-space-5); font-size: var(--qb-text-sm); }',
    '.qb-disclaimer { font-size: var(--qb-text-base); color: var(--qb-color-text-muted); margin: 0 0 var(--qb-space-3) 0; }',
    '.qb-card-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--qb-space-3); }',

    '.qb-btn { min-height: var(--qb-tap-target); padding: var(--qb-space-2) var(--qb-space-4); border-radius: var(--qb-radius-md);',
    '  font-size: var(--qb-text-base); font-weight: var(--qb-weight-bold); cursor: pointer; border: none; text-decoration: none;',
    '  display: inline-flex; align-items: center; justify-content: center; }',
    '.qb-btn-primary { background: var(--qb-color-brand); color: var(--qb-color-brand-contrast); }',
    '.qb-btn-secondary { background: var(--qb-color-surface-muted); color: var(--qb-color-text); }',
    '.qb-btn-link { background: transparent; color: var(--qb-color-brand-text); text-decoration: underline;',
    '  font-weight: var(--qb-weight-regular); padding-left: 0; padding-right: 0; }',
    '.qb-btn:focus-visible { outline: 1px solid var(--qb-color-brand); outline-offset: 1px; }',

    '.qb-handoff-heading { font-size: var(--qb-text-lg); font-weight: var(--qb-weight-bold); margin: 0 0 var(--qb-space-2) 0; }',
    '.qb-handoff-card p { font-size: var(--qb-text-base); margin: 0 0 var(--qb-space-3) 0; }',

    '.qb-lead-form { display: flex; flex-direction: column; gap: var(--qb-space-3); margin-top: var(--qb-space-3); }',
    '.qb-field { display: flex; flex-direction: column; gap: var(--qb-space-1); }',
    '.qb-field label { font-size: var(--qb-text-sm); font-weight: var(--qb-weight-bold); }',
    '.qb-field input, .qb-field select { min-height: var(--qb-tap-target); padding: var(--qb-space-2) var(--qb-space-3);',
    '  border: 1px solid var(--qb-color-border); border-radius: var(--qb-radius-md); background: var(--qb-color-surface);',
    '  font-size: var(--qb-text-base); width: 100%; }',
    '.qb-field input:focus-visible, .qb-field select:focus-visible { outline: 1px solid var(--qb-color-brand); outline-offset: 1px; }',
    '.qb-field-error { color: var(--qb-color-danger); font-size: var(--qb-text-sm); }',
    '.qb-field-error[hidden] { display: none; }',
    '.qb-field-checkbox { flex-direction: row; align-items: center; gap: var(--qb-space-2); min-height: var(--qb-tap-target); }',
    '.qb-field-checkbox input { width: var(--qb-space-5); height: var(--qb-space-5); min-height: 0; flex: 0 0 auto; }',
    '.qb-field-checkbox label { font-weight: var(--qb-weight-regular); cursor: pointer; }',
    '.qb-lead-actions { display: flex; gap: var(--qb-space-3); }',
    '.qb-lead-status { font-size: var(--qb-text-base); margin: 0; }',
    '.qb-lead-done { font-size: var(--qb-text-base); font-weight: var(--qb-weight-bold); color: var(--qb-color-success); margin: var(--qb-space-3) 0 0 0; }',

    '.qb-photo-tray { padding: 0 var(--qb-space-4); flex: 0 0 auto; }',
    '.qb-tray-thumb { position: relative; width: var(--qb-space-8); height: var(--qb-space-8); }',
    '.qb-tray-thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--qb-radius-sm); }',
    '.qb-tray-remove { position: absolute; top: calc(-1 * var(--qb-space-3)); right: calc(-1 * var(--qb-space-3));',
    '  min-width: var(--qb-tap-target); min-height: var(--qb-tap-target); border-radius: var(--qb-radius-md);',
    '  border: 1px solid var(--qb-color-border); background: var(--qb-color-surface); color: var(--qb-color-text);',
    '  font-size: var(--qb-text-sm); line-height: var(--qb-leading-tight); cursor: pointer; padding: 0; }',
    '.qb-tray-notice { font-size: var(--qb-text-sm); color: var(--qb-color-text-muted); margin: var(--qb-space-2) 0 0 0; }',

    '.qb-input-bar { display: flex; align-items: flex-end; gap: var(--qb-space-2); padding: var(--qb-space-4);',
    '  border-top: 1px solid var(--qb-color-border); flex: 0 0 auto; }',
    '.qb-text-input { flex: 1 1 auto; min-width: 0; min-height: var(--qb-tap-target);',
    '  max-height: calc(var(--qb-text-base) * var(--qb-leading-normal) * 5 + var(--qb-space-2) * 2);',
    '  padding: var(--qb-space-2) var(--qb-space-3); border: 1px solid var(--qb-color-border); border-radius: var(--qb-radius-md);',
    '  background: var(--qb-color-surface); color: var(--qb-color-text); font: inherit; line-height: var(--qb-leading-normal);',
    '  resize: none; overflow-y: hidden; box-sizing: border-box; }',
    '.qb-text-input:focus-visible { outline: 1px solid var(--qb-color-brand); outline-offset: 1px; }',
    '.qb-icon-btn { flex: 0 0 auto; min-width: var(--qb-tap-target); min-height: var(--qb-tap-target);',
    '  padding: var(--qb-space-2) var(--qb-space-3); border: 1px solid var(--qb-color-border); border-radius: var(--qb-radius-md);',
    '  background: var(--qb-color-surface); color: var(--qb-color-text); font-size: var(--qb-text-sm); cursor: pointer; }',
    '.qb-icon-btn:disabled, .qb-text-input:disabled { opacity: 0.5; cursor: default; }',
    '.qb-icon-btn:focus-visible { outline: 1px solid var(--qb-color-brand); outline-offset: 1px; }',
    '.qb-send-btn { background: var(--qb-color-brand); color: var(--qb-color-brand-contrast); border-color: var(--qb-color-brand);',
    '  font-weight: var(--qb-weight-bold); }',

    '.qb-inline-link { color: inherit; text-decoration: underline; }',

    '@media (prefers-reduced-motion: reduce) { .qb-root * { transition: none !important; animation: none !important; } }',
  ].join("\n");

  // ---------------------------------------------------------------------
  // Custom element
  // ---------------------------------------------------------------------

  function QuotebotWidgetFactory() {
    class QuotebotWidget extends HTMLElement {
      constructor() {
        super();
        this._shadow = this.attachShadow({ mode: "open" });
        this._state = {
          config: null,
          turns: [], // { role, content, photoCount }
          job: null,
          open: false,
          loading: false,
          pendingPhotos: [], // { dataUrl }
          sentPhotoTotal: 0,
          photoNotice: null, // 'limit' | 'decode' | null
        };
        this._greeted = false;
        this._quickRepliesEl = null;
      }

      connectedCallback() {
        if (this._initialized) return;
        this._initialized = true;
        var cfg = this.qbInit || {};
        this._clientId = cfg.clientId;
        this._mode = cfg.mode === "inline" ? "inline" : "floating";
        this._startOpen = !!cfg.startOpen;
        this._base = cfg.base;
        this._buildSkeleton();
        this._loadConfig();
      }

      // -- setup ------------------------------------------------------

      _buildSkeleton() {
        var style = document.createElement("style");
        style.textContent = CSS_TEXT;
        this._shadow.appendChild(style);

        var root = document.createElement("div");
        root.className = "qb-root";
        this._shadow.appendChild(root);

        this.classList.add(this._mode === "inline" ? "qb-inline" : "qb-floating");

        if (this._mode === "floating") {
          this._launcherEl = this._buildLauncher();
          root.appendChild(this._launcherEl);
        }

        var panel = document.createElement("div");
        panel.className = "qb-panel";
        panel.setAttribute("role", this._mode === "floating" ? "dialog" : "region");
        panel.setAttribute("aria-label", "Chat");
        if (this._mode === "floating") panel.hidden = !this._startOpen;
        this._panelEl = panel;
        root.appendChild(panel);

        this._headerEl = document.createElement("div");
        this._headerEl.className = "qb-header";
        panel.appendChild(this._headerEl);

        var messages = document.createElement("div");
        messages.className = "qb-messages";
        messages.setAttribute("aria-live", "polite");
        panel.appendChild(messages);
        this._messagesEl = messages;

        var tray = document.createElement("div");
        tray.className = "qb-photo-tray";
        panel.appendChild(tray);
        this._trayEl = tray;

        panel.appendChild(this._buildInputBar());
        this._setInputDisabled(true);

        if (this._mode === "floating") {
          var self = this;
          document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && self._state.open) self._close();
          });
          if (this._startOpen) {
            this._state.open = true;
            this.classList.add("qb-open");
            if (this._launcherEl) this._launcherEl.setAttribute("aria-expanded", "true");
          }
        } else {
          this._state.open = true;
        }
      }

      _buildLauncher() {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "qb-launcher";
        btn.textContent = "Get a price";
        btn.setAttribute("aria-label", "Get a price estimate");
        btn.setAttribute("aria-expanded", "false");
        var self = this;
        btn.addEventListener("click", function () {
          self._open();
        });
        return btn;
      }

      _buildInputBar() {
        var form = document.createElement("form");
        form.className = "qb-input-bar";

        var textInput = document.createElement("textarea");
        textInput.rows = 1;
        textInput.className = "qb-text-input";
        textInput.setAttribute("aria-label", "Message");
        textInput.setAttribute("maxlength", "2000");
        textInput.setAttribute("enterkeyhint", "send");
        textInput.placeholder = "Describe the job";

        var photoBtn = document.createElement("button");
        photoBtn.type = "button";
        photoBtn.className = "qb-icon-btn";
        photoBtn.setAttribute("aria-label", "Add a photo");
        photoBtn.textContent = "Photo";

        var fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.multiple = true;
        fileInput.hidden = true;

        var sendBtn = document.createElement("button");
        sendBtn.type = "submit";
        sendBtn.className = "qb-icon-btn qb-send-btn";
        sendBtn.setAttribute("aria-label", "Send message");
        sendBtn.textContent = "Send";

        form.appendChild(textInput);
        form.appendChild(photoBtn);
        form.appendChild(fileInput);
        form.appendChild(sendBtn);

        var self = this;
        photoBtn.addEventListener("click", function () {
          fileInput.click();
        });
        fileInput.addEventListener("change", function (e) {
          self._onFileChange(e);
        });
        // Explicit Enter handling: implicit form submit isn't reliable on every host page.
        // Enter sends; Shift+Enter inserts a newline (default textarea behavior, so just skip send).
        textInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && !e.isComposing && !e.shiftKey) {
            e.preventDefault();
            form.requestSubmit();
          }
        });
        textInput.addEventListener("input", function () {
          self._autoGrowInput();
        });
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var text = textInput.value;
          textInput.value = "";
          self._autoGrowInput();
          self._send(text);
        });

        this._textInput = textInput;
        this._sendBtn = sendBtn;
        this._photoBtn = photoBtn;
        this._fileInput = fileInput;
        return form;
      }

      // -- config load --------------------------------------------------

      async _loadConfig() {
        try {
          var res = await fetch(this._base + "/api/client/" + encodeURIComponent(this._clientId));
          if (!res.ok) throw new Error("config failed");
          var cfg = await res.json();
          this._state.config = cfg;
          this._applyTheme(cfg);
          this._renderReady(cfg);
        } catch (e) {
          this._appendErrorBubble();
        }
      }

      _applyTheme(cfg) {
        var theme = cfg.theme || {};
        for (var k in theme) {
          if (Object.prototype.hasOwnProperty.call(theme, k)) this.style.setProperty(k, theme[k]);
        }
        ensureFontLoaded(cfg.font);
      }

      _renderReady(cfg) {
        var header = this._buildHeader(cfg);
        this._headerEl.replaceWith(header);
        this._headerEl = header;
        var label = cfg.business_name || (this._mode === "floating" ? "Chat" : "Estimate chat");
        this._panelEl.setAttribute("aria-label", label);
        this._setInputDisabled(false);

        if (!this._greeted) {
          this._greeted = true;
          this._state.turns.push({ role: "assistant", content: GREETING, photoCount: 0 });
          this._appendBotBubble(GREETING);
        }

        if (this._mode === "floating" && this._startOpen) this._focusInput();
      }

      _buildHeader(cfg) {
        var header = document.createElement("div");
        header.className = "qb-header";
        if (cfg.logo_url) {
          var img = document.createElement("img");
          img.src = cfg.logo_url;
          img.alt = "";
          img.className = "qb-logo";
          header.appendChild(img);
        }
        var textWrap = document.createElement("div");
        textWrap.className = "qb-header-text";
        var name = document.createElement("div");
        name.className = "qb-business-name";
        name.textContent = cfg.business_name || "";
        textWrap.appendChild(name);
        var reply = document.createElement("div");
        reply.className = "qb-reply-note";
        reply.textContent = "Usually replies instantly";
        textWrap.appendChild(reply);
        if (cfg.is_demo) {
          var demo = document.createElement("div");
          demo.className = "qb-demo-note";
          demo.textContent = "Demo business, sample prices";
          textWrap.appendChild(demo);
        }
        header.appendChild(textWrap);
        if (this._mode === "floating") {
          var closeBtn = document.createElement("button");
          closeBtn.type = "button";
          closeBtn.className = "qb-close-btn";
          closeBtn.setAttribute("aria-label", "Close chat");
          closeBtn.textContent = "×";
          var self = this;
          closeBtn.addEventListener("click", function () {
            self._close();
          });
          header.appendChild(closeBtn);
        }
        return header;
      }

      // -- open / close ---------------------------------------------------

      _open() {
        if (this._state.open) return;
        this._state.open = true;
        if (this._launcherEl) this._launcherEl.setAttribute("aria-expanded", "true");
        this.classList.add("qb-open");
        this._panelEl.hidden = false;
        this._focusInput();
      }

      _close() {
        if (!this._state.open || this._mode !== "floating") return;
        this._state.open = false;
        if (this._launcherEl) this._launcherEl.setAttribute("aria-expanded", "false");
        this.classList.remove("qb-open");
        this._panelEl.hidden = true;
        if (this._launcherEl) this._launcherEl.focus();
      }

      _focusInput() {
        if (this._textInput) this._textInput.focus();
      }

      // Grows the textarea to fit its content, up to the CSS max-height (about 5 lines),
      // then lets it scroll internally instead of growing further.
      _autoGrowInput() {
        var el = this._textInput;
        if (!el) return;
        el.style.height = "auto";
        var maxHeight = parseFloat(getComputedStyle(el).maxHeight);
        var next = el.scrollHeight;
        if (isFinite(maxHeight) && next > maxHeight) {
          el.style.height = maxHeight + "px";
          el.style.overflowY = "auto";
        } else {
          el.style.height = next + "px";
          el.style.overflowY = "hidden";
        }
      }

      _setInputDisabled(disabled) {
        if (this._textInput) this._textInput.disabled = disabled;
        if (this._sendBtn) this._sendBtn.disabled = disabled;
        if (this._photoBtn) this._photoBtn.disabled = disabled;
      }

      // -- rendering: messages --------------------------------------------

      _scrollToBottom() {
        this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
      }

      _appendBotBubble(text) {
        var row = document.createElement("div");
        row.className = "qb-row qb-row-assistant";
        var bubble = document.createElement("div");
        bubble.className = "qb-bubble qb-bubble-assistant";
        bubble.textContent = text;
        row.appendChild(bubble);
        this._messagesEl.appendChild(row);
        this._scrollToBottom();
        return row;
      }

      _appendUserBubble(text, photoUrls) {
        var row = document.createElement("div");
        row.className = "qb-row qb-row-user";
        var bubble = document.createElement("div");
        bubble.className = "qb-bubble qb-bubble-user";
        bubble.textContent = text;
        if (photoUrls && photoUrls.length) {
          var thumbs = document.createElement("div");
          thumbs.className = "qb-bubble-thumbs";
          photoUrls.forEach(function (url) {
            var img = document.createElement("img");
            img.src = url;
            img.alt = "";
            img.className = "qb-bubble-thumb";
            thumbs.appendChild(img);
          });
          bubble.appendChild(thumbs);
        }
        row.appendChild(bubble);
        this._messagesEl.appendChild(row);
        this._scrollToBottom();
        return row;
      }

      _appendLoadingBubble() {
        var row = document.createElement("div");
        row.className = "qb-row qb-row-assistant";
        var bubble = document.createElement("div");
        bubble.className = "qb-bubble qb-bubble-assistant";
        bubble.setAttribute("aria-label", "Typing");
        bubble.textContent = "…";
        row.appendChild(bubble);
        this._messagesEl.appendChild(row);
        this._scrollToBottom();
        return row;
      }

      _buildErrorContent(phone) {
        var span = document.createElement("span");
        if (phone) {
          span.appendChild(document.createTextNode("Something went wrong. Call us at "));
          var a = document.createElement("a");
          a.href = "tel:" + digitsOnly(phone);
          a.textContent = phone;
          a.className = "qb-inline-link";
          span.appendChild(a);
          span.appendChild(document.createTextNode("."));
        } else {
          span.textContent = "Something went wrong. Please try again in a moment.";
        }
        return span;
      }

      _appendErrorBubble() {
        var phone = this._state.config && this._state.config.phone;
        var row = document.createElement("div");
        row.className = "qb-row qb-row-assistant";
        var bubble = document.createElement("div");
        bubble.className = "qb-bubble qb-bubble-assistant";
        bubble.appendChild(this._buildErrorContent(phone));
        row.appendChild(bubble);
        this._messagesEl.appendChild(row);
        this._scrollToBottom();
        return row;
      }

      _appendCallLink(row, phone) {
        if (!phone) return;
        var link = document.createElement("a");
        link.className = "qb-call-link";
        link.href = "tel:" + digitsOnly(phone);
        link.textContent = "Call " + phone;
        row.appendChild(link);
        this._scrollToBottom();
      }

      _clearQuickReplies() {
        if (this._quickRepliesEl) {
          this._quickRepliesEl.remove();
          this._quickRepliesEl = null;
        }
      }

      _renderQuickReplies(row, quickReplies) {
        this._clearQuickReplies();
        var wrap = document.createElement("div");
        wrap.className = "qb-quick-replies";
        var self = this;
        (quickReplies.options || []).forEach(function (opt) {
          var chip = document.createElement("button");
          chip.type = "button";
          chip.className = "qb-chip";
          chip.textContent = opt.label;
          chip.addEventListener("click", function () {
            self._send(opt.value);
          });
          wrap.appendChild(chip);
        });
        row.appendChild(wrap);
        this._quickRepliesEl = wrap;
        this._scrollToBottom();
      }

      // -- estimate / handoff cards ----------------------------------------

      _appendEstimateCard(row, outcome, phone) {
        var self = this;
        var card = document.createElement("div");
        card.className = "qb-card qb-estimate-card";

        var range = document.createElement("div");
        range.className = "qb-estimate-range";
        range.textContent = "$" + outcome.low + " to $" + outcome.high;
        card.appendChild(range);

        if (outcome.included && outcome.included.length) {
          var label = document.createElement("div");
          label.className = "qb-includes-label";
          label.textContent = "Includes";
          card.appendChild(label);
          var list = document.createElement("ul");
          list.className = "qb-includes-list";
          outcome.included.forEach(function (item) {
            var li = document.createElement("li");
            li.textContent = item;
            list.appendChild(li);
          });
          card.appendChild(list);
        }

        var disclaimer = document.createElement("p");
        disclaimer.className = "qb-disclaimer";
        disclaimer.textContent = outcome.disclaimer || "";
        card.appendChild(disclaimer);

        var actions = document.createElement("div");
        actions.className = "qb-card-actions";
        var bookBtn = document.createElement("button");
        bookBtn.type = "button";
        bookBtn.className = "qb-btn qb-btn-primary";
        bookBtn.textContent = "Book a visit";
        actions.appendChild(bookBtn);

        if (phone) {
          var callLink = document.createElement("a");
          callLink.className = "qb-btn qb-btn-link";
          callLink.href = "tel:" + digitsOnly(phone);
          callLink.textContent = "Call " + phone;
          actions.appendChild(callLink);
        }
        card.appendChild(actions);

        bookBtn.addEventListener("click", function () {
          actions.remove();
          var formWrap = document.createElement("div");
          card.appendChild(formWrap);
          self._buildLeadForm(formWrap, {
            phone: phone,
            onCancel: function () {
              formWrap.remove();
              card.appendChild(actions);
            },
          });
          self._scrollToBottom();
          // Move focus to the first field so the form is visibly "open" (and screen readers land on it).
          var firstField = formWrap.querySelector("input");
          if (firstField) firstField.focus();
        });

        row.appendChild(card);
        this._scrollToBottom();
      }

      _appendHandoffCard(row, outcome, phone) {
        var self = this;
        var hours = this._state.config && this._state.config.hours;
        var card = document.createElement("div");
        card.className = "qb-card qb-handoff-card";

        var heading = document.createElement("div");
        heading.className = "qb-handoff-heading";
        heading.textContent = "A team member will take a look";
        card.appendChild(heading);

        if (outcome.reasons && outcome.reasons[0]) {
          var reason = document.createElement("p");
          reason.textContent = outcome.reasons[0];
          card.appendChild(reason);
        }

        var leaveNumber = document.createElement("p");
        leaveNumber.textContent =
          "Leave your number and we'll call you during business hours" + (hours ? " (" + hours + ")." : ".");
        card.appendChild(leaveNumber);

        var formWrap = document.createElement("div");
        card.appendChild(formWrap);
        this._buildLeadForm(formWrap, { phone: phone, onCancel: null });

        if (phone) {
          var callLink = document.createElement("a");
          callLink.className = "qb-btn qb-btn-link";
          callLink.href = "tel:" + digitsOnly(phone);
          callLink.textContent = "Call " + phone;
          card.appendChild(callLink);
        }

        row.appendChild(card);
        this._scrollToBottom();
      }

      // -- lead form --------------------------------------------------------

      _buildLeadForm(container, opts) {
        var self = this;
        var phone = opts.phone;
        var uid = Math.random().toString(36).slice(2, 8);

        function field(labelText, inputEl, id) {
          var wrap = document.createElement("div");
          wrap.className = "qb-field";
          var lbl = document.createElement("label");
          lbl.setAttribute("for", id);
          lbl.textContent = labelText;
          inputEl.id = id;
          var err = document.createElement("div");
          err.className = "qb-field-error";
          err.id = id + "-error";
          err.hidden = true;
          inputEl.setAttribute("aria-describedby", err.id);
          wrap.appendChild(lbl);
          wrap.appendChild(inputEl);
          wrap.appendChild(err);
          return { wrap: wrap, err: err };
        }

        var form = document.createElement("form");
        form.className = "qb-lead-form";
        form.noValidate = true;

        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.autocomplete = "name";
        var nameField = field("Name", nameInput, "qb-name-" + uid);

        var phoneInput = document.createElement("input");
        phoneInput.type = "tel";
        phoneInput.autocomplete = "tel";
        var phoneField = field("Phone", phoneInput, "qb-phone-" + uid);

        var timeSelect = document.createElement("select");
        ["Morning", "Afternoon", "Evening", "Any time"].forEach(function (opt) {
          var o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          timeSelect.appendChild(o);
        });
        var timeField = field("Best time to call", timeSelect, "qb-time-" + uid);

        var consentWrap = document.createElement("div");
        consentWrap.className = "qb-field qb-field-checkbox";
        var consentInput = document.createElement("input");
        consentInput.type = "checkbox";
        consentInput.id = "qb-consent-" + uid;
        var consentLabel = document.createElement("label");
        consentLabel.setAttribute("for", consentInput.id);
        consentLabel.textContent = "It's OK to text me about this estimate";
        consentWrap.appendChild(consentInput);
        consentWrap.appendChild(consentLabel);

        var statusEl = document.createElement("p");
        statusEl.className = "qb-lead-status";
        statusEl.hidden = true;

        var actions = document.createElement("div");
        actions.className = "qb-lead-actions";
        var submitBtn = document.createElement("button");
        submitBtn.type = "submit";
        submitBtn.className = "qb-btn qb-btn-primary";
        submitBtn.textContent = "Send";
        var cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "qb-btn qb-btn-secondary";
        cancelBtn.textContent = "Cancel";
        actions.appendChild(submitBtn);
        actions.appendChild(cancelBtn);

        form.appendChild(nameField.wrap);
        form.appendChild(phoneField.wrap);
        form.appendChild(timeField.wrap);
        form.appendChild(consentWrap);
        form.appendChild(statusEl);
        form.appendChild(actions);

        cancelBtn.addEventListener("click", function () {
          form.remove();
          if (opts.onCancel) opts.onCancel();
        });

        form.addEventListener("submit", async function (ev) {
          ev.preventDefault();
          nameField.err.hidden = true;
          nameField.err.textContent = "";
          phoneField.err.hidden = true;
          phoneField.err.textContent = "";
          submitBtn.disabled = true;
          try {
            var res = await fetch(self._base + "/api/lead", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientId: self._clientId,
                name: nameInput.value,
                phone: phoneInput.value,
                best_time: timeSelect.value,
                consent_texts: consentInput.checked,
              }),
            });
            var data = {};
            try {
              data = await res.json();
            } catch (e) {
              data = {};
            }
            if (res.ok) {
              form.remove();
              var done = document.createElement("p");
              done.className = "qb-lead-done";
              done.textContent = data.message || "Thanks! We'll call you soon.";
              container.appendChild(done);
            } else if (res.status === 400) {
              var fields = data.fields || {};
              if (fields.name) {
                nameField.err.textContent = fields.name;
                nameField.err.hidden = false;
              }
              if (fields.phone) {
                phoneField.err.textContent = fields.phone;
                phoneField.err.hidden = false;
              }
              submitBtn.disabled = false;
            } else {
              form.remove();
              var errP = document.createElement("p");
              errP.className = "qb-lead-status";
              errP.appendChild(self._buildErrorContent(phone));
              container.appendChild(errP);
            }
          } catch (e) {
            form.remove();
            var errP2 = document.createElement("p");
            errP2.className = "qb-lead-status";
            errP2.appendChild(self._buildErrorContent(phone));
            container.appendChild(errP2);
          }
          self._scrollToBottom();
        });

        container.appendChild(form);
        nameInput.focus();
        this._scrollToBottom();
      }

      // -- photos -------------------------------------------------------------

      _renderPhotoTray() {
        var tray = this._trayEl;
        while (tray.firstChild) tray.removeChild(tray.firstChild);
        var pending = this._state.pendingPhotos;
        var self = this;

        if (pending.length) {
          var thumbs = document.createElement("div");
          thumbs.className = "qb-tray-thumbs";
          pending.forEach(function (p, idx) {
            var wrap = document.createElement("div");
            wrap.className = "qb-tray-thumb";
            var img = document.createElement("img");
            img.src = p.dataUrl;
            img.alt = "";
            var removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "qb-tray-remove";
            removeBtn.setAttribute("aria-label", "Remove photo");
            removeBtn.textContent = "×";
            removeBtn.addEventListener("click", function () {
              self._state.pendingPhotos.splice(idx, 1);
              self._renderPhotoTray();
            });
            wrap.appendChild(img);
            wrap.appendChild(removeBtn);
            thumbs.appendChild(wrap);
          });
          tray.appendChild(thumbs);
        }

        var noticeText = null;
        if (this._state.photoNotice === "limit") noticeText = "You can add up to 3 photos.";
        else if (this._state.photoNotice === "decode")
          noticeText = "That photo couldn't be opened. Try a JPG or PNG.";
        else if (pending.length) noticeText = "Add something for scale, like a dollar bill.";

        if (noticeText) {
          var notice = document.createElement("p");
          notice.className = "qb-tray-notice";
          notice.textContent = noticeText;
          tray.appendChild(notice);
        }
      }

      async _onFileChange(ev) {
        var files = Array.prototype.slice.call(ev.target.files || []);
        ev.target.value = "";
        if (!files.length) return;

        var remaining = MAX_PHOTOS - this._state.sentPhotoTotal - this._state.pendingPhotos.length;
        if (remaining <= 0) {
          this._state.photoNotice = "limit";
          this._renderPhotoTray();
          return;
        }

        var overflow = files.length > remaining;
        var toProcess = files.slice(0, remaining);

        for (var i = 0; i < toProcess.length; i++) {
          var file = toProcess[i];
          if (!file.type || file.type.indexOf("image/") !== 0) {
            this._state.photoNotice = "decode";
            this._renderPhotoTray();
            continue;
          }
          try {
            var dataUrl = await shrinkToJpeg(file);
            this._state.pendingPhotos.push({ dataUrl: dataUrl });
            this._state.photoNotice = null;
          } catch (e) {
            this._state.photoNotice = "decode";
          }
          this._renderPhotoTray();
        }

        if (overflow) {
          this._state.photoNotice = "limit";
          this._renderPhotoTray();
        }
      }

      // -- sending --------------------------------------------------------

      async _send(text) {
        if (this._state.loading) return;
        var trimmed = (text || "").trim();
        var photos = this._state.pendingPhotos.slice();
        if (!trimmed && photos.length === 0) return;

        var content = trimmed || (photos.length === 1 ? "Here's a photo." : "Here are my photos.");

        this._clearQuickReplies();
        this._appendUserBubble(content, photos.map(function (p) { return p.dataUrl; }));

        this._state.turns.push({ role: "user", content: content, photoCount: photos.length });
        this._state.sentPhotoTotal += photos.length;
        this._state.pendingPhotos = [];
        this._state.photoNotice = null;
        this._renderPhotoTray();

        var turns = this._state.turns;
        var wireMessages = turns.map(function (t, i) {
          var isLast = i === turns.length - 1;
          var m = { role: t.role, content: t.content };
          if (!isLast && t.role === "user" && t.photoCount) m.photo_count = t.photoCount;
          return m;
        });

        this._state.loading = true;
        this._setInputDisabled(true);
        var loadingRow = this._appendLoadingBubble();

        var data;
        try {
          var res = await fetch(this._base + "/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: this._clientId,
              messages: wireMessages,
              job: this._state.job,
              photos: photos.map(function (p) { return p.dataUrl; }),
            }),
          });
          if (!res.ok) throw new Error("chat failed");
          data = await res.json();
        } catch (e) {
          loadingRow.remove();
          this._state.loading = false;
          this._setInputDisabled(false);
          this._appendErrorBubble();
          this._focusInput();
          return;
        }

        loadingRow.remove();
        this._state.loading = false;
        this._setInputDisabled(false);
        this._state.job = data.job != null ? data.job : this._state.job;
        this._state.turns.push({ role: "assistant", content: data.reply, photoCount: 0 });

        var row = this._appendBotBubble(data.reply);
        var phone = this._state.config && this._state.config.phone;

        if (data.outcome) {
          if (data.outcome.status === "ok") {
            this._appendEstimateCard(row, data.outcome, phone);
          } else if (data.outcome.status === "needs_review") {
            this._appendHandoffCard(row, data.outcome, phone);
          } else if (data.outcome.status === "out_of_area" || data.outcome.status === "out_of_scope") {
            this._appendCallLink(row, phone);
          }
        }

        if (data.quick_replies) this._renderQuickReplies(row, data.quick_replies);

        this._focusInput();
      }
    }

    return QuotebotWidget;
  }

  // ---------------------------------------------------------------------
  // Mount
  // ---------------------------------------------------------------------

  var scriptEl = findScript();
  if (!scriptEl) return;

  var clientId = scriptEl.getAttribute("data-client");
  if (!clientId) return;

  var base;
  try {
    base = new URL(scriptEl.src, document.baseURI).origin;
  } catch (e) {
    return;
  }

  var modeAttr = scriptEl.getAttribute("data-mode");
  var targetSelector = scriptEl.getAttribute("data-target");
  var startOpen = scriptEl.getAttribute("data-open") === "true";
  var requestedMode = modeAttr === "inline" ? "inline" : "floating";

  function doMount() {
    var mode = requestedMode;
    var container = document.body;
    if (mode === "inline") {
      var targetEl = targetSelector ? document.querySelector(targetSelector) : null;
      if (targetEl) container = targetEl;
      else mode = "floating";
    }

    var registry = (window.__quotebotInstances = window.__quotebotInstances || Object.create(null));
    var key = clientId + "|" + (mode === "inline" ? "inline:" + targetSelector : "floating");
    if (registry[key]) return;
    registry[key] = true;

    if (!customElements.get(TAG)) customElements.define(TAG, QuotebotWidgetFactory());

    var el = document.createElement(TAG);
    el.qbInit = { clientId: clientId, mode: mode, base: base, startOpen: startOpen };
    container.appendChild(el);
  }

  if (document.body) doMount();
  else document.addEventListener("DOMContentLoaded", doMount);
})();
