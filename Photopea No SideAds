// ==UserScript==
// @name         Photopea No SideAds
// @version      1.0
// @description  Hide Photopea Ads
// @icon         https://www.photopea.com/promo/thumb256.png

// @author       EdwarlyGamer999+
// @namespace    https://github.com/
// @license      MIT

// @match        https://www.photopea.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// This script tricks Photopea into thinking it is on vectorpea.com,
// which prevents the ad banner on the right from loading.
// It has been slightly modified so that it only affects the exact domain
// and does not break other functions of the editor.

(function() {
    'use strict';

    const originalSplit = String.prototype.split;

    String.prototype.split = function(separator, limit) {
       // I only apply the trick if the string is exactly the Photopea domain
        if (this.valueOf() === 'www.photopea.com' || this.valueOf() === 'photopea.com') {
            return originalSplit.call(this.replace('photopea', 'vectorpea'), separator, limit);
        }
   // For any other string, I use the original split function without modifying it
        return originalSplit.call(this, separator, limit);
    };
})();
