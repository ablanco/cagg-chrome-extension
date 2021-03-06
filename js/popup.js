/*jslint browser: true */
/*global chrome, domready */

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

    function populate() {
        var user,
            userLbl,
            table,
            row,
            item,
            i;

        // Load the notifier user name
        user = localStorage['cagg.user'];
        if (!user) { return; }

        userLbl = document.getElementById("cagg.user");
        userLbl.innerText = user;

        table = document.getElementById("cagg.table");

        // Deleting the old content
        while (table.hasChildNodes()) {
            table.removeChild(table.lastChild);
        }

        item = document.getElementById("cagg.empty");

        // If there aren't new comics then get out
        if (chrome.extension.getBackgroundPage().gUnreadComics.length === 0) {
            item.style.display = "";
            return;
        }

        item.style.display = "none";

        // Show the information of each unread comic
        for (i = 0; i < chrome.extension.getBackgroundPage().gUnreadComics.length; i += 1) {
            row = document.createElement("tr");
            row.setAttribute("align", "center");

            item = document.createElement("td");
            item.innerText = chrome.extension.getBackgroundPage().gUnreadComics[i][0];
            item.style.textAlign = "left";
            row.appendChild(item);

            item = document.createElement("td");
            item.innerText = chrome.extension.getBackgroundPage().gUnreadComics[i][1];
            row.appendChild(item);

            table.appendChild(row);
        }
    }

    function popupInit() {
        //Internationalization
        document.getElementById('cagg.title').textContent = chrome.i18n.getMessage("extName");
        document.getElementById('cagg.luser').textContent = chrome.i18n.getMessage("userName");
        document.getElementById('cagg.oweb').textContent = chrome.i18n.getMessage("openWeb");
        document.getElementById('cagg.force').textContent = chrome.i18n.getMessage("force");
        document.getElementById('cagg.user').textContent = chrome.i18n.getMessage("unset");
        document.getElementById('cagg.empty').textContent = chrome.i18n.getMessage("notNew");

        populate();
    }

    function openWebSite() {
        var tab,
            prop;

        tab = localStorage['cagg.tab'];
        prop = {
            "url" : 'http://www.comicagg.com',
            "selected" : !(tab === "true")
        };
        chrome.tabs.create(prop);
    }

    function forceUpdate() {
        // Pass the populate function to the updateGet method
        chrome.extension.getBackgroundPage().gUpdateGet(populate);
    }

    domready(function () {
        document.getElementById('cagg.oweb').addEventListener("click", openWebSite);
        document.getElementById('cagg.force').addEventListener("click", forceUpdate);
        popupInit();
    });
}());
