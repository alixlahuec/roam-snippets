
// Looking at Eneko's code for a Roam -> LaTeX converter

// Got to request :block/order to be able to put blocks in their page order
// Also have to ask for element [0] because of how the results are structured (note that it's [0] instead of [0][0] because I used the [() ...] structure)
// Probably also want to ask about headers (Note: if a block is a regular block, there will be no `heading` property returned for the block)
// Probably also want to ask about view-type (Note : if no view has been specified, there will be no `view-type` property returned for the parent block)
// Probably also want to ask about text-align (... again, if not set, no property will be returned. Can use destructuring with default value when processing each block)


// INITIALIZATION ------

createOverlayDialog();
setupExportOverlay();
addExportButton();
window.addEventListener("hashchange", addExportButton);

// FUNCTIONS ------

// INTERFACE ---

function createOverlayDialog(){
    // Create BP3 portal
    var portalDiv = document.createElement("div");
    portalDiv.classList.add("bp3-portal");
    portalDiv.id = "roam-to-latex-portal";
    document.getElementById("app").appendChild(portalDiv);

    // Create BP3 overlay, dialog, and elements
    let searchOverlay = document.createElement("div");
            searchOverlay.classList.add("bp3-overlay");
            searchOverlay.classList.add("bp3-overlay-open");
            searchOverlay.classList.add("bp3-overlay-scroll-container");
            searchOverlay.classList.add("roam-to-latex-overlay");
            searchOverlay.style = "display:none;"
        
            let searchOverlayBackdrop = document.createElement("div");
            searchOverlayBackdrop.classList.add("bp3-overlay-backdrop");
            searchOverlayBackdrop.classList.add("bp3-overlay-appear-done");
            searchOverlayBackdrop.classList.add("bp3-overlay-enter-done");
            searchOverlayBackdrop.classList.add("roam-to-latex-backdrop");
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
            searchDialogHeader.innerHTML = `<button type="button" aria-label="Close" class="roam-to-latex-close bp3-button bp3-minimal bp3-dialog-close-button">
                                            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>`
        
            // Add body elements

            let exportDiv = document.createElement('div');
            exportDiv.id = "roam-to-latex-export-div";

            let exportSettings = document.createElement('div');
            exportSettings.id = "roam-to-latex-export-settings";
            exportSettings.style = `display:flex;margin-bottom:20px;justify-content:space-between;align-items:center;flex-wrap:wrap;`;
            exportSettings.innerHTML = `
            ${createSelect(id = "roam-to-latex-setting-document-class", values = ["report", "article", "book"], {divClass: "bp3-minimal", labels: ["Report", "Article", "Book"], selected: 0})}
            <label class="bp3-label">
                Written by
                <input type="text" class="bp3-input" id="roam-to-latex-setting-authors" dir="auto" placeholder="Author(s)"/>
            </label>
            <label class="bp3-label">
                Title
                <input type="text" class="bp3-input" id="roam-to-latex-setting-title" dir="auto" placeholder="Document Title" />
            </label>
            ${createToggle(id = "roam-to-latex-setting-cover", text = "Include cover title")}
            ${createToggle(id = "roam-to-latex-setting-numbered", text = "Numbered headers")}
            <label class="bp3-label">
                Start Header
                ${createSelect(id = "roam-to-latex-setting-start-header", values = ["1", "2", "3", "4"], {divClass: "bp3-minimal", selected: 0})}
            </label>
            <button type="button" id="roam-to-latex-export-trigger" class="bp3-button bp3-outlined bp3-intent-success bp3-fill"><span class="bp3-button-text">Export page contents</span></button>
            `;

            let exportForm = document.createElement('form');
            exportForm.id = "roam-to-latex-export-form";
            exportForm.setAttribute('action', 'https://www.overleaf.com/docs');
            exportForm.setAttribute('method', 'POST');
            exportForm.setAttribute('target', '_blank');
            exportForm.classList.add("bp3-fill");
            exportForm.innerHTML = `
            <textarea name="snip" id="roam-to-latex-export-contents" class="bp3-input bp3-small bp3-fill" style="min-height:400px;"></textarea>
            <input type="submit" value="Export to Overleaf" disabled>`;
            exportForm.style = "display:none;";

            exportDiv.appendChild(exportSettings);
            exportDiv.appendChild(exportForm);
            searchDialogBody.appendChild(exportDiv);
        
            // Add footer elements
            searchDialogFooter.innerHTML = `<div class="bp3-dialog-footer-actions">
                                                <span class="bp3-popover2-target" tabindex="0">
                                                    <button type="button" class="roam-to-latex-export-tex bp3-button">
                                                    <span class="bp3-button-text">Export to .tex file</span>
                                                    </button>
                                                </span>
                                            </div>`
        
            // Chain up all the DOM elements
        
            searchDialogDiv.appendChild(searchDialogHeader);
            searchDialogDiv.appendChild(searchDialogBody);
            searchDialogDiv.appendChild(searchDialogFooter);
        
            searchDialogContainer.appendChild(searchDialogDiv);
        
            searchOverlay.appendChild(searchOverlayBackdrop);
            searchOverlay.appendChild(searchDialogContainer);
        
            document.getElementById("roam-to-latex-portal").appendChild(searchOverlay);
}

function setupExportOverlay(){
    document.querySelector(".roam-to-latex-close").addEventListener("click", function(){ toggleExportOverlay("hide") });
    document.querySelector("#roam-to-latex-export-trigger").addEventListener("click", startExport);
}

function addExportButton(){
    if(location.href.includes("/page/")){
        let titleElement = document.querySelector('h1.rm-title-display') || false;
        if(titleElement){
            let exportButton = document.createElement('button');
            exportButton.id = "roam-to-latex-btn";
            exportButton.classList.add("bp3-button");
            exportButton.classList.add("bp3-small");
            exportButton.innerHTML = `<span class="bp3-button-text">Export to LaTeX</span>`;
            titleElement.closest('div').appendChild(exportButton);
            document.querySelector("#roam-to-latex-btn").addEventListener("click", function(){ toggleExportOverlay("show") });
        }
    }
    clearExportElements();
}

function clearExportElements(){
    document.querySelector("#roam-to-latex-export-contents").value = ``;
    document.querySelector("#roam-to-latex-export-form input[type='submit']").disabled = true;
}

function toggleExportOverlay(command){
    switch(command){
        case "show":
            document.querySelector(".roam-to-latex-overlay").style.display = "block";
            document.querySelector("#roam-to-latex-setting-title").value = document.title;
            break;
        case "hide":
            document.querySelector(".roam-to-latex-overlay").style.display = "none";
    }
}

function startExport(){
    // Get value of HTML form elements
    let document_class = document.querySelector('#roam-to-latex-setting-document-class select').value;
    let authors = document.querySelector('#roam-to-latex-setting-authors').value;
    let title = document.querySelector('#roam-to-latex-setting-title').value;
    let numbered = document.querySelector('#roam-to-latex-setting-numbered').checked;
    let cover = document.querySelector('#roam-to-latex-setting-cover').checked;
    let start_header = Number(document.querySelector('#roam-to-latex-setting-start-header select').value);

    // TODO: stuff to show contents are being processed (e.g, static spinner)

    // Launch processing of page contents
    let texOutput = createTEX(document_class = document_class, {numbered: numbered, cover: cover, start_header: start_header, authors: authors, title: title});

    // Display results, and enable action buttons
    let contentsArea = document.querySelector('#roam-to-latex-export-contents');
    contentsArea.value = texOutput;
    
    document.querySelector("#roam-to-latex-export-form input[type='submit']").removeAttribute('disabled');
    document.querySelector("#roam-to-latex-export-form").style.display = "block";

    // TODO: stuff to enable the "Export to Overleaf", "Download as .tex" and "Copy to Clipboard" buttons
}

// PARSER ---

// Basic structure taken from https://github.com/mundimark/markdown-vs-latex
function createTEX(document_class = "book", {numbered = true, cover = true, start_header = 1, authors = "", title = ""} = {}){
    let roamPage = queryPageContentsByTitle(document.title);

    let header = `\n\\documentclass{${document_class}}\n\\title{${title}}\n\\author{${authors}}\n\\date{${todayDMY()}}\n\n\\usepackage{soul}\n\\usepackage{hyperref}\n\n\\begin{document}\n${cover ? "\\maketitle" : ""}`;

    let body = ``;
    body += convertBlocks(roamPage.children, {document_class: document_class, numbered: numbered, start_header: start_header});

    let footer = `\n\\end{document}`;

    return `${header}\n${body}\n${footer}`;
}

function convertBlocks(arr, {document_class = "book", numbered = true, start_header = 1} = {}){
    let output = ``;
    let blocks = sortRoamBlocks(arr);

    blocks.forEach(block => {
        if(block.heading){
            output = `${output}\n${makeHeader(block.string, {document_class: document_class, numbered: numbered, level: start_header})}`;
            if(block.children){
                if(block['view-type'] == "document" || typeof(block['view-type']) == 'undefined'){
                    output = `${output}${convertBlocks(block.children, {document_class: document_class, numbered: numbered, start_header: start_header+1})}`;
                } else{
                    output = `${output}${makeList(block.children, type = block['view-type'])}`;
                }
            }
        } else{
            // If the block isn't a heading, stop using the header tree for recursion
            output = `${output}${parseBlock(block)}`;
        }
    });
    if(output.slice(-2) == "\\\\"){
        output = output.slice(start = 0, end = -2);
    }
    return output;
}

function makeHeader(string, {document_class = "book", numbered = true, level = 1} = {}){
    let cmd = "";
    let header_level = (document_class == "article") ? (level + 1) : level;
    switch(header_level){
        case 1:
            cmd = "chapter";
            break;
        case 2:
            cmd = "section";
            break;
        case 3:
            cmd = "subsection";
            break;
        case 4:
            cmd = "subsubsection";
            break;
        default:
            return `${formatText(string)}\\\\`;
    };

    return `\\${cmd}${(!numbered) ? "*" : ""}{${formatText(string)}}\n`;
}

function makeList(elements, type, start_indent = 0){
    let nesting_level = start_indent/2 + 1;
    let list_indent = "\t".repeat(start_indent);
    if(nesting_level <= 5){
        let cmd = (type == "bulleted") ? "itemize" : "enumerate";
        let blocks = elements.map(el => `${"\t".repeat(start_indent+1)}${parseListElement(el, start_indent+1)}`);
        return `${list_indent}\\begin{${cmd}}\n${blocks.join("\n")}\n${list_indent}\\end{${cmd}}`;
    } else{
        return `${list_indent}${elements.map(el => renderRaw(el)).join("\\\\")}`;
    }
}

function parseBlock(block){
    let output = `${formatText(block.string)}`;
    // Do stuff to process the children of a non-heading block
    if(block.children){
        let format = (block['view-type']) ? block['view-type'] : "bulleted";
        switch(format){
            case 'document':
                output = `${output}\\\\\n${block.children.map(child => parseBlock(child)).join("\\\\")}`;
                break;
            case 'bulleted':
            case 'numbered':
                output = `${output}\n${makeList(block.children, type = format, start_indent = 0)}`;
                break;
        }
    }
    return output;
}

function parseListElement(block, start_indent){
    let output = ``;
    let format = (block['view-type']) ? block['view-type'] : "bulleted";
    switch(format){
        // If the list item is in "Document" mode, pull all of its content as raw & use that as the list item, with newline separation
        case 'document':
            output = `\\item{${renderRaw(block)}}`;
            break;
        // Otherwise, use the string as the list item & render a sublist
        case 'bulleted':
        case 'numbered':
            if(block.children){
                output = `\\item{${formatText(block.string)}}\n${makeList(block.children, type = format, start_indent = start_indent + 1)}`;
            } else{
                output = `\\item{${formatText(block.string)}}`;
            }
            break;
    }
    return output;
}

// RENDERER ---

function renderRaw(block){
    let output = formatText(block.string);
    if(block.children){
        output = `${output}\\\\${block.children.map(child => renderRaw(child)).join("\\\\")}`;
    }
    return output;
}

function renderDoublePar(content){
    // Check if content is a valid block reference
    let isBlockRef = roamAlphaAPI.q('[:find ?id :in $ ?uid :where[?id :block/uid ?uid]]', content).length > 0;
    // If it's a block ref, render its contents
    if(isBlockRef){
        return renderBlockRef(content);
    } else{
        // In Roam, it's invalid to insert any aliases in a `(())` so no need to handle that case here
        // If the `(())` just contains text, render it as footnote
        return `\\footnote{${content}}`;
    }
}

// RAW only
function renderBlockRef(uid){
    let blockString = roamAlphaAPI.q('[:find ?str :in $ ?uid :where[?b :block/uid ?uid][?b :block/string ?str]]', uid);
    // Do stuff to find any block references within the block, and render them
    return blockString;
}

// RAW only
function renderBlockEmbed(uid){
    let blockContents = queryBlockContents(uid);
    // TODO: handle processing of actual block structure
    // For now, just rendering everything as one raw block to test basic parsing
    return renderRaw(blockContents);
}
// RAW only
function renderPageEmbed(title){
    let pageContents = queryPageContentsByTitle(title);
    // TODO: handle actual processing of actual page structure
    // For now, just rendering everything as one raw block to test basic parsing
    return `${pageContents.title}\\${(pageContents.children) ? pageContents.children.map(child => renderRaw(child)).join("\n") : ""}`;
}

// FORMATTER ---

function formatText(string){
    let output = string;

    // RENDERING BLOCK REFS/EMBEDS etc. ---------
    // Aka, is there additional text content that needs to be pulled ?

    // Block aliases
    let blockAliasRegex = /\[(.+?)\]\(\(\((.+?)\)\)\)/g;
    output = output.replaceAll(blockAliasRegex, (match, p1, p2) => `${p1} \\footnote{${renderBlockRef(uid = p2)}}`);

    // Embeds : blocks
    let embedBlockRegex = /\{{2}(\[\[)?embed(\]\])?: ?\(\((.+?)\)\)\}{2}/g;
    output = output.replaceAll(embedBlockRegex, (match, p1, p2, p3) => renderBlockEmbed(uid = p3));

    // Embeds : pages
    let embedPageRegex = /\{{2}(\[\[)?embed(\]\])?: ?\[\[(.+?)\]\]\}{2}/g;
    output = output.replaceAll(embedPageRegex, (match, p1, p2, p3) => renderPageEmbed(title = p3));

    // `(())` markup
    let doubleParRegex = /\(\(([^\(\)]+?)\)\)/g;
    output = output.replaceAll(doubleParRegex, (match, p1) => renderDoublePar(content = p1));

    // Page aliases
    let pageAliasRegex = /\[(.+?)\]\(\[\[(.+?)\]\]\)/g;
    output = output.replaceAll(pageAliasRegex, `$1`);

    // Page references
    // Note: this will remove all instances of `[[` and `]]`, even if they're not page references.
    let pageRefRegex = /(\[\[|\]\])/g;
    output = output.replaceAll(pageRefRegex, "");

    // Alias links markup
    let aliasRegex = /\[(.+?)(\]\()(.+?)\)/g;
    output = output.replaceAll(aliasRegex, `\\href{$3}{$1}`);

    // Tags : will be removed
    let tagRegex = /\#(.+?) /g;
    output = output.replaceAll(tagRegex, "");

    // ESCAPING SPECIAL CHARACTERS --------------

    let spec_chars = ["&", "%", "#"];
    spec_chars.forEach(char => {
        let charRegex = new RegExp(`${char}`, "g");
        output = output.replaceAll(charRegex, "\\$&");
    });

    // FORMATTING ACTUAL TEXT -------------------

    // Bold markup
    let boldRegex = /\*{2}([^\*]+?)\*{2}/g;
    output = output.replaceAll(boldRegex, `\\textbf{$1}`);
    // Italic markup
    let italicRegex = /_{2}([^_]+?)_{2}/g;
    output = output.replaceAll(italicRegex, `\\textit{$1}`);
    // Highlight markup
    let highlightRegex = /\^{2}([^\^]+?)\^{2}/g;
    output = output.replaceAll(highlightRegex, `\\hl{$1}`);

    // TODO:
    // + actual LaTeX math
    // + the =: thing ?
    // + citations, of course
    // + tables
    // + iframe/video embed/pdf embed ?
    // + clean up calc/word-count/etc. ?
    // strikethrough : seems like this requires an external package, so leaving it aside for now

    return output;
}

// UTILS ---
function createToggle(id, text){
    return `
    <label class="bp3-control bp3-switch" style="margin-bottom:0px;">
    <input id="${id}" type="checkbox"><span class="bp3-control-indicator"></span>${text}</label>`;
}

function createSelect(id, values, {divClass = "", labels = values, selected = 0, selectID = ""} = {}){
    let selectDiv = document.createElement('div');
    selectDiv.id = id;
    selectDiv.classList.add("bp3-select");
    if(divClass.length > 0){
        selectDiv.classList.add(divClass);
    }
    let optionsElements = values.map( (val, index) => `<option ${(selected == index) ? "selected" : ""} value="${val}">${labels[index]}</option>`).join("\n");
    selectDiv.innerHTML = `
    <select id="${selectID}">
        ${optionsElements}
    </select>
    `;

    return selectDiv.outerHTML;
}

function todayDMY(){
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
}

function sortRoamBlocks(arr){
    return arr.sort((a,b) => a.order < b.order ? -1 : 1);
}

function queryBlockContents(uid){
    return roamAlphaAPI.q('[:find [(pull ?b [ :block/string :block/children :block/order :block/heading :children/view-type :block/text-align {:block/children ...} ]) ...] :in $ ?uid :where[?b :block/uid ?uid]]', uid)[0];
}

function queryPageContentsByTitle(title){
    return roamAlphaAPI.q(`[:find [(pull ?e [ :node/title :block/string :block/children :block/order :block/heading :children/view-type :block/text-align {:block/children ...} ]) ...] :in $ ?ptitle :where [?e :node/title ?ptitle] ]`, title)[0];
}
