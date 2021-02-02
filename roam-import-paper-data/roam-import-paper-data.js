
// INITIALIZATION

// List of mappings to determine what data should be sought for each item type
const funcmap_default = {
    DEFAULT: "getItemMetadata"
}
// List of mappings to format the name of item types
// Forked from melat0nin/zotero-roam-export
const typemap_default = {
    artwork: "Illustration",
    audioRecording: "Recording",
    bill: "Legislation",
    blogPost: "Blog post",
    book: "Book",
    bookSection: "Chapter",
    "case": "Legal case",
    computerProgram: "Data",
    conferencePaper: "Conference paper",
    email: "Letter",
    encyclopediaArticle: "Encyclopaedia article",
    film: "Film",
    forumPost: "Forum post",
    hearing: "Hearing",
    instantMessage: "Instant message",
    interview: "Interview",
    journalArticle: "Article",
    letter: "Letter",
    magazineArticle: "Magazine article",
    manuscript: "Manuscript",
    map: "Image",
    newspaperArticle: "Newspaper article",
    patent: "Patent",
    podcast: "Podcast",
    presentation: "Presentation",
    radioBroadcast: "Radio broadcast",
    report: "Report",
    statute: "Legislation",
    thesis: "Thesis",
    tvBroadcast: "TV broadcast",
    videoRecording: "Recording",
    webpage: "Webpage",
}

let ZoteroData = null;

let zoteroContextMenu = null;
let zoteroContextBackdrop = null;
let zoteroContextMenuOptions = null;
let zoteroDataMenuVisible = false;
let elementToUseForDataImport = null;

// From Tyler Wince's Unlink Finder extension : https://tylerwince.github.io/roam-plugins-dev/unlink-finder/unlink-finder.js
if (document.getElementById('zotero-data-icon') == null) {
    zoteroDataButton();
    createZoteroContextMenu();
    zoteroContextMenu = document.querySelector('.zotero-context-menu');
    zoteroContextBackdrop = document.querySelector('.zotero-context-backdrop');
    zoteroContextMenuOptions = document.querySelectorAll('.zotero-context-menu-option');
    setupZoteroContextMenu();
}

// FUNCTIONS

// This is called by runZoteroDataGetter, while refCitekeyFound (?)
// It's the equivalent of the findTargetNodes function in Unlink Finder
// DONE (I think ? I don't really understand how these do/while loops work)
function findRefCitekeys(refs) {
    matched = false;
    for (i = 0; i < refs.length; i++) {
        // This section replaces the call to spanWrapper()
        let parentDiv = refs[i].parentElement;
        if (typeof (parentDiv.dataset.linkTitle) === 'undefined') {
            continue;
        } else {
            // Only do this for page refs for now, we'll see about tags later or not at all
            if (parentDiv.dataset.linkTitle.startsWith("@")) {
                if (parentDiv.classList.contains("ref-citekey")) {
                    matched = false;
                } else {
                    parentDiv.classList.add("ref-citekey");
                    matched = true;
                }
            }
        }
    }
    return matched;
}
// DONE (although I find the do/while structure weird here)
function runZoteroDataGetter() {
    refCitekeyFound = false;
    setTimeout(function () {
        do {
            let refs = document.getElementsByClassName("rm-page-ref");
            refCitekeyFound = findRefCitekeys(refs);
        } while (refCitekeyFound == true);
    }, 1000);
    checkCitekeys();
    addZoteroContextMenuListener();
}
// What troubles me with the async here is that this function is exclusively called in one context - when the icon is clicked (if there are problems troubleshooting should probably start here)
// DONE (I hope...)
async function zoteroDataGetter() {
    // Behavior if the button is getting turned ON
    if (document.getElementById('zotero-data-icon').getAttribute("status") == "off") {
        // First make the API request ; if it fails, then there's no point in running the rest, and status should stay as 'off'
        // Code below will hopefully properly try to call the Zotero API, fail adequately, and maybe not wreck all my code by making me turn a whole cascade of functions into async/await structure
        if (typeof (USER_REQUEST) === 'undefined') {
            Error('Please define the USER_REQUEST variable in your {{[[roam/js]]}} block, as an array of {apikey, dataURI, params}');
        } else {
            let apiRequest = await requestZoteroData(USER_REQUEST);
            if (apiRequest.dataAvailable == false) {
                Error("API request did not return a dataset ; please check your request specification");
            } else {
                document.getElementById('zotero-data-icon').setAttribute("status", "on");
                document.getElementById('zotero-data-icon').style = "background-color: #fd9d0d63;"
                refCitekeyFound = false;
                do {
                    let refs = document.getElementsByClassName("rm-page-ref");
                    refCitekeyFound = findRefCitekeys(refs);
                } while (refCitekeyFound == true);

                checkCitekeys();

                document.addEventListener('blur', runZoteroDataGetter, true);
                window.addEventListener('locationchange', runZoteroDataGetter, true);
                addZoteroContextMenuListener();

                document.getElementById('zotero-data-icon').style = "background-color: #60f06042;";
            }
        }
    } else {
        // Behavior if the button is being turned OFF
        document.getElementById('zotero-data-icon').setAttribute("status", "off");
        ZoteroData = null;
        removeRequestResults();
        document.removeEventListener('blur', runZoteroDataGetter, true);
        window.removeEventListener('locationchange', runZoteroDataGetter, true);

        document.getElementById('zotero-data-icon').removeAttribute("style");
    }
}
// DONE (but for some reason it doesn't get called when new refcitekeys are added to the page ?!)
// Also, since for every API request a citekey needs only to be checked once, this could be sped up by only checking those that don't have a value for data-zotero-bib yet
function checkCitekeys(){
    // Check all citekeys against the items in ZoteroData
    let citekeys = document.querySelectorAll('.ref-citekey');
    if(citekeys.length > 0){
        for(i = 0; i < citekeys.length; i++){
            if(ZoteroData.find(function (libItem) { return libItem.key == citekeys[i].dataset.linkTitle.replace("@", "") })){
                citekeys[i].dataset.zoteroBib = "inLibrary";
            } else {
                citekeys[i].dataset.zoteroBib = "notFound";
            }
        }
    }
}

// From Tyler Wince's Unlink Finder extension : https://github.com/tylerwince/roam-plugins/blob/main/unlink-finder/unlink-finder.js
// DONE
function createZoteroContextMenu() {
    var portalDiv = document.createElement("div");
    portalDiv.classList.add("bp3-portal");
    var overlayDiv = document.createElement("div");
    overlayDiv.classList.add("bp3-overlay");
    overlayDiv.classList.add("bp3-overlay-open")
    var backdropDiv = document.createElement("div");
    backdropDiv.classList.add("bp3-overlay-backdrop");
    backdropDiv.classList.add("bp3-popover-backdrop");
    backdropDiv.classList.add("bp3-popover-appear-done");
    backdropDiv.classList.add("bp3-popover-enter-done");
    backdropDiv.classList.add("zotero-context-backdrop");
    backdropDiv.style.cssText = `display: none; z-index:25;`;
    var containerDiv = document.createElement("div");
    containerDiv.classList.add("bp3-transition-container");
    containerDiv.classList.add("bp3-popover-appear-done");
    containerDiv.classList.add("bp3-popover-enter-done");
    containerDiv.classList.add("zotero-context-menu");
    containerDiv.style.cssText = `display: none; width: auto; position: fixed;z-index:25;`;
    var popoverDiv = document.createElement("div");
    popoverDiv.classList.add("bp3-popover");
    popoverDiv.classList.add("bp3-minimal");
    var popoverContentDiv = document.createElement("div");
    popoverContentDiv.classList.add("bp3-popover-content");
    var blankDiv = document.createElement("div");
    var menuDiv = document.createElement("ul");
    menuDiv.classList.add("bp3-text-small");
    menuDiv.classList.add("bp3-menu");
    var addDataLink = document.createElement("li");
    addDataLink.classList.add("zotero-context-menu-option");
    var addDataLinkAction = document.createElement("a");
    addDataLinkAction.classList.add("bp3-menu-item");
    addDataLinkAction.classList.add("bp3-popover-dismiss");
    var addDataLinkText = document.createElement("div");
    addDataLinkText.classList.add("bp3-text-overflow-ellipsis");
    addDataLinkText.classList.add("bp3-fill");
    addDataLinkText.innerText = "Import Zotero data to page";

    addDataLinkAction.appendChild(addDataLinkText);
    addDataLink.appendChild(addDataLinkAction);
    menuDiv.appendChild(addDataLink);
    blankDiv.appendChild(menuDiv);
    popoverContentDiv.appendChild(blankDiv);
    popoverDiv.appendChild(popoverContentDiv);
    containerDiv.appendChild(popoverDiv);
    overlayDiv.appendChild(backdropDiv);
    overlayDiv.appendChild(containerDiv);
    portalDiv.appendChild(overlayDiv);

    document.getElementById("app").appendChild(portalDiv);
}
// DONE
function removeRequestResults() {
    citekeyRefs = document.getElementsByClassName("ref-citekey");
    for (i = 0; i < citekeyRefs.length; i++) {
        // Leave in the class so that the search doesn't start all over again if another request is made
        // But make sure to remove the attribute to allow for a fresh check
        citekeyRefs[i].removeAttribute("data-zotero-bib");
        citekeyRefs[i].removeEventListener("contextmenu", addListenerToRefCitekey);
    }
}
// DONE
const toggleZoteroDataMenu = command => {
    // console.log("TOGGLING MENU: " + command)
    zoteroContextMenu.style.display = command === "show" ? "block" : "none";
    zoteroContextBackdrop.style.display = command === "show" ? "block" : "none";
    if (command == "show") {
        zoteroDataMenuVisible = true
    } else {
        zoteroDataMenuVisible = false
    }
}
// DONE
const setPositionZoteroDataMenu = ({ top, left }) => {
    zoteroContextMenu.style.left = `${left}px`;
    zoteroContextMenu.style.top = `${top}px`;
    toggleZoteroDataMenu("show");
}
// DONE (limited handling)
function addZoteroContextMenuListener() {
    var refCitekeys = document.querySelectorAll(".ref-citekey");
    for (var i = 0; i < refCitekeys.length; i++) {
        var ref = refCitekeys[i];

        // Handle case where item hasn't been checked against data yet
        if(!ref.dataset.zoteroBib){
            if(ZoteroData.find(function (libItem) { return libItem.key == citekeys[i].dataset.linkTitle.replace("@", "") })){
                citekeys[i].dataset.zoteroBib = "inLibrary";
            } else {
                citekeys[i].dataset.zoteroBib = "notFound";
            }
        }

        // Only add a listener for context menu if the item has been found in the library
        // I'm not handling the case where the item has no data-zotero-bib attribute or where data-zotero-bib is equal to something else
        // Maybe I should make that attribute a boolean - for now it seems there are only 2 cases (found/not found), until I implement an "Update data" functionality ?
        if (ref.dataset.zoteroBib == "inLibrary") {
            // Robust regardless of brackets
                ref.querySelector('.rm-page-ref').addEventListener("contextmenu", addListenerToRefCitekey);
        }
    }
}

// This is the function called to add an event listener for context menu to refcitekeys that have been found
// Hopefully it'll ensure only one event listener is ever added to a given element & fix the problem of not seeing the context menu
function addListenerToRefCitekey(e) {
    e.preventDefault();
    const origin = {
        left: e.pageX,
        top: e.pageY
    };
    setPositionZoteroDataMenu(origin);
    elementToUseForDataImport = e.target;
    return false;
}

// DONE
function setupZoteroContextMenu() {
    window.addEventListener("click", e => {
        if (zoteroDataMenuVisible) {
            toggleZoteroDataMenu("hide");
        }
    });

    for (var i = 0; i < zoteroContextMenuOptions.length; i++) {
        zoteroContextMenuOptions[i].addEventListener("click", e => {
            if (e.target.innerHTML == "Import Zotero data to page") {
                addItemData(elementToUseForDataImport);
            }
        })
    }
}
// DONE (hopefully calling an async function onclick will be fine)
function zoteroDataButton() {
    var button = document.createElement('span');
    button.classList.add('bp3-popover-wrapper');
    button.setAttribute("style", "margin-left: 4px;");

    var otherSpan = document.createElement('span');
    otherSpan.classList.add('bp3-popover-target');
    button.appendChild(otherSpan);

    var icon = document.createElement('span');
    icon.id = 'zotero-data-icon';
    icon.setAttribute("status", "off");
    icon.classList.add('bp3-icon-manual', 'bp3-button', 'bp3-minimal', 'bp3-small');
    otherSpan.appendChild(icon);

    var roamTopbar = document.getElementsByClassName("rm-topbar");
    roamTopbar[0].appendChild(button);
    icon.onclick = zoteroDataGetter;
}
// DONE
async function requestZoteroData(requestObject) {
    ZoteroData = null;
    ZoteroData = await fetchZoteroData(requestObject.apikey, requestObject.dataURI, requestObject.params);
    // TODO: Add handling of non-200 response codes from the API
    if (typeof (ZoteroData) === 'undefined' | ZoteroData == null) {
        return {
            dataAvailable: false
        }
    } else {
        //Traverse array of items and for those that have a pinned citekey, change the value of ITEM.key to the citekey instead of the Zotero item key
        // Note : the Zotero item key will still be available in ITEM.data.key
        ZoteroData = ZoteroData.data;
        ZoteroData.forEach(function (item, index, array) { if(typeof(item.data.extra) !== 'undefined'){if (item.data.extra.includes('Citation Key: ')) { array[index].key = item.data.extra.match('Citation Key: (.+)')[1] }} });
        return {
            dataAvailable: true
        }
    }
}

/* From Stack Overflow : https://stackoverflow.com/questions/45018338/javascript-fetch-api-how-to-save-output-to-variable-as-an-object-not-the-prom/45018619 */
// DONE
async function fetchZoteroData(apiKey, dataURI, params = "limit=100") {
    let requestURL = "https://api.zotero.org/" + dataURI + "?" + params;
    try {
        let response = await fetch(requestURL, {
            method: 'GET',
            headers: {
                'Zotero-API-Version': 3,
                'Zotero-API-Key': apiKey
            }
        });
        let totalResults = response.headers.get('Total-Results');
        let results = await response.json();
        let startIndex = 0;
        let paramsQuery = new URLSearchParams(params);
        if (paramsQuery.has('start')) {
            startIndex = Number(paramsQuery.get('start'));
        }
        let resultsTraversed = startIndex + results.length;
        if (resultsTraversed < totalResults) {
            paramsQuery.set('start', startIndex + results.length)
            let additionalBatch = await fetchZoteroData(apiKey, dataURI, params = paramsQuery.toString());
            results.push(...additionalBatch.data);
        }
        return {
            data: results
        };
    } catch (error) {
        console.error(error);
    }
}
// DONE
function addBlock(uid, blockString, order) {
    roamAlphaAPI.createBlock({ 'location': { 'parent-uid': uid, 'order': order }, 'block': { 'string': blockString } });
}
// Utility function to convert day of month into ordinal format for Roam date formatting
// DONE
function makeOrdinal(i) {
    let j = i % 10;
    if (j == 1 & i != 11) {
        return i + "st";
    } else if (j == 2 & i != 12) {
        return i + "nd";
    } else if (j == 3 & i != 13) {
        return i + "rd";
    } else {
        return i + "th";
    }
}

// Harvesting functions
// Each returns an array of strings, which correspond to the content of the blocks to be added
// Block strings should be added in the order they're meant to be on the page
// Default addition, FYI, is as direct children of the page ; nesting requires getting a block UID so it's harder to do right now (would require multi-step process probably)
function getItemMetadata(item) {
    let metadata = [];
    // Do type-specific stuff to grab and format metadata

    // Get title
    if (item.data.title) {
        metadata.push("Title:: " + item.data.title);
    }

    // Get Authors
    // TODO: What about single field formats ?
    if (item.data.creators.length > 0) {
        let creatorsList = item.data.creators.map(function (creator) {
            let nameTag = "[[" + [creator.firstName, creator.lastName].filter(Boolean).join(" ") + "]]";
            if (creator.creatorType != "author") {
                nameTag = nameTag + " (" + creator.creatorType + ")"
            }
            return nameTag;
        })
        metadata.push("Author(s):: " + creatorsList.join(", "));
    }

    // Get Abstract
    if (item.data.abstractNote) {
        metadata.push("Abstract:: " + item.data.abstractNote);
    }

    // Get Item Type
    // Use mapping specified in user-defined typemap, otherwise fall back on typemap_default
    if (item.data.itemType) {
        let mapping = typemap_default[item.data.itemType];
        if(typeof(typemap) !== 'undefined'){
            if(typemap[item.data.itemType]){
                mapping = typemap[item.data.itemType];
            }
        }
        metadata.push("Type:: " + "[[" + mapping + "]]");
    }

    // Get publication (journal, or book, or website, ...)
    if (item.data.publicationTitle) {
        metadata.push("Publication:: " + "[[" + item.data.publicationTitle + "]]");
    } else if (item.data.bookTitle) {
        metadata.push("Publication:: (Book) " + item.data.bookTitle);
    }

    // Get URL
    if (item.data.url) {
        metadata.push("URL : " + item.data.url);
    }

    // Get Date Added
    if (item.data.dateAdded) {
        let date = new Date(item.data.dateAdded);
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let roamDateAdded = months[date.getMonth()] + " " + makeOrdinal(date.getDate()) + ", " + date.getFullYear();
        metadata.push("Date Added:: [[" + roamDateAdded + "]]");
    }

    // Get Tags
    if (item.data.tags.length > 0) {
        let tagsList = item.data.tags.map(i => '#[[' + i.tag + ']]');
        metadata.push("Tags:: " + tagsList.join(", "))
    }

    return metadata;
}
// TODO
function getItemNotes(item) {
    let notes = [];
    // Do stuff to grab and format notes
    return notes;
}
// DONE (but won't handle any nesting)
function getAllData(item) {
    let itemData = [];

    // Get metadata
    let itemMetadata = getItemMetadata(item);
    if (itemMetadata.length > 0) {
        itemData.push(...itemMetadata);
    }

    // Get notes
    let itemNotes = getItemNotes(item);
    if (itemNotes.length > 0) {
        itemData.push(...itemNotes);
    }

    // Return the final array
    return itemData;
}

// From Jason Bunting on SO : https://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
// Execute function by argument :
function executeFunctionByName(functionName, context /*, args */) {
    var args = Array.prototype.slice.call(arguments, 2);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }
    return context[func].apply(context, args);
}
// DONE
function formatData(item) {
    let itemData = [];
    let type = item.data.itemType;
    // Check if a function has been specified for the item's specific type
    try{
        let items_funcmap = typeof(funcmap) !== 'undefined' ? funcmap : funcmap_default;
        if (!items_funcmap[type] == false) {
            itemData = executeFunctionByName(items_funcmap[type], window, item);
        } else {
            // Otherwise use the default formatting function
            // If user specified funcmap but it doesn't contain a DEFAULT setting, fall back on the DEFAULT in funcmap_default
            let items_funcmap_default = (!items_funcmap.DEFAULT == false) ? items_funcmap.DEFAULT : funcmap_default.DEFAULT;
            try {
                itemData = executeFunctionByName(items_funcmap_default, window, item);
            } catch (e) {
                console.error(e);
            }
        }
    } catch(e) {
        console.error(e);
    }
    return itemData;
}

// pageRef is the DOM element with class "rm-page-ref" that is the target of mouse events -- but it's its parent that has the information about the citekey + the page UID
// DONE
function addItemData(pageRef) {
    try {
        let citekey = pageRef.parentElement.dataset.linkTitle.replace("@", ""); // I'll deal with tags later, or not at all
        let pageUID = pageRef.parentElement.dataset.linkUid;

        let item = ZoteroData.find(function (i) { return i.key == citekey });
        if (item) {
            let itemData = formatData(item);
            if (itemData.length > 0) {
                // Items have to be added in reverse because of mandatory 'order' parameter (defaults to 0 in the function I wrote, so not explicitly set here)
                let flippedData = itemData.reverse();
                flippedData.forEach(function (blockString) { addBlock(uid = pageUID, blockString = blockString, order = 0) });
            }
        }
    } catch (e) {
        console.error(e);
    }
}


