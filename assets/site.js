(function () {
  "use strict";

  var measurementId = "G-DEJ9C50DTY";
  var preferenceName = "am_analytics_choice";
  var legacyConsentKey = "am_analytics_consent_v1";
  var preferenceMaxAge = 183 * 24 * 60 * 60;
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

  function secureCookieAttribute() {
    return window.location.protocol === "https:" ? "; Secure" : "";
  }

  function readPreferenceCookie() {
    var cookies = document.cookie ? document.cookie.split(";") : [];
    var prefix = preferenceName + "=";

    for (var index = 0; index < cookies.length; index += 1) {
      var cookie = cookies[index].trim();
      if (cookie.indexOf(prefix) === 0) {
        var value = decodeURIComponent(cookie.slice(prefix.length));
        return value === "granted" || value === "denied" ? value : null;
      }
    }

    return null;
  }

  function savePreference(value) {
    document.cookie = preferenceName + "=" + encodeURIComponent(value) +
      "; Max-Age=" + preferenceMaxAge +
      "; Path=/; SameSite=Lax" + secureCookieAttribute();
  }

  function migrateLegacyPreference() {
    var legacyValue = null;

    try {
      legacyValue = window.localStorage.getItem(legacyConsentKey);
      window.localStorage.removeItem(legacyConsentKey);
    } catch (error) {
      // Browser storage may be unavailable; no migration is needed in that case.
    }

    if (legacyValue === "granted" || legacyValue === "denied") {
      savePreference(legacyValue);
      return legacyValue;
    }

    return null;
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
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: preferenceMaxAge,
      cookie_update: false
    });
  }

  function expireCookie(name, domain) {
    var domainAttribute = domain ? "; Domain=" + domain : "";
    document.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax" +
      domainAttribute + secureCookieAttribute();
  }

  function clearAnalyticsCookies() {
    var cookies = document.cookie ? document.cookie.split(";") : [];

    cookies.forEach(function (cookie) {
      var name = cookie.split("=")[0].trim();
      if (name === "_ga" || name.indexOf("_ga_") === 0) {
        expireCookie(name);
        expireCookie(name, ".alasdairmaclullich.com");
      }
    });
  }

  var banner = document.createElement("section");
  banner.className = "consent-banner";
  banner.hidden = true;
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Analytics choices");
  banner.setAttribute("aria-describedby", "consent-description");
  banner.innerHTML =
    '<div class="consent-inner">' +
      '<div class="consent-copy">' +
        '<p id="consent-description"><strong>Optional analytics.</strong> Google Analytics helps me understand which pages are useful. It loads only if you accept and is not used for advertising. <a href="/privacy/">Privacy</a>.</p>' +
      '</div>' +
      '<div class="consent-actions">' +
        '<button class="consent-button consent-accept" type="button" data-consent-accept>Accept analytics</button>' +
        '<button class="consent-button consent-decline" type="button" data-consent-decline>Reject analytics</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(banner);

  function showBanner(source) {
    returnFocus = source || null;
    banner.hidden = false;
    if (source) {
      banner.querySelector("[data-consent-accept]").focus();
    }
  }

  function hideBanner() {
    banner.hidden = true;
    if (returnFocus) {
      returnFocus.focus();
      returnFocus = null;
    }
  }

  banner.querySelector("[data-consent-accept]").addEventListener("click", function () {
    savePreference("granted");
    loadAnalytics();
    hideBanner();
  });

  banner.querySelector("[data-consent-decline]").addEventListener("click", function () {
    var needsReload = analyticsLoaded;
    savePreference("denied");
    updateConsent("denied");
    clearAnalyticsCookies();
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
    footerButton.textContent = "Analytics settings";
    footerButton.addEventListener("click", function () {
      showBanner(footerButton);
    });
    footerNavigation.appendChild(footerButton);
  }

  var savedPreference = readPreferenceCookie() || migrateLegacyPreference();
  if (savedPreference === "granted") {
    loadAnalytics();
  } else if (savedPreference === "denied") {
    clearAnalyticsCookies();
  } else {
    clearAnalyticsCookies();
    showBanner();
  }
}());
