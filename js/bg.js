/*jslint browser: true, nomen: true */
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

var gUnreadComics, // Create a variable for the list of unread comics
    gUpdateGet;

(function () {
    "use strict";

    // A "loading" animation displayed while we wait for the first response from
    // ComicAgg. This animates the badge text with a dot that cycles from left to
    // right.
    function LoadingAnimation() {
        this.timerId_ = 0;
        this.maxCount_ = 8;  // Total number of states in animation
        this.current_ = 0;  // Current state
        this.maxDot_ = 4;  // Max number of dots in animation
    }

    var loadingAnimation = new LoadingAnimation(),
        timerId = null, // Create a variable for the timer process
        abortTimerId,
        XMLHttpRequestInstance, // Create a variable for HTTP requests
        unreadCount;

    LoadingAnimation.prototype.paintFrame = function () {
        var text = "",
            i;

        for (i = 0; i < this.maxDot_; i += 1) {
            text += (i === this.current_) ? "." : " ";
        }
        if (this.current_ >= this.maxDot_) {
            text += "";
        }

        chrome.browserAction.setBadgeText({ text: text });
        this.current_ += 1;
        if (this.current_ === this.maxCount_) {
            this.current_ = 0;
        }
    };

    LoadingAnimation.prototype.start = function () {
        if (this.timerId_) {
            return;
        }

        var self = this;
        this.timerId_ = window.setInterval(function () {
            self.paintFrame();
        }, 100);
    };

    LoadingAnimation.prototype.stop = function () {
        if (!this.timerId_) {
            return;
        }

        window.clearInterval(this.timerId_);
        this.timerId_ = 0;
    };

    function handleError() {
        chrome.browserAction.setIcon({ path: "images/wrong.png" });
        loadingAnimation.stop();
        chrome.browserAction.setBadgeText({ text: "" });
        gUnreadComics = [];  // Clearing unread comics
    }

    function updateSet() {
        if (XMLHttpRequestInstance.readyState !== 4) { return; }

        var xmlDoc,
            comics,
            item,
            i;

        window.clearTimeout(abortTimerId);

        if (XMLHttpRequestInstance.status !== 200) {
            handleError();
            return;
        }

        xmlDoc = XMLHttpRequestInstance.responseXML.documentElement;
        comics = XMLHttpRequestInstance.responseXML.documentElement.childNodes;
        unreadCount = xmlDoc.getAttribute("count");

        if (parseInt(unreadCount, 10) === 0) {
            chrome.browserAction.setIcon({ path: "images/off.png" });
            chrome.browserAction.setBadgeBackgroundColor({ color: [150, 150, 150, 200] });
        } else {
            chrome.browserAction.setIcon({ path: "images/on.png" });
            chrome.browserAction.setBadgeBackgroundColor({ color: [34, 106, 215, 200] });
        }

        loadingAnimation.stop();
        chrome.browserAction.setBadgeText({ text: unreadCount });

        gUnreadComics = [];

        for (i = 0; i < unreadCount; i += 1) {
            item = [];
            item.push(comics[i].getAttribute("name"));
            item.push(comics[i].getAttribute("count"));
            gUnreadComics.push(item);
        }
    }

    // populateFunction should be a function or false
    gUpdateGet = function (populateFunction) {
        var time,
            user;

        // Cancel previously submitted notifier job
        if (timerId) {
            window.clearTimeout(timerId);
        }

        chrome.browserAction.setBadgeBackgroundColor({ color: [150, 150, 150, 200] });
        loadingAnimation.start();

        // Load the notifier poll timer
        time = localStorage['cagg.time'];
        if (!time) {
            time = 15;
        }

        // Re-submit with the appropriate poll timer
        timerId = window.setTimeout(gUpdateGet, time * 1000 * 60);

        // Load the notifier user name
        user = localStorage['cagg.user'];
        if (!user) {
            handleError();
            return;
        }

        XMLHttpRequestInstance = new XMLHttpRequest();
        abortTimerId = window.setTimeout(function () {
            XMLHttpRequestInstance.abort();
            handleError();
        }, 2000 * 60);

        // If we received a something (should be the populate function) then make
        // up a new anonymous function as the state handler and exec the function
        // we got as argument
        if (populateFunction) {
            XMLHttpRequestInstance.onreadystatechange = function (event) {
                updateSet(event);
                populateFunction();
            };
        } else {
            XMLHttpRequestInstance.onreadystatechange = updateSet;
        }

        XMLHttpRequestInstance.open('GET', 'http://www.comicagg.com/ws/' + user + '/unread');
        XMLHttpRequestInstance.send(null);
    };

    domready(function () {
        gUpdateGet();
    });
}());
