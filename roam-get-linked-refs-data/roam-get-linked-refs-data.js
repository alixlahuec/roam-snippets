
function checkLinkedRefs() {
    var linkedRefsCaret = document.querySelectorAll('.rm-reference-main .rm-reference-container > .flex-h-box > span > span.bp3-icon-caret-down')[0];
    var linkedRefsDiv = document.querySelectorAll('.rm-mentions.refs-by-page-view')[0];
    
    /* If the Linked References panel is already open, add the data right away */
    if(linkedRefsCaret.classList.contains("rm-caret-open") & typeof(linkedRefsDiv) !== 'undefined'){
        let linkedRefsTitles = linkedRefsDiv.querySelectorAll('a span.rm-page__title');
            linkedRefsTitles.forEach(function (titleSpan) {
                titleSpan.closest('div.rm-ref-page-view').dataset.pageTitle = titleSpan.textContent;
            })
    }

    /* Watch for future events that hide/show Linked References */
    linkedRefsCaret.addEventListener('click', function () {
        if (linkedRefsCaret.classList.contains("rm-caret-closed")) {

            while (typeof (linkedRefsDiv) === 'undefined') {
                setTimeout(function () {
                    linkedRefsDiv = document.querySelectorAll('.rm-mentions.refs-by-page-view')[0];
                }, 500)
            }

            let linkedRefsTitles = linkedRefsDiv.querySelectorAll('a span.rm-page__title');
            linkedRefsTitles.forEach(function (titleSpan) {
                titleSpan.closest('div.rm-ref-page-view').dataset.pageTitle = titleSpan.textContent;
            })
        }
    });

}

function isPage(){
    return(window.location.href.includes("/page/"))
}

window.onload = function(){
    console.log('New load event');
    if(isPage()){
        checkLinkedRefs();
    }
}

window.onhashchange = function(){
    console.log('New hash change event');
    if(isPage()){
        checkLinkedRefs();
    }
}

