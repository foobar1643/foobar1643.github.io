var Popup = function(id, headline, message) {
    if(!document.getElementById(id)) {
        this.popupElement = document.getElementById("popup-dummy").cloneNode(true);
        this.popupElement.id = id;
        this.popupElement.children[0].children[0].children[0].innerHTML = headline; // .popup -> .popup-content -> .popup-title -> h3
        this.popupElement.children[0].children[1].children[0].innerHTML = message; // .popup -> .popup-content -> .popup-message -> span
        this.popupElement.children[0].children[2].children[0].addEventListener("click", this.closeWindow.bind(this)); // .popup -> .popup-content -> .popup-controll -> close button
    } else {
        this.popupElement = document.getElementById(id);
    }
    this.popupVisible = false;
}

Popup.prototype.showWindow = function() {
    if(this.popupVisible != true) {
        this.popupElement.style.display = "block";
        document.body.appendChild(this.popupElement);
        this.popupVisible = true;
    }
}

Popup.prototype.closeWindow = function(e) {
    if(this.popupVisible && document.getElementById(this.popupElement.id)) {
        this.popupElement.parentNode.removeChild(this.popupElement);
        this.popupVisible = false;
    }
}

Popup.prototype.addControlButton = function(id, text) {
    if(!document.getElementById(id)) {
        var newButton = document.createElement("button");
        newButton.id = id;
        newButton.type = "button";
        newButton.innerHTML = text;
        newButton.className = "popup-button";
        this.popupElement.children[0].children[2].insertBefore(newButton, this.popupElement.children[0].children[2].firstChild);
        return newButton;
    } else {
        return false;
    }
}