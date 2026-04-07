(function () {
  "use strict";

  var SEARCH_INPUT_SELECTOR = ".search-container .search-bar input[type='text']";
  var SEARCH_ICON_SELECTOR = ".search-container .search-bar .fa-search";
  var STICKY_STATE_KEY = "hecipeStickyState";

  function normalizeText(text) {
    return (text || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(text) {
    return (text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pagePrefix() {
    return window.location.pathname.indexOf("/recipe-detail/") !== -1 ? "../" : "";
  }

  function resolvePath(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === "/") return path;
    return pagePrefix() + path;
  }

  function queryFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  }

  function setInputsValue(value) {
    var inputs = document.querySelectorAll(SEARCH_INPUT_SELECTOR);
    inputs.forEach(function (input) {
      input.value = value;
    });
  }

  function injectStickyStyles() {
    if (document.getElementById("hecipe-sticky-collapse-style")) return;

    var style = document.createElement("style");
    style.id = "hecipe-sticky-collapse-style";
    style.textContent = [
      ".hecipe-sticky-collapsible{overflow:visible;position:sticky;transition:max-height .28s ease,box-shadow .2s ease;}",
      ".hecipe-sticky-collapsible .hecipe-sticky-toggle{position:absolute;top:8px;right:10px;z-index:1105;border:1px solid rgba(0,0,0,.12);background:rgba(255,255,255,.92);color:#2c3e2d;border-radius:999px;padding:4px 10px;font-size:12px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.1);}",
      ".hecipe-sticky-toggle.hecipe-sticky-toggle--floating{position:fixed;top:8px;right:10px;z-index:1200;}",
      ".hecipe-sticky-collapsible .hecipe-sticky-toggle:focus-visible{outline:2px solid #4a6741;outline-offset:2px;}",
      ".hecipe-sticky-collapsed{max-height:0 !important;min-height:0 !important;padding-top:0 !important;padding-bottom:0 !important;border:0 !important;overflow:hidden !important;box-shadow:none !important;}",
      "@media (max-width:768px){.hecipe-sticky-collapsible .hecipe-sticky-toggle{padding:4px 8px;font-size:11px;}}",
    ].join("");

    document.head.appendChild(style);
  }

  function readStickyState() {
    try {
      var raw = localStorage.getItem(STICKY_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeStickyState(nextState) {
    try {
      localStorage.setItem(STICKY_STATE_KEY, JSON.stringify(nextState));
    } catch (e) {
      // Ignore storage issues so the toggle still works in-session.
    }
  }

  function stickyItemKey(index, element) {
    var marker = element.getAttribute("id") || element.getAttribute("class") || "sticky";
    return window.location.pathname + "::" + index + "::" + marker;
  }

  function setStickyCollapsed(element, toggleBtn, collapsed) {
    var expandedHeight = element.scrollHeight;
    var index = parseInt(toggleBtn.dataset.hecipeStickyIndex || "0", 10);
    var floatingTop = 8 + index * 36;

    if (!collapsed) {
      if (toggleBtn.parentElement !== element) {
        element.appendChild(toggleBtn);
      }

      element.style.maxHeight = expandedHeight + "px";
      element.classList.remove("hecipe-sticky-collapsed");
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.classList.remove("hecipe-sticky-toggle--floating");
      toggleBtn.style.top = "";
      toggleBtn.textContent = "^";
      return;
    }

    element.classList.add("hecipe-sticky-collapsed");
    element.style.maxHeight = "0px";
    if (toggleBtn.parentElement !== document.body) {
      document.body.appendChild(toggleBtn);
    }
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.classList.add("hecipe-sticky-toggle--floating");
    toggleBtn.style.top = floatingTop + "px";
    toggleBtn.textContent = "v";
  }

  function isEligibleSticky(element) {
    var style = window.getComputedStyle(element);
    if (style.position !== "sticky") return false;
    if (style.top === "auto") return false;
    if (element.offsetHeight < 56) return false;
    return true;
  }

  function initializeStickyCollapse() {
    injectStickyStyles();

    var allElements = Array.prototype.slice.call(document.querySelectorAll("body *"));
    var stickyTargets = allElements.filter(isEligibleSticky);
    if (!stickyTargets.length) return;

    var state = readStickyState();

    stickyTargets.forEach(function (element, index) {
      if (element.dataset.hecipeStickyReady === "1") return;
      element.dataset.hecipeStickyReady = "1";
      element.classList.add("hecipe-sticky-collapsible");

      if (window.getComputedStyle(element).position === "sticky") {
        // Keep as sticky but ensure absolute-positioned toggle is anchored correctly.
        element.style.position = "sticky";
      }

      var key = stickyItemKey(index, element);
      var toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "hecipe-sticky-toggle";
      toggleBtn.dataset.hecipeStickyIndex = String(index);
      toggleBtn.setAttribute("aria-label", "Thu gọn hoặc mở thanh ghim");
      element.appendChild(toggleBtn);

      var isCollapsed = !!state[key];
      setStickyCollapsed(element, toggleBtn, isCollapsed);

      toggleBtn.addEventListener("click", function () {
        var nowCollapsed = !element.classList.contains("hecipe-sticky-collapsed");
        setStickyCollapsed(element, toggleBtn, nowCollapsed);
        state[key] = nowCollapsed;
        writeStickyState(state);
      });
    });
  }

  function getPageCatalog() {
    return [
      {
        path: "recipes.html",
        title: "Cong thuc nau an",
        keywords: ["cong thuc", "mon an", "nau an", "recipe", "eat clean", "healthy", "goc bep"],
      },
      {
        path: "shopNL.html",
        title: "Nguyen lieu",
        keywords: ["nguyen lieu", "di cho", "thuc pham", "rau", "thit", "ca", "gia vi", "shopping"],
      },
      {
        path: "gianhangdt.html",
        title: "Gian hang doi tac",
        keywords: ["doi tac", "thuong hieu", "nhan hang", "gian hang"],
      },
      {
        path: "combotietkiem.html",
        title: "Combo tiet kiem",
        keywords: ["combo", "tiet kiem", "deal", "khuyen mai"],
      },
      {
        path: "thucdon7d.html",
        title: "Lo trinh 7 ngay",
        keywords: ["thuc don", "7 ngay", "ke hoach", "meal plan"],
      },
      {
        path: "thucdoneatclean.html",
        title: "Eat clean va diet",
        keywords: ["eat clean", "diet", "giam can", "giam mo", "giu dang"],
      },
      {
        path: "dinhduong-benhly.html",
        title: "Dinh duong benh ly",
        keywords: ["benh ly", "tieu duong", "huyet ap", "khang viem", "dinh duong"],
      },
      {
        path: "hosouser.html",
        title: "Ho so suc khoe",
        keywords: ["bmi", "ho so", "suc khoe", "can nang", "chieu cao"],
      },
      {
        path: "cart.html",
        title: "Gio hang",
        keywords: ["gio hang", "cart", "thanh toan"],
      },
      {
        path: "checkout.html",
        title: "Thanh toan",
        keywords: ["checkout", "thanh toan", "don hang"],
      },
      {
        path: "onboarding.html",
        title: "Khao sat",
        keywords: ["khao sat", "muc tieu", "thoi quen"],
      },
    ];
  }

  function getRecipeCatalog() {
    return [
      { path: "recipe-detail/recipe-detailm1.html", title: "Salad uc ga sot me rang", keywords: ["salad", "uc ga", "me rang", "protein"] },
      { path: "recipe-detail/recipe-detailm2.html", title: "Salad rau cu tron me", keywords: ["salad", "rau cu", "an chay"] },
      { path: "recipe-detail/recipe-detailm3.html", title: "My y gao lut sot bo bam", keywords: ["my y", "gao lut", "bo bam", "low carb"] },
      { path: "recipe-detail/recipe-detailm14.html", title: "Ga nuong", keywords: ["ga nuong", "huyet ap", "ga"] },
      { path: "recipe-detail/recipe-detailm15.html", title: "Ca hoi sot cam", keywords: ["ca hoi", "omega", "tot cho tim mach"] },
      { path: "recipe-detail/recipe-detailm16.html", title: "Bun ga xao nam", keywords: ["bun", "ga", "nam", "an toi"] },
      { path: "recipe-detail/recipe-detailm17.html", title: "Com ga hap la chanh", keywords: ["com", "ga hap", "la chanh"] },
      { path: "recipe-detail/recipe-detailm18.html", title: "Canh bi do dau hu", keywords: ["canh", "bi do", "dau hu", "an chay"] },
      { path: "recipe-detail/recipe-detailm19.html", title: "Bo ap chao rau cu", keywords: ["bo", "ap chao", "rau cu", "protein"] },
      { path: "recipe-detail/recipe-detailm20.html", title: "Yen mach sua chua", keywords: ["yen mach", "sua chua", "bua sang"] },
      { path: "recipe-detail/recipe-detailm21.html", title: "Tom hap rau cu", keywords: ["tom", "hap", "rau cu", "it beo"] },
      { path: "recipe-detail/recipe-detailm22.html", title: "Dau hu sot nam", keywords: ["dau hu", "nam", "vegan"] },
    ];
  }

  function scoreItem(query, item) {
    var q = normalizeText(query);
    if (!q) return 0;

    var score = 0;
    var title = normalizeText(item.title);
    var keywords = (item.keywords || []).map(normalizeText);
    var haystack = [title].concat(keywords).join(" ");

    if (title === q) score += 100;
    if (title.indexOf(q) !== -1) score += 60;
    if (haystack.indexOf(q) !== -1) score += 35;

    q.split(" ").forEach(function (token) {
      if (!token) return;
      if (title.indexOf(token) !== -1) score += 10;
      keywords.forEach(function (k) {
        if (k.indexOf(token) !== -1) score += 6;
      });
    });

    return score;
  }

  function findBestLocalMatch(query) {
    var allItems = getPageCatalog().concat(getRecipeCatalog());
    var best = null;

    allItems.forEach(function (item) {
      var score = scoreItem(query, item);
      if (!best || score > best.score) {
        best = { item: item, score: score };
      }
    });

    if (!best || best.score <= 0) {
      return {
        path: "recipes.html",
        reason: "fallback",
      };
    }

    return {
      path: best.item.path,
      reason: "local",
    };
  }

  function buildSearchUrl(path, query) {
    var resolvedPath = resolvePath(path);
    var url = new URL(resolvedPath, window.location.href);
    if (query) {
      url.searchParams.set("q", query);
    }
    return url.toString();
  }

  function onRecipesPage() {
    return /\/recipes\.html$/i.test(window.location.pathname);
  }

  function filterRecipesOnPage(query) {
    if (!onRecipesPage()) return false;

    var cards = document.querySelectorAll(".recipes-grid .recipe-card");
    if (!cards.length) return false;

    var q = normalizeText(query);
    var visibleCount = 0;

    cards.forEach(function (card) {
      var text = normalizeText(card.textContent || "");
      var visible = !q || text.indexOf(q) !== -1;
      card.style.display = visible ? "" : "none";
      if (visible) visibleCount += 1;
    });

    renderRecipeSearchState(q, visibleCount);
    return true;
  }

  function renderRecipeSearchState(query, visibleCount) {
    var container = document.querySelector(".recipe-catalog-container .catalog-header") || document.body;
    var id = "global-recipe-search-status";
    var existing = document.getElementById(id);

    if (!query) {
      if (existing) existing.remove();
      return;
    }

    var html = visibleCount > 0
      ? "Tìm thấy <strong>" + visibleCount + "</strong> công thức cho từ khóa: <strong>" + escapeHtml(query) + "</strong>."
      : "Không thấy công thức khớp với từ khóa: <strong>" + escapeHtml(query) + "</strong>. Đang gợi ý trang gần nhất...";

    if (!existing) {
      existing = document.createElement("div");
      existing.id = id;
      existing.style.marginTop = "10px";
      existing.style.padding = "8px 12px";
      existing.style.borderRadius = "8px";
      existing.style.background = "#f2f7ed";
      existing.style.border = "1px solid #d5e5c8";
      existing.style.fontSize = "0.95rem";
      container.appendChild(existing);
    }

    existing.innerHTML = html;
  }

  async function callAiSearchApi(query, localPath) {
    var endpoint = window.HECIPE_AI_SEARCH_ENDPOINT;
    if (!endpoint) return null;

    var controller = new AbortController();
    var timeout = window.setTimeout(function () {
      controller.abort();
    }, 2200);

    try {
      var payload = {
        query: query,
        currentPage: window.location.pathname,
        localSuggestion: localPath,
        allowedTargets: getPageCatalog().concat(getRecipeCatalog()).map(function (i) {
          return i.path;
        }),
      };

      var response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hecipe-ai-key": window.HECIPE_AI_SEARCH_KEY || "",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) return null;
      var data = await response.json();

      if (!data || !data.targetPath) return null;
      if (typeof data.targetPath !== "string") return null;

      return data.targetPath;
    } catch (error) {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function runSearch(rawQuery) {
    var query = (rawQuery || "").trim();
    if (!query) {
      window.location.href = buildSearchUrl("recipes.html", "");
      return;
    }

    if (filterRecipesOnPage(query)) {
      var anyVisible = Array.prototype.some.call(
        document.querySelectorAll(".recipes-grid .recipe-card"),
        function (el) {
          return el.style.display !== "none";
        }
      );

      if (anyVisible) return;
    }

    var local = findBestLocalMatch(query);
    var aiPath = await callAiSearchApi(query, local.path);
    var targetPath = aiPath || local.path;

    window.location.href = buildSearchUrl(targetPath, query);
  }

  function bindSearchInput(input) {
    if (!input || input.dataset.hecipeSearchBound === "1") return;
    input.dataset.hecipeSearchBound = "1";

    input.setAttribute("autocomplete", "off");

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        runSearch(input.value);
      }
    });
  }

  function bindSearchIcons() {
    var icons = document.querySelectorAll(SEARCH_ICON_SELECTOR);
    icons.forEach(function (icon) {
      if (icon.dataset.hecipeSearchBound === "1") return;
      icon.dataset.hecipeSearchBound = "1";
      icon.style.cursor = "pointer";
      icon.addEventListener("click", function () {
        var bar = icon.closest(".search-bar");
        var input = bar ? bar.querySelector("input[type='text']") : null;
        if (input) {
          runSearch(input.value);
        }
      });
    });
  }

  function initializeUnifiedSearch() {
    initializeStickyCollapse();

    var inputs = document.querySelectorAll(SEARCH_INPUT_SELECTOR);
    if (!inputs.length) return;

    var initialQuery = queryFromUrl();
    if (initialQuery) {
      setInputsValue(initialQuery);
      if (onRecipesPage()) {
        filterRecipesOnPage(initialQuery);
      }
    }

    inputs.forEach(bindSearchInput);
    bindSearchIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeUnifiedSearch);
  } else {
    initializeUnifiedSearch();
  }
})();
