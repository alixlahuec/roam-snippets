
document.addEventListener('mouseover', (e) => {
    let target = e.target;

    if (target.classList.contains("rm-page-ref")) {
        console.log('Checking if this is a paper...');
        console.log(target);

        let parentDiv = target.parentElement;

        let isPageRef = null;
        let isPageTag = null;

        if (typeof (parentDiv.dataset.linkTitle) !== 'undefined') {
            isPageRef = parentDiv.dataset.linkTitle.startsWith("@");
            console.log('It looks like a page reference ?');
        }
        if (typeof (target.dataset.tag) !== 'undefined') {
            isPageTag = parentDiv.dataset.tag.startsWith("@");
            console.log('It looks like a tag ?');
        }

        if (isPageRef | isPageTag) {
            console.log("Let's look for a paper title...");
            if (typeof (parentDiv.dataset.paperTitle) === 'undefined') {
                console.log('This link has no title info yet');
                let pageName = null;
                if (isPageRef) { pageName = parentDiv.dataset.linkTitle; }
                if (isPageTag) { pageName = parentDiv.dataset.tag; }

                let attrTitle = window.roamAlphaAPI.q('[:find ?bString :in $ ?pageName :where [?page :node/title ?pageName] [?page :block/children ?titleBlock] [?titleBlock :block/string ?bString] [?titleBlock :block/refs ?bAttr] [?bAttr :node/title "Title"]]', pageName);
                if(attrTitle.length > 0){
                    if (typeof (attrTitle[0] !== 'undefined')) {
                        console.log('Now adding the title that was found');
                        parentDiv.dataset.paperTitle = attrTitle[0][0].replace("Title:: ", "");
                    }
                }
            }
        }
    }
})