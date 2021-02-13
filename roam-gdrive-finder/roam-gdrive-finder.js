
const CLIENT_ID = '332055062482-f4tb8g8oev2c5ldsnsfjqrmtudocgvrs.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAiS-gs265D9PkvAqfXgWT27Y0m29Fn5nc';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive';

addGDriveButtons()
handleClientLoad()

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

function addGDriveButtons(){
    var button_auth = document.createElement('button');
    button_auth.id = "authorize_button";
    button_auth.style = "display: none;";
    button_auth.innerText = "Authorize";
    var button_logout = document.createElement('button');
    button_logout.id = "signout_button";
    button_logout.style = "display: none;";
    button_logout.innerText = "Sign Out";

    var roamTopbar = document.getElementsByClassName("rm-topbar");
    roamTopbar[0].appendChild(button_auth);
    roamTopbar[0].appendChild(button_logout);
}

// CODE FOR HANDLING INTERACTION WITH ROAM

// A utility function to get a block's UID from its HTML id
function getUIDfromHTML(block){
    let blockID = block.id;
    let blockUID = null;
    if(blockID.startsWith("block-input-uuid")){
        // The regex is ugly but using \w for alphanumeric characters didn't work
        blockUID = blockID.match('block-input-uuid[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}-(.+)')[1];
    } else if(blockID.includes("body-outline")){
        blockUID = blockID.match('-body-outline-[a-z0-9]{9}-(.+)')
    } else {
        console.log(blockID);
        throw new Error('Can\'t parse the block UID from the HTML id');
    }

    return blockUID;
}
// For a given block UID, returns the block's text contents
function getBlockText(uid){
    return roamAlphaAPI.q('[:find ?text :in $ ?uid :where[?b :block/uid ?uid][?b :block/string ?text]]', uid)[0][0];
}
// A utility function to update a block's contents
function editBlock(uid, blockString){
    roamAlphaAPI.updateBlock({'block': {'uid': uid, 'string': blockString}});
}

// Here's the basic flow : 
// 1. Continuously look out for buttons whose inner text matches gdrive | stuff
// 2. Attach an event listener to each button, for click event
// 3. The event listener triggers the whole process below :
///// a. Use regex matching to extract file name from button's inner text
///// b. Run search for file according to user search settings
///// c. If the search has returned results, grab the block's UID using getUIDfromID()
///// d. Run getBlockText() to retrieve the block's text contents
///// e. Replace the gdrive button code in the text contents by the iframe code
///// f. Run roamAlphaAPI.updateBlock() to modify the block's contents

function addIframeListener(){
    var gdriveButtons = Array.from(document.querySelectorAll('.roam-block button')).filter(function(el){return el.innerText.startsWith("gdrive")});
    for(i=0;i < gdriveButtons.length; i++){
        gdriveButtons[i].addEventListener("click", addIframe);
    }
}

async function addIframe(e){
    let blockDiv = e.target.closest('.roam-block');
    let buttonText = e.target.innerText;
    await replaceButtonByIframe(blockDiv, buttonText);
}

async function replaceButtonByIframe(block, buttonString){
    // Escaping the vertical bar properly was actually tricky on this one
    // I'd pick another symbol but it's the one I like best
    let buttonArg = buttonString.match("gdrive ?[\|] ?(.+)")[1];
    // Set up query to GDrive
    let query = "'1sN2UU0-BLL9F-cfgJhIo1gMQBzIpIDXN' in parents and name = '" + buttonArg + "'";
    let iframeLink = await runFileLinkSearch(query);
    // If successful, then prepare to edit the contents of the Roam block
    let blockUID = getUIDfromHTML(block);
    let blockText = getBlockText(blockUID);

    let updatedText = blockText.replace(buttonString, "iframe: "+ iframeLink.link);

    editBlock(blockUID, updatedText);
}

// Given a file Object {id, webViewLink} the function sets its permissions as 'read-only, for anyone with a link'
// Then returns the preview-link for it
async function makeIframeLink(fileObject) {
    if (!(fileObject.id && fileObject.webViewLink)) {
        throw new Error('The file object is missing one or both of : id, webViewLink');
    } else {
        // Set shareable link permissions to "Read-only" for "Anyone with a link"
        // From https://stackoverflow.com/questions/15202163/get-shared-link-through-google-drive-api
        await gapi.client.drive.permissions.create({
            fileId: fileObject.id,
            resource: {
                role: 'reader',
                type: 'anyone'
            }
        });

        // Take the shareable link & switch 'view' for 'preview' to render the file in Roam
        return { link: fileObject.webViewLink.replace('view', 'preview')};
    }
}

// TODO: Think up a better way to do customization
// TODO: also remove the hardcoding of the query string after testing
async function runFileLinkSearch(queryString){
    try{
        // Run the query & return both file ID & shareable link
        let fileSearch = await gapi.client.drive.files.list({
            q: queryString,
            fields: 'files(id,webViewLink)'
        });
        if(fileSearch.result.files && fileSearch.result.files.length > 0){
            // Take first result
            let gFile = fileSearch.result.files[0];
            let iframeLink = await makeIframeLink(gFile);

            return {link: iframeLink.link};
        } else {
            throw new Error('The search didn\'t return any files');
        }
    } catch(e){
        console.log(e);
    }
}

// CODE FROM GDRIVE JS API CLIENT

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    }, function (error) {
        console.log(error);
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus (isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        // Insert the yet unwritten function that sets up the continuous listening for gdrive buttons
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        // Insert the yet unwritten function that removes the event listeners & also changes the state of the application to not-listening
    }
}

// Handle sign in/sign out on button clicks
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}
