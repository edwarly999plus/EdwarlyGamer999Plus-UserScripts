
// ==UserScript==
// @name         Gemini - Remove Inline Out of Credits Banner
// @namespace    https://tampermonkey.net/
// @version      1.0.0
// @description  Removes Gemini's inline upgrade and AI credits banner when you are out of credits (this does not give you infinite credits, duh).
// @icon         https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/1280px-Google_Gemini_icon_2025.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail&_=20250728014952
// @author       EdwarlyGamer999+
// @match        https://gemini.google.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const SELECTOR = '.inline-upgrade-banner-row';

    function removeBanner() {
        document.querySelectorAll(SELECTOR).forEach(element => {
            element.remove();
        });
    }

    // Remove existing elements
    removeBanner();

    // Detect dynamically inserted banners
    const observer = new MutationObserver(() => {
        removeBanner();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

})();
