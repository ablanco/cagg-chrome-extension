/*jslint browser: true */
/*global chrome, domready, toString, alert */

// Chromium Extension. A notifier for http://www.comicagg.com
// Copyright (C) <2009>  Alejandro Blanco
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

(function () {
    "use strict";

    var userName,
        timer,
        tabBackground;

    function preferencesInit() {
        var user,
            tab,
            time;

        // Internationalization
        document.getElementById('cagg.luser').textContent = chrome.i18n.getMessage("userName");
        document.getElementById('cagg.ltime').textContent = chrome.i18n.getMessage("refreshing");
        document.getElementById('cagg.ltab').textContent = chrome.i18n.getMessage("newTabs");
        document.getElementById('cagg.save').textContent = chrome.i18n.getMessage("save");

        userName = document.getElementById('cagg.user');
        timer = document.getElementById('cagg.time');
        tabBackground = document.getElementById('cagg.tab');

        user = localStorage['cagg.user'];
        if (!user) {
            userName.value = '';
        } else {
            userName.value = user;
        }

        tab = localStorage['cagg.tab'];
        if (tab === null) {
            tabBackground.checked = false;
        } else {
            tabBackground.checked = (tab === "true");
        }

        time = localStorage['cagg.time'];
        if (!time) {
            timer.value = 15;
        } else {
            timer.value = time;
        }
    }

    // From http://underscorejs.org
    // MIT license

    function isNumber(obj) {
        return toString.call(obj) === '[object Number]';
    }

    function isNaN(obj) {
        return isNumber(obj) && obj !== +obj;
    }

    // End underscorejs

    function savePreferences() {
        var oldUser,
            timePref;

        oldUser = localStorage['cagg.user'];
        localStorage['cagg.user'] = userName.value;
        localStorage['cagg.tab'] = tabBackground.checked;

        timePref = parseInt(timer.value, 10);
        if (timePref < 15 || isNaN(timePref)) {
            timePref = 15;
        }
        localStorage['cagg.time'] = timePref;
        timer.value = timePref;

        if (oldUser !== userName.value) {
            chrome.extension.getBackgroundPage().gUpdateGet(false);
        }

        alert(chrome.i18n.getMessage("done"));
    }

    domready(function () {
        document.getElementById("cagg.save").addEventListener("click", savePreferences);
        preferencesInit();
    });
}());
