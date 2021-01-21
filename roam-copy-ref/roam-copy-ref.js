
/* How to import the clipboard.js library from CDN */

var s = document.createElement("script");
s.src = "https://unpkg.com/clipboard@2/dist/clipboard.min.js";
s.id = "clipboard-js";
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);

/* How to create a button template */
var btn = document.createElement("button");
btn.textContent = "Copy ref";
btn.classList.add("ref-btn");

/* How to collect reference blocks on the page & add a clone of the button to each block */
function addCopyButton(refblock) {
    if (refblock.previousSibling.nodeName != "BUTTON") {
        var parentDiv = refblock.parentNode;
        parentDiv.insertBefore(btn.cloneNode(true), refblock);
    }
}
function checkIfRef(button) {
    if(!(button.closest('.roam-block-container').dataset.pathPageLinks.includes("Citations"))){
        button.parentNode.removeChild(button);
    }
}

setInterval(function(){
    document.querySelectorAll('.rm-block[data-page-links*="Citations"] > .rm-block-children > .rm-block > .rm-block-main > .roam-block').forEach(addCopyButton);
    document.querySelectorAll('button.ref-btn').forEach(checkIfRef);

    if(typeof(document.getElementById('clipboard-js')) !== 'undefined')
    new ClipboardJS('.ref-btn', {
        target: function(trigger) {
          return trigger.nextElementSibling;
        }
      })

}, 1000)

/* How to use clipboard.js dynamically */

document.addEventListener('hashchange', function () {
    clipboard.destroy();
})

