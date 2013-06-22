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

var loadingAnimation = new LoadingAnimation(),
    gTimerID = null, // Create a variable for the timer process
    gAbortTimerID,
    gXMLHttpRequest, // Create a variable for HTTP requests
    gUnreadComics, // Create a variable for the list of unread comics
    gUnreadCount;

// A "loading" animation displayed while we wait for the first response from
// ComicAgg. This animates the badge text with a dot that cycles from left to
// right.
function LoadingAnimation() {
    this.timerId_ = 0;
    this.maxCount_ = 8;  // Total number of states in animation
    this.current_ = 0;  // Current state
    this.maxDot_ = 4;  // Max number of dots in animation
}

LoadingAnimation.prototype.paintFrame = function () {
    var text = "",
        i;

    for (i = 0; i < this.maxDot_; i += 1) {
        text += (i == this.current_) ? "." : " ";
    }
    if (this.current_ >= this.maxDot_) {
        text += "";
    }

    chrome.browserAction.setBadgeText({ text:text });
    this.current_++;
    if (this.current_ == this.maxCount_) {
        this.current_ = 0;
    }
}

LoadingAnimation.prototype.start = function() {
    if (this.timerId_) {
        return;
    }

    var self = this;
    this.timerId_ = window.setInterval(function() {
        self.paintFrame();
    }, 100);
}

LoadingAnimation.prototype.stop = function() {
    if (!this.timerId_) {
        return;
    }

    window.clearInterval(this.timerId_);
    this.timerId_ = 0;
}

// populateFunction should be a function or false
function updateGet(populateFunction) {
    var time,
        user;

    // Cancel previously submitted notifier job
    if (gTimerID) {
        window.clearTimeout(gTimerID);
    }

    chrome.browserAction.setBadgeBackgroundColor({ color: [150, 150, 150, 200] });
    loadingAnimation.start();

    // Load the notifier poll timer
    time = localStorage['cagg.time'];
    if (!time) {
        time = 15;
    }

    // Re-submit with the appropriate poll timer
    gTimerID = window.setTimeout(updateGet, time * 1000 * 60);

    // Load the notifier user name
    user = localStorage['cagg.user'];
    if (!user) {
        handleError();
        return;
    }

    gXMLHttpRequest = new XMLHttpRequest();
    gAbortTimerID = window.setTimeout(function() {
        gXMLHttpRequest.abort();
        handleError();
    }, 2000 * 60);

    // If we received a something (should be the populate function) then make
    // up a new anonymous function as the state handler and exec the function
    // we got as argument
    if (populateFunction) {
        gXMLHttpRequest.onreadystatechange = function(event) {
            updateSet(event);
            populateFunction();
        };
    } else {
        gXMLHttpRequest.onreadystatechange = updateSet;
    }

    gXMLHttpRequest.open('GET','http://www.comicagg.com/ws/' + user + '/unread');
    gXMLHttpRequest.send(null);
}

function handleError() {
    chrome.browserAction.setIcon({ path: "images/wrong.png" });
    loadingAnimation.stop();
    chrome.browserAction.setBadgeText({ text: "" });
    gUnreadComics = new Array();  // Clearing unread comics
}

function updateSet(event) {
    if (gXMLHttpRequest.readyState !== 4) { return; }

    var xmlDoc,
        comics,
        item,
        i;

    window.clearTimeout(gAbortTimerID);

    if (gXMLHttpRequest.status !== 200) {
        handleError();
        return;
    }

    xmlDoc = gXMLHttpRequest.responseXML.documentElement;
    comics = gXMLHttpRequest.responseXML.documentElement.childNodes;
    gUnreadCount = xmlDoc.getAttribute("count");

    if (gUnreadCount === 0) {
        chrome.browserAction.setIcon({ path: "images/off.png" });
        chrome.browserAction.setBadgeBackgroundColor({ color: [150, 150, 150, 200] });
    } else {
        chrome.browserAction.setIcon({ path: "images/on.png" });
        chrome.browserAction.setBadgeBackgroundColor({ color: [34, 106, 215, 200] });
    }

    loadingAnimation.stop();
    chrome.browserAction.setBadgeText({ text: gUnreadCount });

    gUnreadComics = new Array();

    for (i = 0; i < gUnreadCount; i += 1) {
        item = new Array();
        item.push(comics[i].getAttribute("name"));
        item.push(comics[i].getAttribute("count"));
        gUnreadComics.push(item);
    }
}

domready(function () {
    updateGet();
});
