(function () {
  "use strict";

  // Copy buttons for the biographies on the media page. The buttons stay hidden
  // when JavaScript or the clipboard is unavailable; the text can then be selected by hand.
  var buttons = document.querySelectorAll("[data-copy-target]");

  function plainText(element) {
    var parts = [];
    element.querySelectorAll("p").forEach(function (paragraph) {
      parts.push(paragraph.textContent.replace(/\s+/g, " ").trim());
    });
    return parts.join("\n\n");
  }

  buttons.forEach(function (button) {
    var target = document.getElementById(button.getAttribute("data-copy-target"));
    var status = button.parentNode.querySelector(".copy-status");

    if (!target || !navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      return;
    }

    button.hidden = false;
    button.addEventListener("click", function () {
      navigator.clipboard.writeText(plainText(target)).then(function () {
        if (status) {
          status.textContent = "Copied";
          window.setTimeout(function () {
            status.textContent = "";
          }, 4000);
        }
      }, function () {
        if (status) {
          status.textContent = "Copying did not work. Select the text instead.";
        }
      });
    });
  });
}());
