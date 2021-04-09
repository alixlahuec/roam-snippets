
var roamToLatex = {};

;(()=>{
    roamToLatex = {
        interface: {
            createOverlay(){
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
                        ${roamToLatex.interface.createSelect(id = "roam-to-latex-setting-document-class", values = ["report", "article", "book"], {divClass: "bp3-minimal", labels: ["Report", "Article", "Book"], selected: 0})}
                        <label class="bp3-label">
                            Written by
                            <input type="text" class="bp3-input" id="roam-to-latex-setting-authors" dir="auto" placeholder="Author(s)"/>
                        </label>
                        <label class="bp3-label">
                            Title
                            <input type="text" class="bp3-input" id="roam-to-latex-setting-title" dir="auto" placeholder="Document Title" />
                        </label>
                        ${roamToLatex.interface.createToggle(id = "roam-to-latex-setting-cover", text = "Include cover title")}
                        ${roamToLatex.interface.createToggle(id = "roam-to-latex-setting-numbered", text = "Numbered headers")}
                        <label class="bp3-label">
                            Start Header
                            ${roamToLatex.interface.createSelect(id = "roam-to-latex-setting-start-header", values = ["1", "2", "3", "4"], {divClass: "bp3-minimal", selected: 0})}
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
                        <textarea name="snip" id="roam-to-latex-export-contents" readonly class="bp3-input bp3-small bp3-fill" style="height:200px;"></textarea>
                        <input type="submit" value="Export to Overleaf" disabled>`;
                        exportForm.style = "display:none;";
            
                        exportDiv.appendChild(exportSettings);
                        exportDiv.appendChild(exportForm);
                        searchDialogBody.appendChild(exportDiv);
                    
                        // Add footer elements
                        searchDialogFooter.innerHTML = `<div class="bp3-dialog-footer-actions">
                                                            <span class="bp3-popover2-target" tabindex="0">
                                                                <a class="bp3-button bp3-disabled bp3-outlined roam-to-latex-export-bib">Download bibliography</a>
                                                                <a class="bp3-button bp3-disabled bp3-outlined roam-to-latex-export-figures">Download figures</a>
                                                                <a class="bp3-button bp3-disabled bp3-outlined roam-to-latex-export-tex">Download .tex file</a>
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
            },
            setupOverlay(){
                document.querySelector(".roam-to-latex-close").addEventListener("click", function(){ roamToLatex.interface.toggleOverlay("hide") });
                document.querySelector("#roam-to-latex-export-trigger").addEventListener("click", roamToLatex.startExport);
            },
            toggleOverlay(command){
                switch(command){
                    case "show":
                        document.querySelector(".roam-to-latex-overlay").style.display = "block";
                        document.querySelector("#roam-to-latex-setting-title").value = document.title;
                        break;
                    case "hide":
                        document.querySelector(".roam-to-latex-overlay").style.display = "none";
                }
            },
            addExportButton(){
                if(location.href.includes("/page/")){
                    let titleElement = document.querySelector('h1.rm-title-display') || false;
                    let parentElement = titleElement ? titleElement.closest('div') : (document.querySelector('.rm-zoom.zoom-path-view') || false);
                    if(parentElement){
                        let exportButton = document.createElement('button');
                        exportButton.id = "roam-to-latex-btn";
                        exportButton.classList.add("bp3-button");
                        exportButton.classList.add("bp3-small");
                        exportButton.innerHTML = `<span class="bp3-button-text">Export to LaTeX</span>`;
                        parentElement.appendChild(exportButton);
                        document.querySelector("#roam-to-latex-btn").addEventListener("click", function(){ roamToLatex.interface.toggleOverlay("show") });
                    }
                }
                roamToLatex.interface.clearExportElements();
            },
            clearExportElements(){
                // Export contents
                document.querySelector("#roam-to-latex-export-contents").value = ``;
                document.querySelector("#roam-to-latex-export-form input[type='submit']").disabled = true;
            
                // Figures
                roamToLatex.output.figs.count = 0;
                roamToLatex.output.figs.URLs = [];
                roamToLatex.output.figs.types = [];
                roamToLatex.output.figs.files = [];
                if(roamToLatex.output.figs.blob != null){ roamToLatex.output.figs.blob = null; URL.revokeObjectURL(roamToLatex.output.figs.blobURL) };
                if(roamToLatex.output.bib.blob != null){ roamToLatex.output.bib.blob = null; URL.revokeObjectURL(roamToLatex.output.bib.blobURL) };
                if(roamToLatex.output.tex.blob != null){ roamToLatex.output.tex.blob = null; URL.revokeObjectURL(roamToLatex.output.tex.blobURL) };
                try{
                    ["figures", "bib", "tex"].forEach(className => {
                        document.querySelector(`.roam-to-latex-export-${className}`).removeAttribute('download');
                        document.querySelector(`.roam-to-latex-export-${className}`).removeAttribute('href');
                        document.querySelector(`.roam-to-latex-export-${className}`).classList.add('bp3-disabled');
                    });
                    document.querySelector('.roam-to-latex-export-figures').innerHTML = "Download figures";
                    document.querySelector('.roam-to-latex-export-bib').innerHTML = "Download bibliography";
                } catch(e){};
                
            },
            createSelect(id, values, {divClass = "", labels = values, selected = 0, selectID = ""} = {}){
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
            },
            createToggle(id, text){
                return `
                <label class="bp3-control bp3-switch" style="margin-bottom:0px;">
                <input id="${id}" type="checkbox"><span class="bp3-control-indicator"></span>${text}</label>`;
            }
        },

        regex: {
            aliasAll: /(?:^|[^!])\[(.+?)\]\((.+?)\)/g,
            aliasBlock: /(?:^| )\[(.+?)\]\(\(\((.+?)\)\)\)/g,
            aliasPage: /\[([^\]]+?)\]\(\[\[(.+?)\]\]\)/g,
            embedBlock: /\{{2}(\[\[)?embed(\]\])?: ?\(\((.+?)\)\)\}{2}/g,
            embedPage: /\{{2}(\[\[)?embed(\]\])?: ?\[\[(.+?)\]\]\}{2}/g,
            doublePar: /\(\(([^\(\)]+?)\)\)/g,
            doubleBraces: /\{\{(.+?)\}\}/g,
            refCitekey: /\[\[@(.+?)\]\]/g,
            citekeyList: /\((.*?)(\[\[@.+?\]\])((?: ?[,;] ?\[\[@.+?\]\]){1,})(.*?)\)/g,
            citekeyPar: /\(([^\)]*?)\[\[@([^\)]+?)\]\]([^\)]*?)\)/g,
            citekey: /(^|[^\#])\[\[@([^\]]+?)\]\]/g,
            image: /!\[(.*?)?\]\((.+?)\)(.*)/g,
            codeBlock: /```([\s\S]+?)```/g,
            codeInline: /(?:^|[^`])`([^`]+?)`/g,
            tag: /(?:^| )\#(.+?)( |$)/g,
            math: /\$\$([\s\S^\$]+?)\$\$([\s\S]+)?/g,
            bold: /\*{2}([^\*]+?)\*{2}/g,
            italics: /_{2}([^_]+?)_{2}/g,
            highlight: /\^{2}([^\^]+?)\^{2}/g
        },

        render: {
            raw(block, start_indent = 0){
                let output = ``;
                // If the block is a table, stop processing recursively & generate the table element
                if(block.string.includes("{{[[table]]}}") || block.string.includes("{{table}}")){
                    output = `\n${roamToLatex.makeTable(block, start_indent = start_indent)}\n`;
                } else {
                    output = roamToLatex.formatText(block.string);
                    if(block.children){
                        output = `${output}\\\\${block.children.map(child => roamToLatex.render.raw(child, start_indent = start_indent)).join("\\\\")}`;
                    }
                }
                return output;
            },

            // RAW only
            blockEmbed(uid, mode = "raw"){
                let blockContents = roamToLatex.utils.queryBlockContents(uid);
                switch(mode){
                    case "latex":
                        // TODO: handle processing of actual block structure
                        // For now, just rendering everything as one raw block to test basic parsing
                        return roamToLatex.render.raw(blockContents);
                    case "raw":
                    default:
                        return roamToLatex.grabRawText(blockContents);
                }
            },

            // RAW only - return the block's raw string contents
            blockRef(uid){
                return roamAlphaAPI.q('[:find ?str :in $ ?uid :where[?b :block/uid ?uid][?b :block/string ?str]]', uid);
            },

            citekeyList(first, list){
                let fullList = first + list;
                let citekeys = Array.from(fullList.matchAll(/(?:\[\[@)(.+?)(?:\]\])/g)).map(match => match[1]);
                return `\\cite{${citekeys.join(", ")}}`;
            },

            codeBlock(match, capture){
                return `\\begin{verbatim}\n${capture}\n\\end{verbatim}`;
            },

            doublePar(content, mode = "raw"){
                // Check if content is a valid block reference
                let isBlockRef = roamAlphaAPI.q('[:find [?b ?text] :in $ ?uid :where[?b :block/uid ?uid][?b :block/string ?text]]', content);
                // If it's a block ref, render its contents
                if(isBlockRef.length > 0){
                    switch(mode){
                        case "latex":
                            return roamToLatex.render.blockRef(uid = content);
                        case "raw":
                        default:
                            return roamToLatex.grabRawText({string: isBlockRef[1]});
                    }
                } else{
                    switch(mode){
                        case "latex":
                            // In Roam, it's invalid to insert any aliases in a `(())` so no need to handle that case here
                            // If the `(())` just contains text, render it as footnote
                            return `\\footnote{${content}}`;
                        case "raw":
                        default:
                            return content;
                    }
                }
            },

            figure(match, caption, url, extra){
                roamToLatex.output.figs.count += 1;
                roamToLatex.output.figs.URLs.push(url);
            
                let cleanURL = url.replaceAll("%2F", "/");
                let fileInfo = Array.from(cleanURL.matchAll(/[^/]+?\.(png|jpg|jpeg)/g));
                // let fileName = fileInfo[0][0];
                let fileExt = fileInfo[0][1];
                roamToLatex.output.figs.types.push(fileExt);
            
                // Parse extra information : label, description
                // Note : the first bit of inline code will be used as the figure label, if there are others they will be ignored
                let labelRegex = /(`.+?`)/g;
                let labelMatch = Array.from(extra.matchAll(labelRegex))[0] || false;
                let labelEl = labelMatch ? `\\label{fig:${labelMatch[0].slice(1,-1)}}\n` : ``;
            
                let desc = extra.replace(labelRegex, "").trim();
                let descEl = (desc.length > 0) ? `\\medskip\n${roamToLatex.formatText(desc)}\n` : ``;
            
                return `\\begin{figure}[p]\n\\includegraphics[width=\\textwidth]{figure-${roamToLatex.output.figs.count}.${fileExt}}\n\\caption{${roamToLatex.formatText(caption)}}\n${labelEl}\n${descEl}\\end{figure}`;
            },

            mathMode(match, capture, label, offset){
                let mathContent = capture;
                if(offset == 0){
                    let eqLabel = label;
                    if(typeof(eqLabel) == 'undefined'){
                        eqLabel = ``;
                    } else{
                        let hasLabel = Array.from(eqLabel.matchAll(/(`.+?`)/g))[0] || false;
                        eqLabel = hasLabel[0] ? `\\label{eq:${hasLabel[0].slice(1,-1)}}\n` : ``;
                    }
                    return `\n\\begin{equation}\n${eqLabel}${capture}\n\\end{equation}`;
                } else{
                    return `$${mathContent.replaceAll(/\\\&/g, "&")}$${roamToLatex.formatText(label)}`;
                }
            },

            // RAW only
            pageEmbed(title, mode = "raw"){
                let pageContents = roamToLatex.utils.queryPageContentsByTitle(title);
                switch(mode){
                    case "latex":
                        // TODO: handle actual processing of actual page structure
                        // For now, just rendering everything as one raw block to test basic parsing
                        return `${pageContents.title}\\${(pageContents.children) ? pageContents.children.map(child => roamToLatex.render.raw(child)).join("\n") : ""}`;
                    case "raw":
                    default:
                        return roamToLatex.grabRawText(pageContents);
                }
            }
        },

        utils: {
            cleanUpHref(match, url, text){
                let target = url;
                target = target.replaceAll(/\\\&/g, "&");
                target = target.replaceAll(/\\\%/g, "%");
            
                return `\\href{${target}}{${text}}`;
            },
            // `entity` is the dictionary returned for the current page/current block (i.e, by queryBlockContents or queryPageContentsByTitle)
            // This function returns an Array containing all the (unique) citekey references contained in the entity's contents
            // TODO: should citekey tags also be included here ?
            getCitekeysList(entity){
                return [...new Set(Array.from(roamToLatex.grabRawText(entity).matchAll(roamToLatex.regex.refCitekey)).map(regexmatch => regexmatch[1]))]
            },
            async makeBibliography(citekeys, {include = "biblatex"} = {}){
                // Get the full data for the Zotero items
                let zoteroItems = citekeys.map(citekey => zoteroRoam.data.items.find(item => item.key == citekey));
                let librariesToCall = [...new Set(zoteroItems.map(it => it.requestLabel))].map(lib => zoteroRoam.config.requests.find(req => req.name == lib));
                // Make requests to the Zotero API for the bibliography entries of the items'
                let apiCalls = [];
                librariesToCall.forEach(lib => {
                    let libItemsToRequest = zoteroItems.filter(item => item.requestLabel == lib.name);
                    let zoteroKeys = libItemsToRequest.map(item => item.data.key);
                    let nbCalls = Math.ceil(zoteroKeys.length/50);
                    for(let i = 0; i < nbCalls; i++){
                        let keysList = zoteroKeys.slice(start = i*50, end = Math.min((i+1)*50, zoteroKeys.length)).join(",");
                        apiCalls.push(fetch(
                            `https://api.zotero.org/${lib.dataURI}?include=${include}&itemKey=${keysList}`,
                            {
                                method: 'GET',
                                headers: {
                                    'Zotero-API-Key': lib.apikey,
                                    'Zotero-API-Version': 3
                                }
                            }
                        ));
                    }
                });
                let bibResults = await Promise.all(apiCalls);
                let bibEntries = await Promise.all(bibResults.map(data => data.json()));
            
                let flatBibliography = bibEntries.flat(1).map(entry => entry[`${include}`]).sort().join("");
            
                return flatBibliography;
            },
            queryBlockContents(uid){
                return roamAlphaAPI.q('[:find [(pull ?b [ :block/string :block/children :block/order :block/heading :children/view-type :block/text-align {:block/children ...} ]) ...] :in $ ?uid :where[?b :block/uid ?uid]]', uid)[0];
            },
            queryPageContentsByTitle(title){
                return roamAlphaAPI.q(`[:find [(pull ?e [ :node/title :block/string :block/children :block/order :block/heading :children/view-type :block/text-align {:block/children ...} ]) ...] :in $ ?ptitle :where [?e :node/title ?ptitle] ]`, title)[0];
            },
            sortRoamBlocks(arr){
                return arr.sort((a,b) => a.order < b.order ? -1 : 1);
            },
            todayDMY(){
                let today = new Date();
                let dd = String(today.getDate()).padStart(2, '0');
                let mm = String(today.getMonth() + 1).padStart(2, '0');
                let yyyy = today.getFullYear();
            
                return `${dd}/${mm}/${yyyy}`;
            }
        },

        output: {
            tex: {
                blob: null,
                blobURL: null
            },
            bib: {
                blob: null,
                blobURL: null
            },
            figs: {
                count: 0,
                URLs: [],
                types: [],
                files: [],
                blob: null,
                blobURL: null
            }
        },

        async startExport(){
            // Get value of HTML form elements
            let document_class = document.querySelector('#roam-to-latex-setting-document-class select').value;
            let authors = document.querySelector('#roam-to-latex-setting-authors').value;
            let title = document.querySelector('#roam-to-latex-setting-title').value;
            let numbered = document.querySelector('#roam-to-latex-setting-numbered').checked;
            let cover = document.querySelector('#roam-to-latex-setting-cover').checked;
            let start_header = Number(document.querySelector('#roam-to-latex-setting-start-header select').value);
        
            // Launch processing of page contents
            let texOutput = await roamToLatex.createTEX(document_class = document_class, {numbered: numbered, cover: cover, start_header: start_header, authors: authors, title: title});
        
            // Prepare .zip of figures for download
            await roamToLatex.getFigures();
        
            // Display results, and enable action buttons
            let contentsArea = document.querySelector('#roam-to-latex-export-contents');
            contentsArea.value = texOutput;
        
            roamToLatex.output.tex.blob = new Blob([texOutput], {type: 'text/plain'});
            roamToLatex.output.tex.blobURL = URL.createObjectURL(roamToLatex.output.tex.blob);
            let downloadButton = document.querySelector('.roam-to-latex-export-tex');
            downloadButton.download = `${title}.tex`;
            downloadButton.href = roamToLatex.output.tex.blobURL;
            downloadButton.classList.remove("bp3-disabled");
            
            document.querySelector("#roam-to-latex-export-form input[type='submit']").removeAttribute('disabled');
            document.querySelector("#roam-to-latex-export-form").style.display = "block";
        
        },

        async getFigures(){
            if(roamToLatex.output.figs.count > 0){
                let calls = [];
                roamToLatex.output.figs.URLs.forEach( (url, i) => {
                    calls.push(fetch(url, {method: 'GET'}));
                });
                let figs = await Promise.all(calls);
                figs = figs.map( (call, i) => {
                    return {name: `figure-${i+1}.${roamToLatex.output.figs.types[i]}`, input: call};
                });
                roamToLatex.output.figs.files = figs;
        
                roamToLatex.output.figs.blob = await downloadZip(roamToLatex.output.figs.files).blob();
                roamToLatex.output.figs.blobURL = URL.createObjectURL(roamToLatex.output.figs.blob);
        
                let downloadButton = document.querySelector('.roam-to-latex-export-figures');
                downloadButton.innerHTML = `Download figures (${roamToLatex.output.figs.count})`;
                downloadButton.download = "figures.zip";
                downloadButton.href = roamToLatex.output.figs.blobURL;
                downloadButton.classList.remove("bp3-disabled");
            }
            
        },

        async createTEX(document_class = "book", {numbered = true, cover = true, start_header = 1, authors = "", title = ""} = {}){
            let exportUID = location.hash.match(/([^\/]+)$/g)[0];
            let contents = roamToLatex.utils.queryBlockContents(uid = exportUID);
        
            // Scan for citations
            let citekeys = roamToLatex.utils.getCitekeysList(entity = contents);
            let bibliography = ``;
            if(typeof(zoteroRoam) !== 'undefined' && zoteroRoam.data.items.length > 0){
                if(citekeys.length > 0){
                    try{
                        bibliography = await roamToLatex.utils.makeBibliography(citekeys, {include: "biblatex"});
                        roamToLatex.output.bib.blob = new Blob([bibliography], {type: 'text/plain'});
                        roamToLatex.output.bib.blobURL = URL.createObjectURL(roamToLatex.output.bib.blob);
            
                        let downloadButton = document.querySelector('.roam-to-latex-export-bib');
                        downloadButton.innerHTML = `Download bibliography (${citekeys.length} entries)`;
                        downloadButton.download = "bibliography.bib";
                        downloadButton.href = roamToLatex.output.bib.blobURL;
                        downloadButton.classList.remove("bp3-disabled");
                    }catch(e){
                        alert(`There was an error while preparing the bibliography :\n${e}`);
                    }
                }
            }
        
            let bibPreamble = bibliography.length > 0 ? `\\usepackage[\nbackend=biber,\nstyle=apa,\nsorting=nyt]{biblatex}\n\\addbibresource{bibliography.bib}\n` : ``;
            let bibPrint = bibliography.length > 0 ? `\\medskip\n\n\\printbibliography\n` : ``;
        
            let header = `\n\\documentclass{${document_class}}\n\\title{${title}}\n\\author{${authors}}\n\\date{${roamToLatex.utils.todayDMY()}}\n\n\\usepackage{amsmath}\n\\usepackage{graphicx}\n\\usepackage{soul}\n${bibPreamble}\\usepackage{hyperref}\n\\hypersetup{colorlinks=true,citecolor=black}\n\n\\begin{document}\n${cover ? "\\maketitle" : ""}`;
            
            roamToLatex.output.figs.count = 0;
            roamToLatex.output.figs.URLs = [];
        
            let body = ``;
            try{
                body += roamToLatex.convertBlocks(contents.children, {document_class: document_class, numbered: numbered, start_header: start_header});
            }catch(e){
                alert(`There was an error while processing the contents of the export :\n${e}`);
            }
        
            let footer = `\n${bibPrint}\\end{document}`;
        
            return `${header}\n${body}\n${footer}`;
        },

        convertBlocks(arr, {document_class = "book", numbered = true, start_header = 1} = {}){
            let output = ``;
            let blocks = roamToLatex.utils.sortRoamBlocks(arr);
        
            blocks.forEach(block => {
                if(block.heading){
                    output = `${output}\n${roamToLatex.makeHeader(block.string, {document_class: document_class, numbered: numbered, level: start_header})}`;
                    if(block.children){
                        if(block['view-type'] == "document" || typeof(block['view-type']) == 'undefined'){
                            output = `${output}${roamToLatex.convertBlocks(block.children, {document_class: document_class, numbered: numbered, start_header: start_header+1})}`;
                        } else{
                            output = `${output}${roamToLatex.makeList(block.children, type = block['view-type'])}`;
                        }
                    }
                } else{
                    // If the block isn't a heading, stop using the header tree for recursion
                    output = `${output}\n${roamToLatex.parseBlock(block)}\\\\`;
                }
            });
            if(output.slice(-2) == "\\\\"){
                output = output.slice(start = 0, end = -2);
            }
            return output;
        },

        makeHeader(string, {document_class = "book", numbered = true, level = 1} = {}){
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
                    return `${roamToLatex.formatText(string)}\\\\`;
            };
        
            return `\\${cmd}${(!numbered) ? "*" : ""}{${roamToLatex.formatText(string)}}\n`;
        },

        makeList(elements, type, start_indent = 0){
            let nesting_level = start_indent/2 + 1;
            let list_indent = "\t".repeat(start_indent);
            if(nesting_level <= 4){
                let cmd = (type == "bulleted") ? "itemize" : "enumerate";
                let blocks = elements.map(el => `${"\t".repeat(start_indent+1)}${roamToLatex.parseListElement(el, start_indent+1)}`);
                return `${list_indent}\\begin{${cmd}}\n${blocks.join("\n")}\n${list_indent}\\end{${cmd}}`;
            } else{
                return `${list_indent}${elements.map(el => roamToLatex.render.raw(el, start_indent = start_indent)).join("\\\\")}`;
            }
        },

        storeCell(block){
            return {
                text: roamToLatex.formatText(block.string),
                align: block['text-align'] ? block['text-align'].charAt(0) : "l"
            }
        },

        traverseRow(block){
            if(!block.children){
                return [[roamToLatex.storeCell(block)]];
            } else {
                return roamToLatex.utils.sortRoamBlocks(block.children).map(child => roamToLatex.traverseRow(child).map(path => [roamToLatex.storeCell(block), ...path])).flat(1);
            }
        },

        traverseTable(block){
            let rows = [];
            roamToLatex.utils.sortRoamBlocks(block.children).forEach(child => {
                rows.push(...roamToLatex.traverseRow(child));
            });
            return rows;
        },

        makeTable(block, start_indent = 0){
            let table_indent = "\t".repeat(start_indent);
        
            let afterTextMatch = Array.from(block.string.matchAll(/\{\{(?:\[\[)?table(?:\]\])?\}\}(.+)/g))[0] || false;
            // Below is the same structure as with figures rendering
            let labelRegex = /(`.+?`)/g;
            let labelMatch = Array.from(extra.matchAll(labelRegex))[0] || false;
            let labelEl = labelMatch ? `${table_indent}\\label{table:${labelMatch[0].slice(1,-1)}}\n` : ``;
        
            let desc = extra.replace(labelRegex, "").trim();
            let descEl = (desc.length > 0) ? `${table_indent}\\caption{${roamToLatex.formatText(afterTextMatch[1])}}\n` : ``;
        
            let rows = roamToLatex.traverseTable(block);
            // Count the actual number of columns
            let n_cols = rows.reduce((f, s) => f.length >= s.length ? f.length : s.length);
            // Extract alignment sequence from header row
            let align_seq = rows[0].map(col => col.align);
            if(align_seq.length < n_cols){
                let fills = Array.from({length: n_cols - align_seq.length}, () => "l");
                align_seq.push(...fills);
            }
            align_seq = align_seq.join(" ");
            // Get contents of rows
            let row_indent = "\t".repeat(start_indent+1);
            let textRows = rows.map(row => `${row_indent}` + row.map(cell => cell.text).join(" & ") + ` \\\\`).join("\n");
        
            return `${table_indent}\\begin{table}[h!]\n${table_indent}\\centering\n${table_indent}\\begin{tabular}{${align_seq}}\n${row_indent}\\hline\n${textRows}\n${row_indent}\\hline\n${table_indent}\\end{tabular}\n${descEl}${labelEl}${table_indent}\\end{table}`;
        },

        parseBlock(block){
            let output = ``;
            // If the block is a table, stop processing recursively & generate the table element
            if(block.string.includes("{{[[table]]}}") || block.string.includes("{{table}}")){
                output = roamToLatex.makeTable(block);
            } else {
                // Do stuff to process the children of a non-heading, non-table block
                output = `${roamToLatex.formatText(block.string)}`;
                if(block.children){
                    let children = roamToLatex.utils.sortRoamBlocks(block.children);
                    let format = (block['view-type']) ? block['view-type'] : "bulleted";
                    switch(format){
                        case 'document':
                            output = `${output}\\\\\n${children.map(child => roamToLatex.parseBlock(child)).join("\\\\")}`;
                            break;
                        case 'bulleted':
                        case 'numbered':
                            output = `${output}\n${roamToLatex.makeList(children, type = format, start_indent = 0)}`;
                            break;
                    }
                }
            }
            return output;
        },

        parseListElement(block, start_indent){
            let output = ``;
            if(block.string.includes("{{[[table]]}}") || block.string.includes("{{table}}")){
                output = `\\item{\n${roamToLatex.makeTable(block, start_indent = start_indent+1)}}`;
            } else {
                let format = (block['view-type']) ? block['view-type'] : "bulleted";
                switch(format){
                    // If the list item is in "Document" mode, pull all of its content as raw & use that as the list item, with newline separation
                    case 'document':
                        output = `\\item{${roamToLatex.render.raw(block, start_indent = start_indent+1)}}`;
                        break;
                    // Otherwise, use the string as the list item & render a sublist
                    case 'bulleted':
                    case 'numbered':
                        if(block.children){
                            output = `\\item{${roamToLatex.formatText(block.string)}}\n${roamToLatex.makeList(block.children, type = format, start_indent = start_indent + 1)}`;
                        } else{
                            output = `\\item{${roamToLatex.formatText(block.string)}}`;
                        }
                        break;
                }
            }
            return output;
        },

        formatText(string){
            let output = string;
        
            // RENDERING BLOCK + PAGE REFS/EMBEDS, DOUBLE PARENTHESES ---------
            // Aka, is there additional text content that needs to be pulled ?
            // Block aliases
            output = output.replaceAll(roamToLatex.regex.aliasBlock, (match, p1, p2) => `${p1} \\footnote{${roamToLatex.render.blockRef(uid = p2)}}`);
            // Embeds : blocks
            output = output.replaceAll(roamToLatex.regex.embedBlock, (match, p1, p2, p3) => roamToLatex.render.blockEmbed(uid = p3, mode = "latex"));
            // Embeds : pages
            output = output.replaceAll(roamToLatex.regex.embedPage, (match, p1, p2, p3) => roamToLatex.render.pageEmbed(title = p3, mode = "latex"));
            // `(())` markup
            output = output.replaceAll(roamToLatex.regex.doublePar, (match, p1) => roamToLatex.render.doublePar(content = p1, mode = "latex"));
        
            // DELETING ELEMENTS : iframe, word-count, block part
            output = output.replaceAll(roamToLatex.regex.doubleBraces, (match, capture) => (capture.includes("iframe") || capture.includes("word-count") || capture.includes("=:")) ? `` : `${match}`);
        
            // REPLACING ELEMENTS
            // Citekeys
            // Lists within parentheses
            output = output.replaceAll(roamToLatex.regex.citekeyList, (match, pre, first, list, post) => `(${pre}${roamToLatex.render.citekeyList(first,list)}${post})`);
            // Citations within parentheses
            output = output.replaceAll(roamToLatex.regex.citekeyPar, (match, pre, citekey, post) => `(${pre}\\cite{${citekey}}${post})`);
            // Inline citations
            output = output.replaceAll(roamToLatex.regex.citekey, (match, pre, citekey) => `${pre}\\textcite{${citekey}}`);
            // Page aliases
            output = output.replaceAll(roamToLatex.regex.aliasPage, `$1`);
            // Page references
            // Note: this will remove all instances of `[[` and `]]`, even if they're not page references.
            let pageRefRegex = /(\[\[|\]\])/g;
            output = output.replaceAll(pageRefRegex, "");
            // Alias links markup
            output = output.replaceAll(roamToLatex.regex.aliasAll, ` \\href{$2}{$1}`);
            // Image links markup
            output = output.replaceAll(roamToLatex.regex.image, (match, p1, p2, p3) => roamToLatex.render.figure(match, caption = p1, url = p2, extra = p3));
            // Code blocks
            output = output.replaceAll(roamToLatex.regex.codeBlock, (match, capture) => roamToLatex.render.codeBlock(match, capture));
            // Tags : will be removed
            output = output.replaceAll(roamToLatex.regex.tag, "");
        
            // In-text references (figures, equations, tables)
            let refRegex = /\{\{(fig|eq|table)\:(.+?)\}\}/g;
            output = output.replaceAll(refRegex, (match, type, label) => `\\ref{${type}:${label}}`);
        
            // ESCAPING SPECIAL CHARACTERS --------------
        
            let spec_chars = ["&", "%"];
            spec_chars.forEach(char => {
                let charRegex = new RegExp(`${char}`, "g");
                output = output.replaceAll(charRegex, "\\$&");
            });
        
            // Clean up wrong escapes
            // Math mode :
            output = output.replaceAll(roamToLatex.regex.math, (match, capture, label, offset) => roamToLatex.render.mathMode(match, capture, label, offset));
            // URLs :
            let urlRegex = /\\href\{(.+?)\}\{(.+?)\}/g;
            output = output.replaceAll(urlRegex, (match, p1, p2) => roamToLatex.utils.cleanUpHref(match, url = p1, text = p2));
            // Inline code
            output = output.replaceAll(roamToLatex.regex.codeInline, (match, capture) => `\\verb|${capture}|`);
        
            // FORMATTING ACTUAL TEXT -------------------
            // Blockquote
            if(output.charAt(0) == ">"){
                output = `\\begin{quote}${output.slice(start = 1)}\\end{quote}`;
            }
            // Bold markup
            output = output.replaceAll(roamToLatex.regex.bold, `\\textbf{$1}`);
            // Italic markup
            output = output.replaceAll(roamToLatex.regex.italics, `\\textit{$1}`);
            // Highlight markup
            output = output.replaceAll(roamToLatex.regex.highlight, `\\hl{$1}`);
        
            // TODO:
            // + clean up calc/etc. ?
            // + attributes ?
            // strikethrough : seems like this requires an external package, so leaving it aside for now
        
            return output;
        },

        grabRawText(block){
            let output = block.string || "";
            if(block.children){
                output = `${output} ${block.children.map(child => roamToLatex.grabRawText(child)).join(" ")}`
            }
            // Parse the text for any block references, or block/page embeds
            // Block references (check all uses of parentheticals)
            output = output.replaceAll(roamToLatex.regex.doublePar, (match, p1) => roamToLatex.render.doublePar(content = p1, mode = "raw"));
            // Block embeds
            output = output.replaceAll(roamToLatex.regex.embedBlock, (match, p1, p2, p3) => roamToLatex.render.blockEmbed(uid = p3, mode = "raw"));
            // Page embeds
            output = output.replaceAll(roamToLatex.regex.embedPage, (match, p1, p2, p3) => roamToLatex.render.pageEmbed(title = p3, mode = "raw"));
            
            return output;
        }
    };

    // Load the lightweight client-zip library
    var s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/npm/client-zip/worker.js";
    s.type = "text/javascript";
    s.id = "client-zip";
    document.getElementsByTagName("head")[0].appendChild(s);

    // Setup the UI
    roamToLatex.interface.createOverlay();
    roamToLatex.interface.setupOverlay();
    roamToLatex.interface.addExportButton();
    window.addEventListener("hashchange", roamToLatex.interface.addExportButton);

})();