(function () {
  "use strict";

  var measurementId = "G-DEJ9C50DTY";
  var consentKey = "am_analytics_consent_v1";
  var analyticsLoaded = false;
  var returnFocus = null;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });
  window.gtag("set", "ads_data_redaction", true);

  function readConsent() {
    try {
      return window.localStorage.getItem(consentKey);
    } catch (error) {
      return null;
    }
  }

  function saveConsent(value) {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch (error) {
      // If browser storage is unavailable, the visitor can choose again next time.
    }
  }

  function updateConsent(value) {
    window.gtag("consent", "update", {
      analytics_storage: value,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  }

  function loadAnalytics() {
    if (analyticsLoaded) {
      return;
    }

    analyticsLoaded = true;
    updateConsent("granted");

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", measurementId);
  }

  var banner = document.createElement("section");
  banner.className = "consent-banner";
  banner.hidden = true;
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-modal", "false");
  banner.setAttribute("aria-labelledby", "consent-title");
  banner.setAttribute("aria-describedby", "consent-description");
  banner.innerHTML =
    '<div class="consent-inner">' +
      '<div class="consent-copy">' +
        '<p class="consent-label">Your privacy</p>' +
        '<h2 id="consent-title">Optional website analytics</h2>' +
        '<p id="consent-description">I use Google Analytics only if you allow it, to understand which pages are useful. It is not used for advertising. <a href="/privacy/">Read the privacy information</a>.</p>' +
      '</div>' +
      '<div class="consent-actions">' +
        '<button class="consent-button consent-accept" type="button" data-consent-accept>Allow analytics</button>' +
        '<button class="consent-button consent-decline" type="button" data-consent-decline>Decline</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(banner);

  function showBanner(source) {
    returnFocus = source || null;
    banner.hidden = false;
    banner.querySelector("[data-consent-accept]").focus();
  }

  function hideBanner() {
    banner.hidden = true;
    if (returnFocus) {
      returnFocus.focus();
      returnFocus = null;
    }
  }

  banner.querySelector("[data-consent-accept]").addEventListener("click", function () {
    saveConsent("granted");
    loadAnalytics();
    hideBanner();
  });

  banner.querySelector("[data-consent-decline]").addEventListener("click", function () {
    var needsReload = analyticsLoaded;
    saveConsent("denied");
    updateConsent("denied");
    hideBanner();
    if (needsReload) {
      window.location.reload();
    }
  });

  var settingsButtons = document.querySelectorAll(".js-cookie-settings");
  settingsButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      showBanner(button);
    });
  });

  var footerNavigation = document.querySelector(".footer-nav");
  if (footerNavigation && !footerNavigation.querySelector(".js-cookie-settings")) {
    var footerButton = document.createElement("button");
    footerButton.className = "cookie-settings-button js-cookie-settings";
    footerButton.type = "button";
    footerButton.textContent = "Cookie settings";
    footerButton.addEventListener("click", function () {
      showBanner(footerButton);
    });
    footerNavigation.appendChild(footerButton);
  }

  var savedConsent = readConsent();
  if (savedConsent === "granted") {
    loadAnalytics();
  } else if (savedConsent !== "denied") {
    showBanner();
  }
}());
