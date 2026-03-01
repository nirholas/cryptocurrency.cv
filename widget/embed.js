/**
 * Free Crypto News — Embeddable Widget Loader
 *
 * Lightweight script (<5KB) that creates an iframe pointing to /embed/* routes.
 *
 * Usage:
 *   <script src="https://cryptocurrency.cv/widget/embed.js"
 *     data-type="ticker"
 *     data-theme="dark"
 *     data-count="10"
 *     data-coin="bitcoin"
 *     data-title="true"
 *     data-branding="true"
 *     data-width="100%"
 *   ></script>
 *
 * Supported data-type values: ticker, news, coin, market, fear-greed
 *
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://cryptocurrency.cv
 */
(function () {
  "use strict";

  var BASE_URL = "https://cryptocurrency.cv";
  var VALID_TYPES = ["ticker", "news", "coin", "market", "fear-greed"];
  var VALID_THEMES = ["dark", "light", "auto"];

  // Default heights per widget type
  var DEFAULT_HEIGHTS = {
    ticker: 48,
    news: 600,
    coin: 320,
    market: 380,
    "fear-greed": 280,
  };

  /**
   * Find the current script tag (supports multiple widgets on one page).
   */
  function getCurrentScript() {
    if (document.currentScript) return document.currentScript;
    // Fallback for IE11
    var scripts = document.querySelectorAll(
      'script[src*="widget/embed.js"], script[src*="embed.js"]'
    );
    return scripts[scripts.length - 1] || null;
  }

  /**
   * Read data attributes from a script element.
   */
  function readConfig(script) {
    var type = (script.getAttribute("data-type") || "ticker").toLowerCase();
    if (VALID_TYPES.indexOf(type) === -1) type = "ticker";

    var theme = (script.getAttribute("data-theme") || "dark").toLowerCase();
    if (VALID_THEMES.indexOf(theme) === -1) theme = "dark";

    var count = parseInt(script.getAttribute("data-count") || "10", 10);
    if (isNaN(count) || count < 1 || count > 50) count = 10;

    var coin = (script.getAttribute("data-coin") || "bitcoin").toLowerCase();
    var title = script.getAttribute("data-title");
    var branding = script.getAttribute("data-branding");
    var width = script.getAttribute("data-width") || "100%";

    return {
      type: type,
      theme: theme,
      count: count,
      coin: coin,
      showTitle: title !== "false",
      showBranding: branding !== "false",
      width: width,
    };
  }

  /**
   * Build the embed URL from config.
   */
  function buildUrl(config) {
    var params = [];
    params.push("theme=" + encodeURIComponent(config.theme));

    if (config.type === "news") {
      params.push("count=" + config.count);
    }
    if (config.type === "coin") {
      params.push("coin=" + encodeURIComponent(config.coin));
    }
    if (!config.showTitle) {
      params.push("title=false");
    }
    if (!config.showBranding) {
      params.push("branding=false");
    }

    return BASE_URL + "/embed/" + config.type + "?" + params.join("&");
  }

  /**
   * Calculate iframe height based on config.
   */
  function getHeight(config) {
    if (config.type === "news") {
      var base = 40;
      var itemHeight = 76;
      var titleHeight = config.showTitle ? 40 : 0;
      var brandingHeight = config.showBranding ? 32 : 0;
      return base + config.count * itemHeight + titleHeight + brandingHeight;
    }
    return DEFAULT_HEIGHTS[config.type] || 400;
  }

  /**
   * Create and insert the iframe.
   */
  function createWidget(script) {
    var config = readConfig(script);
    var url = buildUrl(config);
    var height = getHeight(config);

    // Create container
    var container = document.createElement("div");
    container.className = "fcn-widget-container";
    container.style.cssText =
      "width:" +
      config.width +
      ";max-width:100%;margin:0;padding:0;overflow:hidden;border-radius:8px;";

    // Create iframe
    var iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.width = "100%";
    iframe.height = height;
    iframe.style.cssText =
      "border:none;display:block;width:100%;overflow:hidden;border-radius:8px;";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("title", "Free Crypto News Widget");
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    );

    container.appendChild(iframe);

    // Insert after the script tag
    if (script.parentNode) {
      script.parentNode.insertBefore(container, script.nextSibling);
    }

    // Listen for resize messages from the widget iframe
    window.addEventListener("message", function (event) {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type !== "fcn-widget-resize") return;
      if (event.source === iframe.contentWindow) {
        iframe.height = event.data.height;
      }
    });
  }

  // Initialize
  var script = getCurrentScript();
  if (script) {
    // Use DOMContentLoaded if DOM is not ready, otherwise create immediately
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      createWidget(script);
    } else {
      var onReady = function () {
        createWidget(script);
        document.removeEventListener("DOMContentLoaded", onReady);
      };
      document.addEventListener("DOMContentLoaded", onReady);
    }
  }
})();
