var blSerializer = (() => {
  var __defProp = Object.defineProperty;
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __export = (target, all) => {
    __markAsModule(target);
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    DOMSerializerHelper: () => DOMSerializerHelper,
    ElementSerializer: () => ElementSerializer,
    ElidGenerator: () => ElidGenerator,
    ForceWebComponentsSerializationPatch: () => ForceWebComponentsSerializationPatch,
    MutationSerializer: () => MutationSerializer,
    PageSerializer: () => PageSerializer
  });

  // node_modules/.pnpm/@buglink+frontend-shared@1.0.2/node_modules/@buglink/frontend-shared/dist/index.esm.js
  var __defProp2 = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  var InjectorService = class {
    id = Math.random();
    registry = new WeakMap();
    register(c, instance) {
      this.registry.set(c, instance);
      return instance;
    }
    get(c) {
      if (!this.registry.get(c))
        throw new Error("Instance of " + c.name + " never added to registry");
      return this.registry.get(c);
    }
  };
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var u32 = Uint32Array;
  var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]);
  var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
      b[i] = start += 1 << eb[i - 1];
    }
    var r = new u32(b[30]);
    for (var i = 1; i < 30; ++i) {
      for (var j = b[i]; j < b[i + 1]; ++j) {
        r[j] = j - b[i] << 5 | i;
      }
    }
    return [b, r];
  };
  var _a = freb(fleb, 2);
  var fl = _a[0];
  var revfl = _a[1];
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b[0];
  var revfd = _b[1];
  var rev = new u16(32768);
  for (var i = 0; i < 32768; ++i) {
    x = (i & 43690) >>> 1 | (i & 21845) << 1;
    x = (x & 52428) >>> 2 | (x & 13107) << 2;
    x = (x & 61680) >>> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >>> 8 | (x & 255) << 8) >>> 1;
  }
  var x;
  var flt = new u8(288);
  for (var i = 0; i < 144; ++i)
    flt[i] = 8;
  for (var i = 144; i < 256; ++i)
    flt[i] = 9;
  for (var i = 256; i < 280; ++i)
    flt[i] = 7;
  for (var i = 280; i < 288; ++i)
    flt[i] = 8;
  var fdt = new u8(32);
  for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
  var et = /* @__PURE__ */ new u8(0);
  var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }
  var mt = typeof queueMicrotask == "function" ? queueMicrotask : typeof setTimeout == "function" ? setTimeout : function(fn) {
    fn();
  };
  var eventTypes = {};
  var dispatcher = (eventType, eventName) => {
    const fullEventName = `buglink.${eventType}.${eventName}`;
    eventTypes[eventType] = eventTypes[eventType] || [];
    eventTypes[eventType].push(eventName);
    let dispatcherFunction = (event) => {
      let e = event ? { ...event } : {};
      e.name = eventName;
      e.type = eventType;
      if (!e.timestamp)
        e.timestamp = new Date().getTime();
      document.dispatchEvent(new CustomEvent(fullEventName, { detail: e }));
      return e;
    };
    dispatcherFunction.eventName = eventName;
    dispatcherFunction.eventType = eventType;
    dispatcherFunction.on = (h) => {
      document.addEventListener(fullEventName, (c) => {
        h(c.detail);
      });
    };
    return dispatcherFunction;
  };
  var d = dispatcher;
  var events = {
    user: {
      note: d("user", "note"),
      report: d("user", "report")
    },
    device: {
      information: d("device", "device-information")
    },
    cookie: {
      data: d("cookie", "cookie-data")
    },
    http: {
      abort: d("http", "request-abort"),
      error: d("http", "request-error"),
      before_request: d("http", "before-request"),
      before_response: d("http", "before-response"),
      after_response: d("http", "after-response")
    },
    tab: {
      data: d("tab", "tab-data"),
      opened: d("tab", "tab-opened"),
      closed: d("tab", "tab-closed")
    },
    dom: {
      change: d("dom", "dom-change"),
      full: d("dom", "dom-full"),
      css_add: d("dom", "css-add"),
      css_remove: d("dom", "css-remove"),
      map_created: d("dom", "map-created")
    },
    console: {
      assert: d("console", "console-assert"),
      clear: d("console", "console-clear"),
      count: d("console", "console-count"),
      countReset: d("console", "console-countReset"),
      debug: d("console", "console-debug"),
      dir: d("console", "console-dir"),
      dirxml: d("console", "console-dirxml"),
      error: d("console", "console-error"),
      group: d("console", "console-group"),
      groupCollapsed: d("console", "console-groupCollapsed"),
      groupEnd: d("console", "console-groupEnd"),
      info: d("console", "console-info"),
      log: d("console", "console-log"),
      table: d("console", "console-table"),
      time: d("console", "console-time"),
      timeEnd: d("console", "console-timeEnd"),
      timeLog: d("console", "console-timeLog"),
      trace: d("console", "console-trace"),
      warn: d("console", "console-warn")
    },
    performance: {
      cpu: d("performance", "cpu"),
      memory: d("performance", "memory"),
      timing: d("performance", "timing")
    },
    devtools: {
      open: d("devtools", "devtools-open")
    },
    error: {
      global: d("error", "global-error"),
      promise: d("error", "global-promise")
    },
    keyboard: {
      up: d("keyboard", "keyup"),
      down: d("keyboard", "keydown"),
      input: d("keyboard", "input"),
      value: d("keyboard", "value"),
      checked: d("keyboard", "checked")
    },
    storage: {
      session_update: d("storage", "session-update"),
      local_update: d("storage", "local-update"),
      session_full: d("storage", "session-full"),
      local_full: d("storage", "local-full")
    },
    media: {
      play: d("media", "play"),
      pause: d("media", "pause")
    },
    page: {
      visibility: d("page", "visibility"),
      referrer: d("page", "referrer"),
      network: d("page", "network"),
      address: d("page", "address"),
      hash: d("page", "hash")
    },
    window: {
      resize: d("window", "resize")
    },
    mouse: {
      touchmove: d("mouse", "touchmove"),
      mousemove: d("mouse", "mousemove"),
      mouseup: d("mouse", "mouseup"),
      mousedown: d("mouse", "mousedown"),
      click: d("mouse", "click"),
      contextmenu: d("mouse", "contextmenu"),
      dblclick: d("mouse", "dblclick"),
      touchstart: d("mouse", "touchstart"),
      touchend: d("mouse", "touchend"),
      scroll: d("mouse", "scroll"),
      elementscroll: d("mouse", "elementscroll")
    },
    session: {
      start: d("session", "session-start"),
      useremail: d("session", "user-email"),
      userstart: d("session", "user-start"),
      userstop: d("session", "user-stop")
    },
    list: (...names) => {
      return names;
    },
    name: (name) => {
      return name;
    },
    type: (...type) => {
      let ns = [];
      for (let t of type)
        ns.push(...eventTypes[t]);
      return ns;
    },
    types: (...types) => {
      return types;
    }
  };
  var blevent = events;
  var activityRelatedEventNames = ["dom-full", ...blevent.type("mouse"), "keydown", "keyup", "note"];
  var CssAbsoluteUrlTransformer = class {
    URL_IN_CSS_REF = /url\((?:'([^']*)'|"([^"]*)"|([^)]*))\)/gm;
    RELATIVE_PATH = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/).*/;
    DATA_URI = /^(data:)([\w\/\+\-]+);(charset=[\w-]+|base64).*,(.*)/i;
    transform(cssText, href) {
      return (cssText || "").replace(this.URL_IN_CSS_REF, (origin, path1, path2, path3) => {
        const filePath = path1 || path2 || path3;
        if (!filePath) {
          return origin;
        } else if (!this.RELATIVE_PATH.test(filePath)) {
          return `url('${filePath}')`;
        } else if (this.DATA_URI.test(filePath)) {
          let u = `url(${filePath})`;
          if (filePath.indexOf('\\"') >= 0)
            u = `url('${filePath}')`;
          else if (filePath.indexOf("\\'") >= 0)
            u = `url("${filePath}")`;
          else if (filePath.indexOf("'") >= 0)
            u = `url("${filePath}")`;
          else if (filePath.indexOf('"') >= 0)
            u = `url('${filePath}')`;
          return u;
        } else if (filePath[0] === "/") {
          return `url('${this.extractOrigin(href) + filePath}')`;
        }
        const stack = href.split("/");
        const parts = filePath.split("/");
        stack.pop();
        for (const part of parts) {
          if (part === ".") {
            continue;
          } else if (part === "..") {
            stack.pop();
          } else {
            stack.push(part);
          }
        }
        return `url('${stack.join("/")}')`;
      });
    }
    proxyUrls(cssText, proxyBasePath) {
      return (cssText || "").replace(this.URL_IN_CSS_REF, (_, path1, path2, path3) => {
        const filePath = path1 || path2 || path3;
        if (!this.RELATIVE_PATH.test(filePath)) {
          return `url('${proxyBasePath + filePath}')`;
        } else
          return `url('${filePath}')`;
      });
    }
    extractOrigin(url) {
      let origin;
      if (url.indexOf("//") > -1) {
        origin = url.split("/").slice(0, 3).join("/");
      } else {
        origin = url.split("/")[0];
      }
      origin = origin.split("?")[0];
      return origin;
    }
  };
  function urlToDomain(url) {
    try {
      let u = new URL(url);
      const d2 = u.hostname + (u.port && u.port != "80" ? ":" + u.port : "");
      return d2;
    } catch {
      return url;
    }
  }
  var SessionId = class {
    start = new Date("2020-07-02T00:11:00Z").getTime();
    parse(raw) {
      let tokens = raw.split(".");
      let tab = +tokens[0] + this.start;
      let timestamp = tab + +tokens[1];
      let domain = decodeURIComponent(tokens.slice(2).join("."));
      return { timestamp, tab, domain };
    }
    generate(data) {
      let tab = +data.tab - this.start;
      let timestamp = +data.timestamp - +data.tab;
      let domain = data.domain || data.url || "";
      if (domain.startsWith("http"))
        domain = urlToDomain(domain);
      return `${tab}.${timestamp}.${encodeURIComponent(domain)}`;
    }
  };
  var ConfigurationKey = class {
  };
  __publicField(ConfigurationKey, "domains", "buglink.configuration.domains");
  __publicField(ConfigurationKey, "gotStarted", "buglink.configuration.got-started");
  var logi = console.log.bind(console, "%c%s", `color: ${"#284271"}; background: ${"#a8e9ff"}; font-size: 10px; border-radius: 2px; font-weight: bold; padding: 2px`);
  var loge = console.log.bind(console, "%c%s", `color: ${"#be0000"}; background: ${"#ffcaca"}; font-size: 10px; border-radius: 2px; font-weight: bold; padding: 2px`);
  var logw = console.log.bind(console, "%c%s", `color: ${"#7c4400"}; background: ${"#ffd06f"}; font-size: 10px; border-radius: 2px; font-weight: bold; padding: 2px`);

  // src/serializer/serializer.utils.ts
  var DOMSerializerHelper = class {
    letterNumbers = RegExp("[^a-z1-9]");
    a = document.createElement("a");
    tagName(t) {
      const processedTagName = t.toLowerCase().trim();
      return this.letterNumbers.test(processedTagName.replace(/-/g, "")) ? "div" : processedTagName;
    }
    getAbsoluteUrl(url) {
      this.a.href = url;
      return this.a.href;
    }
    getAbsoluteSrcset(attributeValue) {
      if (attributeValue.trim() === "") {
        return attributeValue;
      }
      function matchAll(regExp, str) {
        const matches = [];
        function replacementFunc(all, first) {
          matches.push(first);
        }
        str.replace(regExp, replacementFunc);
        return matches;
      }
      let allSrcSets = matchAll(/[^"\'=\s]+\S[^,]+/g, attributeValue);
      return allSrcSets.map((x2) => {
        let v = x2[0] || "";
        if (v.startsWith(","))
          v = v.substr(1);
        return v;
      }).map((srcItem) => {
        const trimmedSrcItem = srcItem.trimLeft().trimRight();
        const urlAndSize = trimmedSrcItem.split(" ").filter((x2) => x2);
        let value = "";
        if (urlAndSize.length === 2) {
          const absUrl = this.getAbsoluteUrl(urlAndSize[0]);
          value = `${absUrl} ${urlAndSize[1]}`;
        } else if (urlAndSize.length === 1) {
          const absUrl = this.getAbsoluteUrl(urlAndSize[0]);
          value = `${absUrl}`;
        }
        return value;
      }).join(",");
    }
    getAbsoluteUrlsStylesheet(cssText, href = location.href) {
      return new CssAbsoluteUrlTransformer().transform(cssText ?? "", href);
    }
    getElementAttributes(n) {
      let element = n;
      let attributes = {};
      for (const { name, value } of Array.from(element.attributes ?? [])) {
        attributes[name] = this.serializeAttribute(name, value);
      }
      return attributes;
    }
    serializeAttribute(name, value) {
      if (name === "src" || name === "href" && value) {
        return this.getAbsoluteUrl(value);
      } else if (name === "srcset" && value) {
        return this.getAbsoluteSrcset(value);
      } else if (name === "style" && value) {
        return this.getAbsoluteUrlsStylesheet(value);
      } else {
        return value;
      }
    }
    nodeElementTagAttributes(n) {
      let attributes = this.getElementAttributes(n);
      let element = n;
      const tag = element instanceof DocumentFragment ? "#document-fragment" : this.tagName(element.tagName);
      return { element, tag, attributes };
    }
  };

  // src/serializer/web-component.serializer.ts
  var WebComponentDomSerializer = class {
    constructor(elementDomSerializer) {
      this.elementDomSerializer = elementDomSerializer;
    }
    serialize(n) {
      let dsh = new DOMSerializerHelper();
      let { element, tag, attributes } = dsh.nodeElementTagAttributes(n);
      let w = n;
      const serialize = (c) => this.elementDomSerializer.serialize(c);
      let children = [];
      let shadowStyle = "";
      let shadowMode = "open";
      let shadowChildren = [];
      let shadow = null;
      let shadowRoot = element.shadowRoot || w._closed_mode_shadowRoot;
      let isDocumentFragment = () => {
        try {
          return shadowRoot.$$OwnerKey$$ || shadowRoot.constructor.prototype.nodeName == "#document-fragment";
        } catch (e) {
          return false;
        }
      };
      if (shadowRoot) {
        try {
          let innerStyle = [...shadowRoot.adoptedStyleSheets[0].rules].map((r) => {
            let css = dsh.getAbsoluteUrlsStylesheet(r.cssText);
            return css;
          }).join("");
          shadowStyle = innerStyle;
        } catch (e) {
        }
        shadowMode = shadowRoot.mode;
        for (let c of shadowRoot.childNodes)
          shadowChildren.push(serialize(c));
        shadow = { children: shadowChildren, mode: shadowMode, shadowType: isDocumentFragment() ? "document-fragment" : "shadow-dom", style: shadowStyle };
      }
      for (let c of w.childNodes)
        children.push(serialize(c));
      if (isDocumentFragment())
        shadow.documentFragment = serialize(element.shadowRoot);
      return { children, tag, attributes, shadow, type: "web-component" };
    }
  };

  // src/serializer/text.serializer.ts
  var TextDomSerializer = class {
    serialize(n) {
      let doms = new DOMSerializerHelper();
      const parentTagName = n.parentNode && n.parentNode.tagName;
      let textContent = n.textContent ?? "";
      const isStyle = parentTagName === "STYLE" ? true : void 0;
      if (isStyle && textContent) {
        return {
          type: "css-text",
          css: doms.getAbsoluteUrlsStylesheet(textContent)
        };
      }
      if (parentTagName === "SCRIPT") {
        return {
          type: "script-text",
          script: textContent.replace(/\n/g, "\n\\\\")
        };
      }
      let type = "text";
      return {
        type,
        text: textContent || ""
      };
    }
  };

  // src/serializer/stylesheet.serializer.ts
  var StylesheetDomSerializer = class {
    serialize(n) {
      let dsh = new DOMSerializerHelper();
      let { tag, attributes } = dsh.nodeElementTagAttributes(n);
      let css = "";
      if (tag === "link") {
        return this.serializeLink(n, attributes, dsh);
      } else if (tag === "style" && n.sheet && !(n.innerText || n.textContent || "").trim().length) {
        const cssText = getCssRulesString(n.sheet);
        if (cssText) {
          css = dsh.getAbsoluteUrlsStylesheet(cssText, location.href);
        }
        return { type: "style", tag: "style", attributes, css };
      } else {
        return { type: tag, tag: "style", attributes, css };
      }
    }
    serializeLink(n, attributes, dsh) {
      const stylesheet = Array.from(document.styleSheets).find((s) => {
        return s.href === n.href;
      });
      let css = "";
      const cssText = getCssRulesString(stylesheet);
      if (cssText) {
        delete attributes.rel;
        delete attributes.href;
        css = dsh.getAbsoluteUrlsStylesheet(cssText, stylesheet.href);
      }
      return { type: "link-stylesheet", tag: "link", attributes, css };
    }
  };
  function getCssRulesString(s) {
    try {
      const rules = s.rules || s.cssRules;
      return rules ? Array.from(rules).reduce((prev, cur) => prev + getCssRuleString(cur), "") : null;
    } catch (error) {
      return null;
    }
  }
  function isCSSImportRule(rule) {
    return "styleSheet" in rule;
  }
  function getCssRuleString(rule) {
    return isCSSImportRule(rule) ? getCssRulesString(rule.styleSheet) || "" : rule.cssText;
  }

  // src/serializer/media.serializer.ts
  var MediaDomSerializer = class {
    serialize(n) {
      let dsh = new DOMSerializerHelper();
      let { tag, attributes } = dsh.nodeElementTagAttributes(n);
      let state = n.paused ? "pause" : "play";
      return { type: tag, tag, attributes, state };
    }
  };

  // src/serializer/form.serializer.ts
  var FormDomSerializer = class {
    serialize(n) {
      let dsh = new DOMSerializerHelper();
      let { tag, attributes } = dsh.nodeElementTagAttributes(n);
      if (tag === "input" || tag === "textarea" || tag === "select") {
        const value = n.value;
        if (attributes.type !== "radio" && attributes.type !== "checkbox" && value) {
          attributes.value = value;
        } else if (n.checked) {
          attributes.checked = n.checked + "";
        }
        return { type: tag, tag, attributes };
      } else if (tag === "option") {
        const selectValue = n.parentElement;
        if (attributes.value === selectValue.value) {
          attributes.selected = n.selected + "";
        }
        return { type: "option", tag, attributes };
      } else
        return { type: tag, tag, attributes };
    }
  };

  // src/serializer/canvas.serializer.ts
  var CanvasDomSerializer = class {
    serialize(n) {
      let dsh = new DOMSerializerHelper();
      let attributes = dsh.getElementAttributes(n);
      let dataUrl = n.toDataURL();
      return { type: "canvas", tag: "canvas", dataUrl, attributes };
    }
  };

  // src/serializer/element.serializer.ts
  var ElementSerializer = class {
    constructor(onNodeSerialized, win = window) {
      this.onNodeSerialized = onNodeSerialized;
      this.win = win;
    }
    serialize(n) {
      let serialized;
      let isWebComponent = n.nodeName && n.nodeName.includes("-") && n.nodeName != "#document-fragment";
      if (isWebComponent) {
        serialized = new WebComponentDomSerializer(this).serialize(n);
      } else {
        let children = [];
        for (const child of Array.from(n.childNodes)) {
          let c = this.serialize(child);
          children.push(c);
        }
        const serializedNode = this.serializeSingle(n);
        serializedNode.children = children;
        serialized = serializedNode;
      }
      if (this.onNodeSerialized)
        this.onNodeSerialized(n, serialized);
      return serialized;
    }
    serializeSingle(n) {
      switch (n.nodeType) {
        case n.DOCUMENT_NODE:
          return {
            type: "document",
            href: this.win.location.href,
            width: this.win.innerWidth,
            height: this.win.innerHeight,
            scroll: { x: this.win.scrollX, y: this.win.scrollY }
          };
        case n.DOCUMENT_TYPE_NODE:
          return {
            type: "doc-type",
            name: n.name,
            publicId: n.publicId,
            systemId: n.systemId
          };
        case n.TEXT_NODE:
          return new TextDomSerializer().serialize(n);
        case n.CDATA_SECTION_NODE:
          return {
            type: "cdata",
            textContent: ""
          };
        case n.COMMENT_NODE:
          return {
            type: "comment",
            textContent: n.textContent || ""
          };
        default:
          return this.serializeElement(n);
      }
    }
    serializeElement(n) {
      let dsh = new DOMSerializerHelper();
      let { element, tag, attributes } = dsh.nodeElementTagAttributes(n);
      let scroll = { x: element.scrollTop, y: element.scrollLeft };
      let json = { type: tag, tag, scroll };
      if (tag === "link" || tag === "style") {
        json = { ...json, ...new StylesheetDomSerializer().serialize(n) };
      } else if (tag === "audio" || tag === "video") {
        json = { ...json, ...new MediaDomSerializer().serialize(n) };
      } else if (tag === "input" || tag === "textarea" || tag === "select" || tag === "option")
        json = { ...json, ...new FormDomSerializer().serialize(n) };
      else if (tag === "canvas")
        json = { ...json, ...new CanvasDomSerializer().serialize(n) };
      else
        json = {
          ...json,
          type: tag,
          tag,
          attributes
        };
      if (json.tag == "img") {
        let img = n;
        if (img.width && img.height) {
          json.width = img.width;
          json.height = img.height;
        } else {
          img.onload = () => {
            json.width = img.width;
            json.height = img.height;
          };
        }
      }
      return json;
    }
  };

  // src/serializer/node.serializer.ts
  var NodeSerializer = class {
    constructor(win = window) {
      this.win = win;
    }
    serializedMap;
    lastId = 0;
    serialize(n, elementsMap) {
      this.serializedMap = elementsMap ? elementsMap : new Map();
      let id = 0;
      if (elementsMap && elementsMap.size > 0) {
        let ids = Array.from(elementsMap.values());
        id = Math.max(...ids) + 100;
      }
      let eds = new ElementSerializer((n2, j) => {
        if (!this.serializedMap.has(n2)) {
          id++;
          this.serializedMap.set(n2, id);
          this.lastId = id;
        }
        j.id = this.serializedMap.get(n2);
      }, this.win);
      let json = eds.serialize(n);
      return json;
    }
  };

  // src/serializer/page.serializer.ts
  var PageSerializer = class {
    serialize(doc = document, win = window, elementsMap) {
      let ns = new NodeSerializer(win);
      let json = ns.serialize(doc, elementsMap);
      let elements = ns.serializedMap;
      let lastId = ns.lastId;
      return { json, elements, lastId };
    }
  };

  // src/serializer/style-attribute.serializer.ts
  var StyleAttributeSerializer = class {
    serialize(target, oldValue = "") {
      const styles = {};
      const tempEl = document.createElement("span");
      tempEl.setAttribute("style", oldValue);
      for (let i = 0; i < target.style.length; i++) {
        let s = target.style[i];
        if (target.style.getPropertyValue(s) != tempEl.style.getPropertyValue(s) || target.style.getPropertyPriority(s) != tempEl.style.getPropertyPriority(s)) {
          styles[s] = target.style.getPropertyValue(s);
          if (target.style.getPropertyPriority(s))
            styles[s] += " !important";
        }
      }
      for (let i = 0; i < tempEl.style.length; i++) {
        let s = tempEl.style[i];
        if (target.style.getPropertyValue(s) === "" || !target.style.getPropertyValue(s)) {
          styles[s] = null;
        }
      }
      return styles;
    }
  };

  // src/serializer/mutation.serializer.ts
  var MutationSerializer = class {
    constructor(elementsMap, elIdGenerator, serializer) {
      this.elementsMap = elementsMap;
      this.elIdGenerator = elIdGenerator;
      this.serializer = serializer;
    }
    serialize(mutations) {
      const elementAttributesMap = new Map();
      const elementStylesMap = new Map();
      const elementTextMap = new Map();
      mutations.sort((e1, e2) => {
        return e1.timestamp - e2.timestamp;
      });
      const dsh = new DOMSerializerHelper();
      const removeRecursivelyFromElementsMap = (n) => {
        this.elementsMap.delete(n);
        n.childNodes.forEach((c) => removeRecursivelyFromElementsMap(c));
      };
      let eventMutations = [];
      for (let m of mutations) {
        if (m.type == "attributes" && m.attributeName) {
          const target = m.target;
          const attributeValue = target.getAttribute(m.attributeName);
          if (m.attributeName == "style" && attributeValue && attributeValue.length > 100) {
            if (!elementStylesMap.has(target)) {
              let styles2 = new StyleAttributeSerializer().serialize(target, m.oldValue ?? "");
              elementStylesMap.set(target, { styles: styles2, oldValue: m.oldValue ?? "", timestamp: m.timestamp });
            }
            let oldValue = elementStylesMap.get(target).oldValue;
            let styles = new StyleAttributeSerializer().serialize(target, oldValue);
            elementStylesMap.get(target).styles = styles;
            elementStylesMap.get(target).timestamp = m.timestamp;
          } else {
            let value = dsh.serializeAttribute(m.attributeName, attributeValue ?? null);
            if (!elementAttributesMap.has(target)) {
              let attributes = {};
              attributes[m.attributeName] = value;
              elementAttributesMap.set(target, { attributes, timestamp: m.timestamp });
            }
            const prevAttributes = elementAttributesMap.get(target).attributes;
            const attrName = m.attributeName;
            prevAttributes[attrName] = value;
            elementAttributesMap.get(target).timestamp = m.timestamp;
          }
        } else if (m.type == "characterData") {
          const value = m.target.textContent ?? "";
          elementTextMap.set(m.target, { text: value, timestamp: m.timestamp });
        } else if (m.type == "childList") {
          m.addedNodes.forEach((c) => {
            eventMutations.push(this.generateAddEvent(c, m.target, m.timestamp));
          });
          m.removedNodes.forEach((c) => {
            let re = this.generateRemoveEvent(c, m.target, m.timestamp);
            eventMutations.push(re);
            removeRecursivelyFromElementsMap(c);
          });
        }
      }
      elementAttributesMap.forEach((e, n) => {
        let ae = this.generateAttributeMutationEvent(n, e.attributes, e.timestamp);
        eventMutations.push(ae);
      });
      elementStylesMap.forEach((e, n) => {
        eventMutations.push(this.generateStyleAttributeMutationEvent(n, e.styles, e.timestamp));
      });
      elementTextMap.forEach((e, n) => {
        eventMutations.push(this.generateTextMutationEvent(n, e.text, e.timestamp));
      });
      return eventMutations;
    }
    generateAddEvent(n, parent, timestamp) {
      let serialized = this.serializer.serialize(n);
      serialized.after = this.elId(n.nextSibling);
      serialized.before = this.elId(n.previousSibling);
      serialized.parent = this.elId(parent);
      return { ...serialized, timestamp, name: "mutation-add" };
    }
    generateAttributeMutationEvent(a, attributes, timestamp) {
      return {
        name: "mutation-attribute",
        attributes,
        id: this.elId(a),
        timestamp
      };
    }
    generateStyleAttributeMutationEvent(a, styles, timestamp) {
      return {
        name: "mutation-style",
        styles,
        id: this.elId(a),
        timestamp
      };
    }
    generateTextMutationEvent(t, value, timestamp) {
      return {
        name: "mutation-text",
        text: value,
        id: this.elId(t),
        timestamp
      };
    }
    generateRemoveEvent(c, parent, timestamp) {
      return {
        name: "mutation-remove",
        parent: this.elId(parent),
        id: this.elId(c),
        timestamp
      };
    }
    elId(n) {
      return this.elIdGenerator.id(n);
    }
  };

  // src/serializer/elid.generator.ts
  var ElidGenerator = class {
    constructor(elementsMap = new Map(), lastId = 0) {
      this.elementsMap = elementsMap;
      this.lastId = lastId;
    }
    get lastGeneratedId() {
      return this.lastId;
    }
    id(t) {
      if (!t)
        return void 0;
      else {
        if (!this.elementsMap.has(t)) {
          this.lastId++;
          this.elementsMap.set(t, this.lastId);
        }
        return this.elementsMap.get(t);
      }
    }
    updateLastId(maxId) {
      this.lastId = maxId;
    }
  };

  // src/force-web-components-serialization.patch.ts
  var ForceWebComponentsSerializationPatch = class {
    apply() {
      const { attachShadow } = Element.prototype;
      Element.prototype.attachShadow = function() {
        let sh = attachShadow.apply(this, arguments);
        this._closed_mode_shadowRoot = sh;
        return sh;
      };
    }
  };
  return src_exports;
})();
//# sourceMappingURL=index.js.map
