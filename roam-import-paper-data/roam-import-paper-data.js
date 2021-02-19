
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
    document: "Document",
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
    webpage: "Webpage"
}

let ZoteroData = null;

let zoteroPortalDiv = null;
let zoteroContextMenu = null;
let zoteroContextBackdrop = null;
let zoteroContextMenuOptions = null;
let zoteroDataMenuVisible = false;
let zoteroIconContextMenu = null;
let zoteroIconContextBackdrop = null;
let zoteroIconContextMenuOptions = null;
let zoteroIconMenuVisible = false;
let elementToUseForDataImport = null;

// Section for search functionality support

let zoteroSearch = null;
let zoteroSearchInput = null;
let zoteroSearchOverlay = null;
let zoteroSearchCloseButton = null;
let zoteroUpdateButton = null;
let zoteroSearchVisible = false;

// The configuration of the autoComplete object
var zoteroSearchConfig = {
    data: {
        src: async function() {
            if(ZoteroData == null){
                return [];
            } else {
                return simplifyDataArray(ZoteroData);
            }
        },
        key: ['title', 'authors', 'year'],
        cache: false
    },
    selector: '#zotero-search-autocomplete',
    searchEngine: 'strict',
    highlight: true,
    maxResults: 20,
    sort: (a, b) => { // Sort by author, alphabetically
        if(a.value.authors.toLowerCase() < b.value.authors.toLowerCase()) return -1;
        if(a.value.authors.toLowerCase() > b.value.authors.toLowerCase()) return 1;
        return 0;
    },
    resultsList: {
        className: "zotero-search-results-list",
        idName: "zotero-search-results-list",
        container: source => {
            source.classList.add("bp3-menu")
        }
    },
    resultItem: {
        element: 'li',
        className: "zotero-search_result",
        idName: "zotero-search_result",
		content: (data, element) => {
            if(data.key == "title"){
                element.innerHTML = `<a label="${data.value.key}" class="bp3-menu-item bp3-popover-dismiss">
                                    <div class="bp3-text-overflow-ellipsis bp3-fill zotero-search-item-contents">
                                    <span class="zotero-search-item-title" style="font-weight:bold;color:black;display:block;">${data.match}</span>
                                    <span class="zotero-search-item-authors">${data.value.authors}</span><span class="zotero-search-item-metadata"> ${data.value.meta}</span>
                                    </div>
                                    <span class="bp3-menu-item-label zotero-search-item-key">${data.value.key}</span>
                                    </a>`;
            } else if(data.key == "authors"){
                element.innerHTML = `<a label="${data.value.key}" class="bp3-menu-item bp3-popover-dismiss">
                                    <div class="bp3-text-overflow-ellipsis bp3-fill zotero-search-item-contents">
                                    <span class="zotero-search-item-title" style="font-weight:bold;color:black;display:block;">${data.value.title}</span>
                                    <span class="zotero-search-item-authors">${data.match}</span><span class="zotero-search-item-metadata"> ${data.value.meta}</span>
                                    </div>
                                    <span class="bp3-menu-item-label zotero-search-item-key">${data.value.key}</span>
                                    </a>`;
            } else {
                element.innerHTML = `<a label="${data.value.key}" class="bp3-menu-item bp3-popover-dismiss">
                                    <div class="bp3-text-overflow-ellipsis bp3-fill zotero-search-item-contents">
                                    <span class="zotero-search-item-title" style="font-weight:bold;color:black;display:block;">${data.value.title}</span>
                                    <span class="zotero-search-item-authors">${data.value.authors}</span><span class="zotero-search-item-metadata"> ${data.value.meta}</span>
                                    </div>
                                    <span class="bp3-menu-item-label zotero-search-item-key">${data.value.key}</span>
                                    </a>`;
            }
		}
	},
    noResults: (dataFeedback, generateList) => {
        // Generate autoComplete List
        generateList(zoteroSearch, dataFeedback, dataFeedback.results);
        // No Results List Item
        const result = document.createElement("li");
        result.setAttribute("class", "no_result");
        result.setAttribute("tabindex", "1");
        result.innerHTML = `<span style="display: flex; align-items: center; font-weight: 100; color: rgba(0,0,0,.2);">Found No Results for "${dataFeedback.query}"</span>`;
        document
            .querySelector(`#${zoteroSearch.resultsList.idName}`)
            .appendChild(result);
    },
    onSelection: (feedback) => {
        let citekey = "@" + feedback.selection.value.key;
        let pageInGraph = lookForPage(citekey);
        let iconName = (pageInGraph.present == true) ? "tick" : "cross";
        let iconIntent = (pageInGraph.present == true) ? "success" : "danger";
        let itemInfo = (pageInGraph.present == true) ? "Page already exists in the graph" : "Page not found in the graph";
        let pageUID = (pageInGraph.uid) ? pageInGraph.uid : "";
        
        let metadataDiv = document.getElementById("zotero-search-selected-item").querySelector(".zotero-search-selected-item-metadata");
        metadataDiv.innerHTML = `<ul>
                                <li>Item key : ${feedback.selection.value.key}</li>
                                <li>Title : ${feedback.selection.value.title}</li>
                                <li>Author(s) : ${feedback.selection.value.authors}</li>
                                </ul>`;

        let graphInfoDiv = document.getElementById("zotero-search-selected-item").querySelector(".zotero-search-selected-item-graph-info");
        graphInfoDiv.innerHTML = `<div><span class="bp3-icon-${iconName} bp3-minimal bp3-intent-${iconIntent}"></span>
                                <span>${itemInfo}</span></div>
                                <div>
                                <span class="bp3-icon-add bp3-minimal"></span>
                                <a class="zotero-search-import-item" onclick="addSearchResult(${citekey},${pageUID})">Import data to Roam</a>
                                </div>`
    }
};

// Initial extension setup, when graph is re/loaded

if (document.getElementById('zotero-data-icon') == null) {
    zoteroDataButton();
    createZoteroContextMenu();
    zoteroContextMenu = document.querySelector('.zotero-context-menu');
    zoteroContextBackdrop = document.querySelector('.zotero-context-backdrop');
    zoteroContextMenuOptions = document.querySelectorAll('.zotero-context-menu-option');
    zoteroPortalDiv = document.getElementById("zotero-data-importer-portal");
    createZoteroIconContextMenu();
    zoteroIconContextMenu = document.querySelector('.zotero-icon-context-menu');
    zoteroIconContextBackdrop = document.querySelector('.zotero-icon-context-backdrop');
    zoteroIconContextMenuOptions = document.querySelectorAll('.zotero-icon-context-menu-option');
    setupZoteroContextMenu();
    setupZoteroIconContextMenu();

    // Section for search functionality support
    createZoteroSearchOverlay();
    zoteroSearchInput = document.getElementById("zotero-search-autocomplete");
    zoteroSearchOverlay = document.querySelector(".zotero-search-overlay");
    zoteroSearchCloseButton = document.querySelector("button.zotero-search-close");
    zoteroUpdateButton = document.querySelector("button.zotero-update-data");

    setupZoteroUpdateButton();
    setupZoteroSearchClose();
}

// FUNCTIONS

function findRefCitekeys(refs) {
    matched = false;
    for (i = 0; i < refs.length; i++) {
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
// TODO: Check if the do/while structure could be improved here
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

async function zoteroDataGetter() {
    // Behavior if the button is getting turned ON
    if (document.getElementById('zotero-data-icon').getAttribute("status") == "off") {
        document.getElementById('zotero-data-icon').style = "background-color: #fd9d0d63;";
        // First make the API request ; if it fails, then there's no point in running the rest, and status should stay as 'off'
        // Code below will hopefully properly try to call the Zotero API, fail adequately, and maybe not wreck all my code by making me turn a whole cascade of functions into async/await structure
        if (typeof (USER_REQUEST) === 'undefined') {
            throw new Error('The USER_REQUEST variable must be defined to make an API request. It should be an array of {apikey, dataURI, params}.');
        } else {
            let apiRequest = await requestZoteroData(USER_REQUEST);
            if (apiRequest.dataAvailable == false) {
                throw new Error("The API request encountered a problem. Please check your request specification.");
            } else if(apiRequest.dataAvailable) {
                document.getElementById('zotero-data-icon').setAttribute("status", "on");
                refCitekeyFound = false;
                do {
                    let refs = document.getElementsByClassName("rm-page-ref");
                    refCitekeyFound = findRefCitekeys(refs);
                } while (refCitekeyFound == true);

                checkCitekeys();

                document.addEventListener('blur', runZoteroDataGetter, true);
                window.addEventListener('locationchange', runZoteroDataGetter, true);
                addZoteroContextMenuListener();
                addZoteroIconContextMenuListener();

                document.getElementById('zotero-data-icon').style = "background-color: #60f06042;";
                console.log('The results of the API request have been received ; you can check them by inspecting the value of the ZoteroData object. Data import context menu should now be available.');

                setupZoteroSearchOverlay();
            }
        }
    } else {
        // Behavior if the button is being turned OFF
        document.getElementById('zotero-data-icon').setAttribute("status", "off");
        ZoteroData = null;
        zoteroSearch.unInit();
        removeRequestResults();
        document.removeEventListener('blur', runZoteroDataGetter, true);
        window.removeEventListener('locationchange', runZoteroDataGetter, true);

        document.getElementById('zotero-data-icon').removeAttribute("style");
        console.log('Data and request outputs have been removed');
    }
}

// Optional `update` parameter specifies whether to check items with data-zotero-bib="notFound"
// It's set to 'false' by default (regular case), but is called with 'update=true' when updating data
function checkCitekeys(update = false) {
    let refCitekeys = document.querySelectorAll('.ref-citekey');
    let newMatches = 0;
    let newUnmatches = 0;

    if (refCitekeys.length > 0) {
        for (i = 0; i < refCitekeys.length; i++) {
            let ref = refCitekeys[i];
            // References that have a data-zotero-bib attribute have already been checked -- use param `update` to see if we should check again
            if (ref.dataset.zoteroBib) {
                // If `update` is set to 'false', we don't bother checking anything & continue
                if(update == false){
                    continue;
                } else {
                    // If `update` is set to 'true', if the item was previously "notFound", check it against ZoteroData again
                    // If the item was previously "inLibrary", we continue (it's implied by reaching the end of the if statement)
                    if(ref.dataset.zoteroBib == "notFound"){
                        if (ZoteroData.find(function (libItem) { return libItem.key == ref.dataset.linkTitle.replace("@", "") })) {
                            ref.dataset.zoteroBib = "inLibrary";
                            newMatches = newMatches + 1;
                        } else {
                            // Otherwise count it as unmatch
                            newUnmatches = newUnmatches + 1;
                        }
                    }
                }
            } else {
                // For items that haven't been checked yet, look for their citekey in ZoteroData
                if (ZoteroData.find(function (libItem) { return libItem.key == ref.dataset.linkTitle.replace("@", "") })) {
                    ref.dataset.zoteroBib = "inLibrary";
                    newMatches = newMatches + 1;
                } else {
                    ref.dataset.zoteroBib = "notFound";
                    newUnmatches = newUnmatches + 1;
                }
            }
        }
    }

    if(newMatches > 0 | newUnmatches > 0){
        console.log('New matched citekeys: '+newMatches+', New unmatched citekeys: '+newUnmatches);
    }
}

function createZoteroContextMenu() {
    var portalDiv = document.createElement("div");
    portalDiv.classList.add("bp3-portal");
    portalDiv.id = "zotero-data-importer-portal";
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

// Create the context menu for the extension icon (> "Update data" functionality)
function createZoteroIconContextMenu() {

    var overlayDiv = document.createElement("div");
    overlayDiv.classList.add("bp3-overlay");
    overlayDiv.classList.add("bp3-overlay-open")
    var backdropDiv = document.createElement("div");
    backdropDiv.classList.add("bp3-overlay-backdrop");
    backdropDiv.classList.add("bp3-popover-backdrop");
    backdropDiv.classList.add("bp3-popover-appear-done");
    backdropDiv.classList.add("bp3-popover-enter-done");
    backdropDiv.classList.add("zotero-icon-context-backdrop");
    backdropDiv.style.cssText = `display: none;`;
    var containerDiv = document.createElement("div");
    containerDiv.classList.add("bp3-transition-container");
    containerDiv.classList.add("bp3-popover-appear-done");
    containerDiv.classList.add("bp3-popover-enter-done");
    containerDiv.classList.add("zotero-icon-context-menu");
    containerDiv.style.cssText = `display: none; width: auto; position: fixed;`;
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
    addDataLink.classList.add("zotero-icon-context-menu-option");
    var addDataLinkAction = document.createElement("a");
    addDataLinkAction.classList.add("bp3-menu-item");
    addDataLinkAction.classList.add("bp3-popover-dismiss");
    var addDataLinkText = document.createElement("div");
    addDataLinkText.classList.add("bp3-text-overflow-ellipsis");
    addDataLinkText.classList.add("bp3-fill");
    addDataLinkText.innerText = "Update Zotero data";

    var searchDataLink = document.createElement("li");
    searchDataLink.classList.add("zotero-icon-context-menu-option");
    var searchDataLinkAction = document.createElement("a");
    searchDataLinkAction.classList.add("bp3-menu-item");
    searchDataLinkAction.classList.add("bp3-popover-dismiss");
    var searchDataLinkText = document.createElement("div");
    searchDataLinkText.classList.add("bp3-text-overflow-ellipsis");
    searchDataLinkText.classList.add("bp3-fill");
    searchDataLinkText.innerText = "Search in dataset...";

    addDataLinkAction.appendChild(addDataLinkText);
    addDataLink.appendChild(addDataLinkAction);

    searchDataLinkAction.appendChild(searchDataLinkText);
    searchDataLink.appendChild(searchDataLinkAction);

    menuDiv.appendChild(addDataLink);
    menuDiv.appendChild(searchDataLink);

    blankDiv.appendChild(menuDiv);
    popoverContentDiv.appendChild(blankDiv);
    popoverDiv.appendChild(popoverContentDiv);
    containerDiv.appendChild(popoverDiv);
    overlayDiv.appendChild(backdropDiv);
    overlayDiv.appendChild(containerDiv);
    
    zoteroPortalDiv.appendChild(overlayDiv);

}

function removeRequestResults() {
    refCitekeys = document.querySelectorAll("ref-citekey");
    for (i = 0; i < refCitekeys.length; i++) {
        let ref = refCitekeys[i];
        // Leave in the class so that the search doesn't start all over again if another request is made
        // But make sure to remove the attribute to allow for a fresh check, and the context menu listener as well
        ref.removeAttribute("data-zotero-bib");
        ref.querySelector('.rm-page-ref').removeEventListener("contextmenu", addListenerToRefCitekey);
        document.getElementById("zotero-data-icon", addListenerToZoteroIcon);
    }
}

const toggleZoteroDataMenu = command => {
    zoteroContextMenu.style.display = command === "show" ? "block" : "none";
    zoteroContextBackdrop.style.display = command === "show" ? "block" : "none";
    if (command == "show") {
        zoteroDataMenuVisible = true
    } else {
        zoteroDataMenuVisible = false
    }
}

// Toggle for state of context menu for the extension icon (> "Update data" functionality)
const toggleZoteroIconMenu = command => {
    zoteroIconContextMenu.style.display = command === "show" ? "block" : "none";
    zoteroIconContextBackdrop.style.display = command === "show" ? "block" : "none";
    if (command == "show") {
        zoteroIconMenuVisible = true
    } else {
        zoteroIconMenuVisible = false
    }
}

const setPositionZoteroDataMenu = ({ top, left }) => {
    zoteroContextMenu.style.left = `${left}px`;
    zoteroContextMenu.style.top = `${top}px`;
    toggleZoteroDataMenu("show");
}

// Set the position of the context menu for the extension icon (> "Update data" functionality)
const setPositionZoteroIconMenu = ({ top, left }) => {
    if(left >= 0.9*window.innerWidth){
        zoteroIconContextMenu.style.left = `calc(${left}px - 7%)`;
    } else {
        zoteroIconContextMenu.style.left = `${left}px`;
    }
    zoteroIconContextMenu.style.top = `calc(${top}px + 3%)`;
    toggleZoteroIconMenu("show");
}

function addZoteroContextMenuListener() {
    var refCitekeys = document.querySelectorAll(".ref-citekey");
    for (var i = 0; i < refCitekeys.length; i++) {
        var ref = refCitekeys[i];

        // Handle case where item hasn't been checked against data yet
        if(!ref.dataset.zoteroBib){
            if(ZoteroData.find(function (libItem) { return libItem.key == ref.dataset.linkTitle.replace("@", "") })){
                ref.dataset.zoteroBib = "inLibrary";
            } else {
                ref.dataset.zoteroBib = "notFound";
            }
        }

        // Only add a listener for context menu if the item has been found in the library
        if (ref.dataset.zoteroBib == "inLibrary") {
            // Robust regardless of brackets
                ref.querySelector('.rm-page-ref').addEventListener("contextmenu", addListenerToRefCitekey);
        } else if (ref.dataset.zoteroBib == "notFound") {
            console.log('This citekey was checked against the contents of ZoteroData but didn\'t match any item. Make sure your citekeys are pinned.');
        }
    }
}

// Add event listener for context menu to extension icon (> "Update data" functionality)
function addZoteroIconContextMenuListener(){
    document.getElementById("zotero-data-icon").addEventListener("contextmenu", addListenerToZoteroIcon);
}

// Note: both functions below are misnamed
// TODO: give them more suitable names
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

// Pop the context menu associated with the extension icon (> "Update data" functionality)
function addListenerToZoteroIcon(e) {
    e.preventDefault();
    const origin = {
        left: e.pageX,
        top: e.pageY
    };
    setPositionZoteroIconMenu(origin);
    return false;
}

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

// Set up the context menu for the extension icon (> "Update data" functionality)
function setupZoteroIconContextMenu(){
    window.addEventListener("click", e => {
        if (zoteroIconMenuVisible) {
            toggleZoteroIconMenu("hide");
        }
    });

    for (var i = 0; i < zoteroIconContextMenuOptions.length; i++) {
        zoteroIconContextMenuOptions[i].addEventListener("click", e => {
            if (e.target.innerHTML == "Update Zotero data") {
                updateZoteroData(USER_REQUEST.apikey, USER_REQUEST.dataURI, USER_REQUEST.params);
            } else if(e.target.innerHTML == "Search in dataset...") {
                toggleZoteroSearchOverlay("show");
            }
        })
    }
}

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

async function requestZoteroData(requestObject) {
    ZoteroData = null;
    ZoteroData = await fetchZoteroData(requestObject.apikey, requestObject.dataURI, requestObject.params);
    
    if(typeof(ZoteroData) !== 'undefined' && ZoteroData != null){
        // Traverse array of items and for those that have a pinned citekey, change the value of ITEM.key to the citekey instead of the Zotero item key
        // Note : the Zotero item key will still be available in ITEM.data.key
        ZoteroData = ZoteroData.data;
        ZoteroData.forEach(function (item, index, array) { if(typeof(item.data.extra) !== 'undefined'){if (item.data.extra.includes('Citation Key: ')) { array[index].key = item.data.extra.match('Citation Key: (.+)')[1] }} });
        return {
            dataAvailable: true
        }
    } else {
        return {
            dataAvailable: false
        }
    }
}

// Originally from Stack Overflow : https://stackoverflow.com/questions/45018338/javascript-fetch-api-how-to-save-output-to-variable-as-an-object-not-the-prom/45018619 
// Feb 15th : implemented parallel API requests for better performance on large datasets
// TODO: Add handling of non-200 response codes from the API
async function fetchZoteroData(apiKey, dataURI, params){
    let requestURL = "https://api.zotero.org/" + dataURI + "?" + params;
    let results = null;

    // Make initial call to API, to know total number of results
    try{
        let response = await fetch(requestURL, {
            method: 'GET',
            headers: {
                'Zotero-API-Version': 3,
                'Zotero-API-Key': apiKey
            }
        });
        // Assess total results
        let totalResults = response.headers.get('Total-Results');
        // Find query params
        let paramsQuery = new URLSearchParams(params);
        // Start index
        let startIndex = 0;
        if(paramsQuery.has('start')){
            startIndex = Number(paramsQuery.get('start'));
        }
        // Limit param
        let limitResults = 100;
        if(paramsQuery.has('limit')){
            limitResults = Number(paramsQuery.get('limit'));
        }

        results = await response.json();

        // Determine if additional API calls are needed
        let resultsTraversed = startIndex + results.length;
        if(resultsTraversed < totalResults){
            // If there are more results to traverse, calculate how many more calls are needed
            let extraCalls = Math.ceil((totalResults - resultsTraversed)/limitResults);
            let apiCalls = [];
            for(i=1; i <= extraCalls; i++){
                // Set up the request parameters
                let newStartIndex = resultsTraversed + limitResults*(i - 1);
                paramsQuery.set('start', newStartIndex);
                paramsQuery.set('limit', limitResults);
                let newRequestURL = "https://api.zotero.org/" + dataURI + "?" + paramsQuery.toString();
                // Add the promise to the array of API calls
                apiCalls.push(fetch(newRequestURL, {
                    method: 'GET',
                    headers: {
                        'Zotero-API-Version': 3,
                        'Zotero-API-Key': apiKey
                    }
                }));
            }
            // Gather the array of promise results, convert them to JSON, flatten the output, then add to the results from initial API call
            let additionalResults = await Promise.all(apiCalls);
            let processedResults = await Promise.all(additionalResults.map(function(data){ return data.json(); }));
            processedResults = processedResults.flat(1);
            results.push(...processedResults);
        }
    } catch(e) {
        console.error(e);
    } finally {
        return{
            data: results
        }
    }
}

function addBlock(uid, blockString, order = 0) {
    roamAlphaAPI.createBlock({ 'location': { 'parent-uid': uid, 'order': order }, 'block': { 'string': blockString } });
}
// Utility function to convert day of month into ordinal format for Roam date formatting
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
// Each returns an array of elements of type String or Object, which correspond to the content of the blocks to be added
// Block strings should be added in the order they're meant to be on the page
function getItemMetadata(item) {
    let metadata = [];

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
        let mapping = null;
        if(typeof(typemap) !== 'undefined'){
            if(typemap[item.data.itemType]){
                mapping = typemap[item.data.itemType];
            }
        }
        if(mapping == null){
            if(typemap_default[item.data.itemType]){
                mapping = typemap_default[item.data.itemType];
            } else {
                mapping = item.data.itemType;
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
// TODO (pending writing of getItemNotes())
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
// Execute function by name :
function executeFunctionByName(functionName, context /*, args */) {
    var args = Array.prototype.slice.call(arguments, 2);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }
    return context[func].apply(context, args);
}

function formatData(item) {
    let itemData = [];
    let type = item.data.itemType;
    try {
        // If the user has defined funcmap
        if (typeof (funcmap) !== 'undefined') {
            // Check if it specifies a function for the item's type ; if not, check if it specifies a DEFAULT function
            if (typeof (funcmap[type]) !== 'undefined') {
                itemData = executeFunctionByName(funcmap[type], window, item);
            } else if (typeof (funcmap.DEFAULT) !== 'undefined') {
                itemData = executeFunctionByName(funcmap.DEFAULT, window, item);
            } else {
                // Otherwise fall back on funcmap_default
                if (typeof (funcmap_default[type]) !== 'undefined') {
                    itemData = executeFunctionByName(funcmap_default[type], window, item);
                } else {
                    itemData = executeFunctionByName(funcmap_default.DEFAULT, window, item);
                }
            }
        } else {
            // If the user didn't define funcmap, go straight to checking funcmap_default
            if (typeof (funcmap_default[type]) !== 'undefined') {
                itemData = executeFunctionByName(funcmap_default[type], window, item);
            } else {
                itemData = executeFunctionByName(funcmap_default.DEFAULT, window, item);
            }
        }
    } catch (e) {
        console.error(e);
    }
    return itemData;
}

// refSpan is the DOM element with class "rm-page-ref" that is the target of mouse events -- but it's its parent that has the information about the citekey + the page UID
async function addItemData(refSpan) {
    try {
        let citekey = refSpan.parentElement.dataset.linkTitle.replace("@", ""); // I'll deal with tags later, or not at all
        let pageUID = refSpan.parentElement.dataset.linkUid;

        let item = ZoteroData.find(function (i) { return i.key == citekey });
        if (item) {
            let itemData = formatData(item);
            if (itemData.length > 0) {
                await addMetadataArray(page_uid = pageUID, arr = itemData);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

// SECTION FOR NESTING SUPPORT

// This function will be called in addItemData
// It takes as arguments :
// - the UID of the page to which the blocks will be added
// - the array of formatted data that was returned for the item
// Note: the array's length > 0 is already checked in addItemData()
async function addMetadataArray(page_uid, arr){
    // Go through the array items in reverse order, because each block gets added to the top so have to start with the 'last' block
    for(k = arr.length - 1; k >= 0; k--){
        // If the element is an Object, pass it to addBlockObject to recursively process its contents
        if(arr[k].constructor === Object){
            await addBlockObject(page_uid, arr[k]);
        } else if(arr[k].constructor === String) {
            // If the element is a simple String, add the corresponding block & move on
            addBlock(uid = page_uid, blockString = arr[k], order = 0);
        } else {
            // If the element is of any other type, throw an error
            console.log(arr[k]);
            throw new Error('All array items should be of type String or Object');
        }
    }
}

async function addBlockObject(parent_uid, object) {
    // If the Object doesn't have a string property, throw an error
    // TODO: Add note in documentation that `string` cannot be left out
    if(typeof(object.string) === 'undefined'){
        console.log(object);
        throw new Error('All blocks passed as an Object must have a string property');
    } else {
        // Otherwise add the block
        addBlock(uid = parent_uid, blockString = object.string, order = 0);
        // If the Object has a `children` property
        if(typeof(object.children) !== 'undefined'){
            // Wait until the block above has been added to the page
            // This is needed because it's the only way to get the parent block's UID
            // Technically the Roam API lets us define a block UID when creating one with createBlock(), but that has too much potential for problems right now
            let top_uid = await waitForBlockUID(parent_uid, object.string);
            // Once the UID of the parent block has been obtained, go through each child element 1-by-1
            // If a child has children itself, the recursion should ensure everything gets added where it should
            for(j = object.children.length - 1; j >= 0; j--){
                if(object.children[j].constructor === Object){
                    await addBlockObject(top_uid, object.children[j]);
                } else if(object.children[j].constructor === String){
                    addBlock(uid = top_uid, blockString = object.children[j], order = 0);
                } else {
                    throw new Error('All children array items should be of type String or Object');
                }
            }
        }
    }
}

// From James Hibbard : https://www.sitepoint.com/delay-sleep-pause-wait/
// This is the basis for the async/await structure, which is needed to make sure processing is sequential and never parallel
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

// This checks the contents of a UID's top-block against a string, every 100ms until it's a match
// When a match is found, the function returns the top-block's UID
// This is called in addBlockObject(), to obtain a parent block's UID so that its children can be added
async function waitForBlockUID(parent_uid, string) {
    let top_block = null;
    let found = false;
    let tries = 0;
    // As long as the top-block hasn't been matched in content, keep checking it
    try {
        do {
            top_block = getTopBlockData(parent_uid);
            if (typeof (top_block.text) !== 'undefined' && top_block.text == string) {
                // If the string content matches, end the search & return the UID
                found = true;
                return top_block.uid;
            }
            // Keep track of attempts to avoid infinite search, and wait a bit before continuing
            tries = tries + 1;
            await sleep(75);
        } while (tries < 50 && !found);
        // If after 50 attempts there still isn't a match, throw an error
        console.log(top_block);
        throw new error('The top block couldn\'t be matched');
    } catch (e) {
        console.error(e);
    }
}

// This grabs the block UID and text of the top-child of a parent element, given the parent's UID
// Note: The case where the parent doesn't have children isn't handled here. It shouldn't be a problem because the context in which it is called is that of looking to add grandchildren blocks, essentially
// I.e this only gets called if the block with UID equal to parent_uid has a child that also has a child/children
function getTopBlockData(parent_uid) {
    // Look for the UID and string contents of the top-child of a parent
    let top_block = window.roamAlphaAPI.q('[:find ?bUID ?bText :in $ ?pUID :where[?b :block/uid ?bUID][?b :block/string ?bText][?b :block/order 0][?p :block/children ?b][?p :block/uid ?pUID]]', parent_uid);
    if (typeof (top_block) === 'undefined' || top_block == null || top_block.length == 0) {
        // If there were no results or a problem with the results, return false
        // This will keep the loop in waitForBlockUID() going
        // Though if there's a systematic error it won't go on infinitely because waitForBlockUID() will eventually throw an error
        return false;
    } else {
        // If the search returned a block's info, return it for matching
        // If there's any problem with the values returned, make sure to catch any error
        try {
            let top_block_data = {
                uid: top_block[0][0],
                text: top_block[0][1]
            }
            return top_block_data;
        } catch(e) {
            console.error(e);
        }
    }
}

// DEV ---------------------------------------------------------
// SECTION FOR "UPDATE DATA" SUPPORT

async function updateZoteroData(apiKey, dataURI, params) {
    // Turn the icon background to orange while we're updating the data
    document.getElementById('zotero-data-icon').style = "background-color: #fd9d0d63;";

    // Get latest version of any item in ZoteroData
    let latestVersion = ZoteroData[0].version;
    for (i = 1; i < ZoteroData.length; i++) {
        latestVersion = (ZoteroData[i].version > latestVersion) ? ZoteroData[i].version : latestVersion;
    }
    // Construct the update request with a 'since' param
    // It makes sure that, if any results are returned, it'll be only the new ones
    // Originally I wanted to use the 'If-Modified-Since-Version' header that Zotero provides but it never returned a 304 during testing
    let paramsQuery = new URLSearchParams(params);
    paramsQuery.set('since', latestVersion);
    let updateRequest = await fetchZoteroData(apiKey, dataURI, paramsQuery.toString());

    // How many items were returned ?
    let extraResults = updateRequest.data.length;
    // If there were no additional results
    if(extraResults == 0){
        // Tell the user nothing changed
        alert("No new items were found since the data was last loaded");
        // Turn the icon background to green again
        document.getElementById('zotero-data-icon').style = "background-color: #60f06042;";
    } else {
        // If there were additional results :
        let newItems = updateRequest.data;
        let nbNewItems = newItems.length;
        let nbModifiedItems = 0;

        // Process the new items for citekeys ; then, check against ZoteroData to find *modified* items & remove their old copy
        // Look for citekeys among the new items ; if found, assign it to the item's top-level `key` property
        newItems.forEach(function (item, index, array) { if(typeof(item.data.extra) !== 'undefined'){if (item.data.extra.includes('Citation Key: ')) { array[index].key = item.data.extra.match('Citation Key: (.+)')[1] }} });
        for(i=0; i < newItems.length; i++){
            let duplicateIndex = ZoteroData.findIndex(function (libItem) { return libItem.key == newItems[i].key });
            // If there is no element in ZoteroData with the item's key, add the item to the dataset
            if(duplicateIndex == -1){
                ZoteroData.push(newItems[i]);
            } else {
                // If there is already an element of ZoteroData sharing the same key as the item, replace that element with the item (aka, update the data)
                ZoteroData[duplicateIndex] = newItems[i];
                // Update the counters that will be displayed to the user
                nbModifiedItems += 1;
                nbNewItems -= 1;
            }
        }
        // Tell the user there were X additional results
        alert(nbNewItems + " new items and " + nbModifiedItems + " modified items were found. The dataset has been updated, and citekeys have been checked against the new data.");
        // Check the ref citekeys on the page, *including* those that were previously "notFound"
        checkCitekeys(update = true);
        // Turn the icon background to green again
        document.getElementById('zotero-data-icon').style = "background-color: #60f06042;";
    }

}

// SECTION FOR "SEARCH ITEMS" SUPPORT

// Create the overlay + its components, then add to extension portal in DOM
function createZoteroSearchOverlay(){

    let searchOverlay = document.createElement("div");
    searchOverlay.classList.add("bp3-overlay");
    searchOverlay.classList.add("bp3-overlay-open");
    searchOverlay.classList.add("bp3-overlay-scroll-container");
    searchOverlay.classList.add("zotero-search-overlay");
    searchOverlay.style = "display:none;"

    let searchOverlayBackdrop = document.createElement("div");
    searchOverlayBackdrop.classList.add("bp3-overlay-backdrop");
    searchOverlayBackdrop.classList.add("bp3-overlay-appear-done");
    searchOverlayBackdrop.classList.add("bp3-overlay-enter-done");
    searchOverlayBackdrop.classList.add("zotero-search-backdrop");
    searchOverlayBackdrop.tabIndex = "0";

    let searchDialogContainer = document.createElement("div");
    searchDialogContainer.classList.add("bp3-dialog-container");
    searchDialogContainer.classList.add("bp3-overlay-content");
    searchDialogContainer.classList.add("bp3-overlay-appear-done");
    searchDialogContainer.classList.add("bp3-overlay-enter-done");
    searchDialogContainer.tabIndex = "0";

    let searchDialogDiv = document.createElement("div");
    searchDialogDiv.classList.add("bp3-dialog");
    searchDialogDiv.style = "width:60%;align-self:baseline;";

    let searchDialogHeader = document.createElement("div");
    searchDialogHeader.classList.add("bp3-dialog-header");
    
    let searchDialogBody = document.createElement("div");
    searchDialogBody.classList.add("bp3-dialog-body");

    let searchDialogFooter = document.createElement("div");
    searchDialogFooter.classList.add("bp3-dialog-footer");

    // Add header elements
    searchDialogHeader.innerHTML = `<h4 class="bp3-heading">Zotero Search</h4>
                                    <button type="button" aria-label="Close" class="zotero-search-close bp3-button bp3-minimal bp3-dialog-close-button">
                                    <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"><svg data-icon="small-cross" width="20" height="20" viewBox="0 0 20 20"><desc>small-cross</desc><path d="M11.41 10l3.29-3.29c.19-.18.3-.43.3-.71a1.003 1.003 0 00-1.71-.71L10 8.59l-3.29-3.3a1.003 1.003 0 00-1.42 1.42L8.59 10 5.3 13.29c-.19.18-.3.43-.3.71a1.003 1.003 0 001.71.71l3.29-3.3 3.29 3.29c.18.19.43.3.71.3a1.003 1.003 0 00.71-1.71L11.41 10z" fill-rule="evenodd"></path></svg></span></button>`

    // Add body elements
    let parText = document.createElement("p");
    parText.innerHTML = `<strong>Enter text below to look for items* in your loaded Zotero dataset.</strong>
                    <br>(* only the title, year and first author fields will be searched. A more fully-featured search is coming soon - please use the <a href="http://example.com">feedback form</a> to let me know what you'd like to have.)`
    searchDialogBody.appendChild(parText);

    let searchBar = document.createElement('input');
    searchBar.id = "zotero-search-autocomplete";
    searchBar.tabIndex = "1";
    searchBar.type = "text";
    searchBar.classList.add("bp3-input");
    searchBar.classList.add("bp3-fill");
    searchDialogBody.appendChild(searchBar);

    let selectedItemDiv = document.createElement('div');
    selectedItemDiv.id = "zotero-search-selected-item";

    let selectedItemMetadata = document.createElement('div');
    selectedItemMetadata.classList.add("zotero-search-selected-item-metadata");
    let selectedItemGraphInfo = document.createElement('div');
    selectedItemGraphInfo.classList.add("zotero-search-selected-item-graph-info");

    selectedItemDiv.appendChild(selectedItemMetadata);
    selectedItemDiv.appendChild(selectedItemGraphInfo);

    searchDialogBody.appendChild(selectedItemDiv);

    // Add footer elements
    searchDialogFooter.innerHTML = `<div class="bp3-dialog-footer-actions">
                                    <span class="bp3-popover2-target" tabindex="0">
                                    <button type="button" class="zotero-update-data bp3-button">
                                    <span class="bp3-button-text">Update Zotero data</span>
                                    </button></span></div>`

    // Chain up all the DOM elements

    searchDialogDiv.appendChild(searchDialogHeader);
    searchDialogDiv.appendChild(searchDialogBody);
    searchDialogDiv.appendChild(searchDialogFooter);

    searchDialogContainer.appendChild(searchDialogDiv);

    searchOverlay.appendChild(searchOverlayBackdrop);
    searchOverlay.appendChild(searchDialogContainer);

    document.getElementById("zotero-data-importer-portal").appendChild(searchOverlay);

}
// Setup listeners

// Handles initialization of the zoteroSearch autoComplete object
function setupZoteroSearchOverlay(){
    if(zoteroSearch == null){
        zoteroSearch = new autoComplete(zoteroSearchConfig);
    } else {
        zoteroSearch.init();
    }
}

// Toggles the display of the search overlay
const toggleZoteroSearchOverlay = command => {
    zoteroSearchOverlay.style.display = command === "show" ? "block" : "none";
    if (command == "show") {
        zoteroSearchInput.focus();
        zoteroSearchVisible = true
    } else {
        zoteroSearchInput.value = "";
        zoteroSearchVisible = false
    }
}

// Add listener to the 'Update data' button in the search overlay
function setupZoteroUpdateButton(){
    zoteroUpdateButton.addEventListener("click", function() {
        if(ZoteroData !== null){
            updateZoteroData(USER_REQUEST.apikey, USER_REQUEST.dataURI, USER_REQUEST.params);
        }
    })
}

// Add listeners to close the search overlay
function setupZoteroSearchClose(){
    // Add listener to the close button
    zoteroSearchCloseButton.addEventListener("click", function(){
        toggleZoteroSearchOverlay("hide");
    })
    // Add listener for Esc keypress
    window.addEventListener("keydown", (e) => {
        if(e.key === "Escape" && zoteroSearchVisible){
            toggleZoteroSearchOverlay("hide");
        }
    })
}

// Function to process ZoteroData into a simplified, more usable data array for the autoComplete
function simplifyDataArray(arr){
    // Filter out attachments & notes
    let itemsArray = arr.filter(function(el){ return el.data.itemType != "attachment" && el.data.itemType != "note" });
    // Simplify data structure
    itemsArray.forEach(function(item, index, array){
        // Title - searchable
        let titleString = (item.data.title) ? item.data.title : "";
        // Authors (simplified) - searchable
        let authorsString = (item.meta.creatorSummary) ? item.meta.creatorSummary : "";
        let metadataString = "";
        // Year - searchable
        let itemDate = "";
        if(item.meta.parsedDate){
            itemDate = new Date(item.meta.parsedDate);
            itemDate = itemDate.getUTCFullYear().toString();
            metadataString = metadataString + "(" + itemDate + ")";
        }
        if(item.data.publicationTitle) {
            metadataString = metadataString + ", " + item.data.publicationTitle
        } else if(item.data.university){
            metadataString = metadataString + ", " + item.data.university;
        } else if(item.data.bookTitle){
            metadataString = metadataString + ", in " + item.data.bookTitle;
        };
        if(item.data.publisher){
            metadataString = metadataString + ", " + item.data.publisher;
            if(item.data.place){
                metadataString = metadataString + ": " + item.data.place;
            }
        };
        if(item.data.volume){
            metadataString = metadataString + ", " + item.data.volume;
            if(item.data.issue){
                metadataString = metadataString + "(" + item.data.issue + ")"
            }
        }
        if(item.data.pages){
            metadataString = metadataString + ", " + item.data.pages + ".";
        }
        array[index] = {
            key: item.key,
            title: titleString,
            authors: authorsString,
            year: itemDate,
            meta: metadataString
        }
    })

    return itemsArray;
}

// Function to look up a page in the graph based on its title
function lookForPage(title){
    let pageInfo = null;
    let pageSearch = roamAlphaAPI.q('[:find ?uid :in $ ?title :where[?p :block/uid ?uid][?p :node/title ?title]]', title);
    
    if(pageSearch.length > 0){
        pageInfo = {
            present: true,
            uid: pageSearch[0][0]
        }
    } else{
        pageInfo = {
            present: false
        }
    }
    
    return pageInfo;
}

async function addSearchResult(title, uid){
    let citekey = title.replace("@", "");
    let item = ZoteroData.find(function (i) { return i.key == citekey });
    let itemData = formatData(item);

    if(item && itemData.length > 0){
        if(uid) {
            await addMetadataArray(page_uid = uid, arr = itemData);
        } else {
            roamAlphaAPI.createPage(title);
            let pageUID = await waitForPageUID(title);
            await addMetadataArray(page_uid = pageUID, arr = itemData);
        }
    } else {
        alert("Something went wrong when attempting to format the item's data.");
        console.log(item);
        console.log(itemData);
    }
}

// Get the UID of a newly-created page
async function waitForPageUID(page_title) {
    let pageUID = null;
    let found = false;
    let tries = 0;
    // As long as the page hasn't been found, keep checking it
    try {
        do {
            pageUID = roamAlphaAPI.q("[:find ?uid :in $ ?title :where[?p :node/title ?title][?p :block/uid ?uid]]", page_title);
            if(pageUID.length > 0){
                found = true;
                return pageUID[0][0];
            }
            // Keep track of attempts to avoid infinite search, and wait a bit before continuing
            tries = tries + 1;
            await sleep(75);
        } while (tries < 50 && !found);
        // If after 50 attempts there still isn't a match, throw an error
        console.log(pageUID);
        throw new error('The page couldn\'t be found');
    } catch (e) {
        console.error(e);
    }
}