## roam-import-paper-data

Summary of the extension :

1. Makes a request to the Zotero Web API, based on user-specified request settings. If a dataset is returned, it's stored in memory as an array of items.
2. The dataset is checked for pinned citekeys. For each item, if it has a pinned citekey, it becomes the item's key in the dataset instead of the Zotero item key.
3. While the extension is active, all page references with a `data-link-title` starting with `@` are checked against the dataset. If a match is found, right-clicking on the reference will bring up an option to import the item's data into Roam. Options are available for the user to specify formatting functions.
4. When the extension is turned off, the dataset is removed from memory and the status of reference citekeys is reset.

### Loom Demo

[![Demo video for Roam Zotero Data Importer](https://cdn.loom.com/sessions/thumbnails/56f426963d5541128a0aec2825bd6984-with-play.gif)](https://www.loom.com/share/56f426963d5541128a0aec2825bd6984)

### Example of use in a {{[[roam/js]]}} block

To get started, add the following in a {{[[roam/js]]}} block :

```js
USER_REQUEST = {
    apikey: 'your API key', // Get this from zotero.org/settings/keys ->  "Create new private key"
    dataURI: 'the data URI to use for the request', // Construct this using the Zotero API documentation : https://www.zotero.org/support/dev/web_api/v3/basics#user_and_group_library_urls
    params: 'the search parameters to use for the request' // Construct this using the Zotero API documentation : https://www.zotero.org/support/dev/web_api/v3/basics#read_requests
    // If params is left blank, the request will use default settings (i.e, return *all data* in JSON format)
}

var s = document.createElement("script");
s.src = "https://greenmeen.github.io/roam-snippets/roam-import-paper-data/roam-import-paper-data.js";
s.id = "roam-import-paper-data";
s.type = "text/javascript";
document.getElementsByTagName("body")[0].appendChild(s);
```

Note : to construct the data URI, you'll need to obtain your user ID (or the group ID if you want to get results from a group library). **User IDs are not the same as usernames** ; each user has a unique user ID to be used for authentication in API requests, so that only you can make a request for your private data. It's available on the [Feeds/API page in your web settings](www.zotero.org/settings/keys).


#### User options

There are 3 user-defined variables that can be set ; they should be declared globally, otherwise they won't be available to the extension.

 - **USER_REQUEST** (mandatory) is an array containing 3 named values : `apikey` (obtained from Zotero), `dataURI` (the set of items to query ; can be a library, a collection, etc.), and `params` (string of request parameters ; the initial `?` should be omitted). For shared graphs, use at your own risk ; your API key will be openly accessible. 
    + Example :    
    ```js
    USER_REQUEST = {
    apikey: 'XXXXXXXXXXXXXXXXXXXXXXXX',
    dataURI: 'users/<user_id>/collections/<collection_id>/items/top',
    params: 'limit=100'
    }
    ``` 
    The above queries for _top-level items_ in the collection with ID `<collection_id>` in the library of user with ID `<user_id>`.

- **funcmap** (optional) is an array providing a mapping between item types and the functions that should be used for formatting. The extension provides a default formatting function : `getItemMetadata` ; two other functions, `getItemNotes`, and `getAllData` (metadata + notes) will also be provided soon. Otherwise, the user can define their own functions and call them for the desired item types through **funcmap**. 
    + All formatting functions must take a single argument (the item's array of data, as returned by the Zotero Web API) and return a flat array of string elements, each corresponding to a Roam block to be added. `Important: When creating a custom formatting function in your roam/js block, declare the function with window.funcName = function(item){...} rather than function funcName(item){...} . This will ensure it's available in the window global object -- it will throw an error otherwise.` 
        * Example :
        ```js
        window.customPaperFormat = function(item){
            let metadata = [];
            // Do stuff that pushes string elements to the metadata array
            return metadata;
        }

        funcmap = {
            journalArticle: "customPaperFormat"
        }
        ``` 
    + Nesting isn't supported yet because the roamAlphaAPI requires a parent UID when adding a block.
    + To determine which formatting function to use for an item, the extension will check the following and use the first defined value : `funcmap['itemType']` > `funcmap['DEFAULT']` > `funcmap_default['itemType']` > `funcmap_default['DEFAULT']`. 
    + Example :
    ```js
    funcmap = {
        journalArticle: "getAllData",
        report: "getAllData",
        thesis: "getAllData",
        DEFAULT: "getItemMetadata"
    }
    ``` 
    The above will import _all data_ for journal articles, reports, and theses, and _metadata only_ for all other item types. 
    + The built-in `getItemMetadata()` function produces the following blocks : 
    ```js
    Title:: <title>
    Author(s):: // comma-separated list of each item in <creators> represented as [[<firstName> <lastName>]] ; if <creatorType> is not "author", its value will be appended between parentheses after the name
    Abstract:: <abstract_note> // if Roam Markdown is used, it will be rendered
    Type:: // the value returned by passing <itemType> to either typemap or typemap_default
    Publication:: [[<publicationTitle>]] (if exists) or [[<bookTitle>]] (if exists)
    URL : <url>
    Date Added:: [[<dateAdded> in Roam Daily Notes Page format]]
    Tags:: // comma-separated list of each <tags> represented as #[[<tag>]] so that multi-word is handled
    ```

 - **typemap** (optional) is an array providing a mapping between item types and the tags that should be used to categorize them in Roam. The extension provides a **typemap_default**, which is forked from the [melat0nin/zotero-roam-export](https://github.com/melat0nin/zotero-roam-export) plugin for Zotero. Otherwise, the user can specify custom mappings through **typemap**, for as many or as few item types as desired.
    + To determine which mapping to use for an item, the extension will first check if **typemap** is defined. If it is, it will look for `typemap['itemType']` ; if it's not defined, it will fall back on `typemap_default['itemType']`. If **typemap** isn't defined, `typemap_default['itemType']` will be used,
    + Example :
    ```js
    typemap = {
        bookSection: "Book Chapter",
        journalArticle: "Paper",
        report: "Document"
    }
    ``` 
    The above will format a book section's metadata with `Type:: [[Book Chapter]]`, a journal article with `Type:: [[Paper]]`, a report with `Type:: [[Document]]`, and all other item types according to typemap_default, which is the following :
    ```js
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
    ```

