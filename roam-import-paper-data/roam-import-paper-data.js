
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

if (document.getElementById('zotero-data-icon') == null) {
    zoteroDataButton();
    createZoteroContextMenu();
    zoteroContextMenu = document.querySelector('.zotero-context-menu');
    zoteroContextBackdrop = document.querySelector('.zotero-context-backdrop');
    zoteroContextMenuOptions = document.querySelectorAll('.zotero-context-menu-option');
    setupZoteroContextMenu();
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

                document.getElementById('zotero-data-icon').style = "background-color: #60f06042;";
                console.log('The results of the API request have been received ; you can check them by inspecting the value of the ZoteroData object. Data import context menu should now be available.')
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
        console.log('Data and request outputs have been removed');
    }
}

function checkCitekeys() {
    let refCitekeys = document.querySelectorAll('.ref-citekey');
    let newMatches = 0;
    let newUnmatches = 0;

    if (refCitekeys.length > 0) {
        for (i = 0; i < refCitekeys.length; i++) {
            let ref = refCitekeys[i];
            // References that have a data-zotero-bib attribute have already been checked, let's not check them again
            if (ref.dataset.zoteroBib) {
                continue;
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

function removeRequestResults() {
    refCitekeys = document.querySelectorAll("ref-citekey");
    for (i = 0; i < refCitekeys.length; i++) {
        let ref = refCitekeys[i];
        // Leave in the class so that the search doesn't start all over again if another request is made
        // But make sure to remove the attribute to allow for a fresh check, and the context menu listener as well
        ref.removeAttribute("data-zotero-bib");
        ref.querySelector('.rm-page-ref').removeEventListener("contextmenu", addListenerToRefCitekey);
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

const setPositionZoteroDataMenu = ({ top, left }) => {
    zoteroContextMenu.style.left = `${left}px`;
    zoteroContextMenu.style.top = `${top}px`;
    toggleZoteroDataMenu("show");
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
    try{
        ZoteroData = await fetchZoteroData(requestObject.apikey, requestObject.dataURI, requestObject.params);
    } catch(e){
        console.error(e);
    }
    // TODO: Add handling of non-200 response codes from the API
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

// From Stack Overflow : https://stackoverflow.com/questions/45018338/javascript-fetch-api-how-to-save-output-to-variable-as-an-object-not-the-prom/45018619 
async function fetchZoteroData(apiKey, dataURI, params) {
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
// Each returns an array of strings, which correspond to the content of the blocks to be added
// Block strings should be added in the order they're meant to be on the page
// Default addition, FYI, is as direct children of the page ; nesting requires getting a block UID so it's harder to do right now (would require multi-step process probably)
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

// DEV SECTION FOR NESTING SUPPORT
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
            // Note: Every child of an Object block should be an Object, with a string property & (optionally) a children property
            // TODO: Add note to documentation to that effect
            for(j = object.children.length - 1; j >= 0; j--){
                await addBlockObject(top_uid, object.children[j]);
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