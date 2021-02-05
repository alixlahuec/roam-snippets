
 > :tada: Feb 3rd, 2021 : Nesting is now supported. See [Using custom formatting functions](#using-custom-formatting-functions) for details

## Zotero Roam Data Importer <!-- omit in toc -->

- [Basic setup](#basic-setup)
- [User options](#user-options)
  - [USER_REQUEST (mandatory)](#user_request-mandatory)
  - [funcmap (optional)](#funcmap-optional)
    - [Using custom formatting functions](#using-custom-formatting-functions)
      - [How nesting works under the hood](#how-nesting-works-under-the-hood)
  - [typemap (optional)](#typemap-optional)

Here's a basic run-down of the extension :

1. Makes a request to the Zotero Web API, based on user-specified request settings. If a dataset is returned, it's stored in memory as an array of items.
2. The dataset is checked for pinned citekeys. For each item, if it has a pinned citekey, it becomes the item's key in the dataset instead of the Zotero item key.
3. While the extension is active, all page references with a `data-link-title` starting with `@` are checked against the dataset. If a match is found, right-clicking on the reference will bring up an option to import the item's data into Roam. Options are available for the user to specify formatting functions.
4. When the extension is turned off, the dataset is removed from memory and the status of reference citekeys is reset. 

## Basic setup

To get started, add the following in a {{[[roam/js]]}} block :

```js
USER_REQUEST = {
    apikey: 'your API key', // Get this from zotero.org/settings/keys ->  "Create new private key"
    dataURI: 'the data URI to use for the request', // Construct this using the Zotero API documentation : https://www.zotero.org/support/dev/web_api/v3/basics#user_and_group_library_urls
    params: 'the parameters to use for the request' // Construct this using the Zotero API documentation : https://www.zotero.org/support/dev/web_api/v3/basics#read_requests
    // If params is left blank, the request will use default settings (i.e, return *all data* in JSON format)
    // Any type of API request can be specified in USER_REQUEST, but the extension is currently specifically built to handle requests for items & their (pinned) citekeys
    // If other types of API requests are made (e.g, looking for tags), the call will still work but beyond that use at your own risk
}

var s = document.createElement("script");
s.src = "https://greenmeen.github.io/roam-snippets/roam-import-paper-data/roam-import-paper-data.js";
s.id = "roam-import-paper-data";
s.type = "text/javascript";
document.getElementsByTagName("body")[0].appendChild(s);
```

Note : to construct the data URI, you'll need to obtain your user ID (or the group ID if you want to get results from a group library). 
**User IDs are not the same as usernames** ; each user has a unique user ID to be used for authentication in API requests, so that only you can make a request for your private data. It's available on the [Feeds/API page in your web settings](www.zotero.org/settings/keys).


## User options

There are 3 user-defined variables that can be set ; they should be declared globally, otherwise they won't be available to the extension.

### USER_REQUEST (mandatory)
   + **Value**. An array containing 3 named values : `apikey` (obtained from Zotero), `dataURI` (the set of items to query ; can be a library, a collection, etc.), and `params` (string of request parameters ; the initial `?` should be omitted). For shared graphs, use at your own risk ; your API key will be openly accessible. 
   + _Example_ :    
   ```js
   USER_REQUEST = {
   apikey: 'XXXXXXXXXXXXXXXXXXXXXXXX',
   dataURI: 'users/<user_id>/collections/<collection_id>/items/top',
   params: 'limit=100'
   }
   ``` 
   The above queries for _top-level items_ in the collection with ID `<collection_id>` in the library of user with ID `<user_id>`. It also specifies that the maximum number of results should be returned (`limit=100`).

### funcmap (optional) 
   + **Value**. An array providing a mapping between item types and the functions that should be used for formatting them. 
        * If `funcmap` is not provided, the built-in `funcmap_default` will be used :
        ```js
        funcmap_default = {
             DEFAULT: "getItemMetadata"
        }
        ``` 
        * It calls the built-in formatting function `getItemMetadata()` for all item types. Calling this function will produce the following blocks :
        ```
        Title:: <title>
        Author(s):: // comma-separated list of each item in <creators> represented as [[<firstName> <lastName>]] ; if <creatorType> is not "author", its value will be appended between parentheses after the name
        Abstract:: <abstract_note> // if Roam Markdown is used, it will be rendered
        Type:: // the value returned by passing <itemType> to either typemap or typemap_default
        Publication:: [[<publicationTitle>]] (if exists) or [[<bookTitle>]] (if exists)
        URL : <url>
        Date Added:: [[<dateAdded> in Roam Daily Notes Page format]]
        Tags:: // comma-separated list of each <tags> represented as #[[<tag>]] so that multi-word is handled
        ``` 

#### Using custom formatting functions 

By defining `funcmap`, the user can write their own formatting functions and call them for the desired item types. `getItemMetadata` is available to include in **funcmap** if wanted. 
* **Search path**. To determine which formatting function to use for an item, the extension will check the following and use the first defined value : `funcmap['itemType']` > `funcmap['DEFAULT']` > `funcmap_default['itemType']` > `funcmap_default['DEFAULT']`. 
* **Requirements for custom functions** : 
    1. Custom functions **must** be defined by using the syntax `window.myFuncName = function(item){...}` rather than `function myFuncName(item){...}`, otherwise an error will be thrown. This is needed to make the function globally available. (Note: If anyone knows where functions defined in roam/js blocks are stored otherwise, please let me know!) 
        + _Example_ :
        ```js
        window.customPaperFormat = function(item){                
            // Do stuff that formats item data into blocks for import to Roam
        }                
        ```
    2. Function names must be given as strings in `funcmap`. 
        + _Example_ :
        ```js
        funcmap = {
            journalArticle: "customPaperFormat",
            conferencePaper: "customPaperFormat"
        }
        ```
        The above will call `customPaperFormat()` for journal articles and conference papers, but for other item types the extension will fall back on *funcmap_default* and call the built-in `getItemMetadata()`. 
    3. All formatting functions must be written as follows :
        + The function must **take a single argument** : the item's array of data, as returned by the Zotero Web API. [See here](https://gist.github.com/dstillman/f1030b9609aadc51ddec) for an official gist from the Zotero API docs, showing the data returned for a single item.
        + The function must **return a single data array** : each element of the array should correspond to a top-level Roam block to be added to the item's page. 
            * Array elements can be of two types : _String_ or _Object_.
            * String elements will be added as top-level, childless blocks.
            * Object elements support nested blocks. Be careful when creating them in your formatting functions : 
                - All Object blocks **must** have a `string` property, which is the text value for the block. This is true regardless of the item being a level-1 child, level-2 child (grandchild), etc. Otherwise, an error will be thrown. 
                - An Object block can also have a `children` property. This should be an array of Object blocks. Items are treated recursively, so multi-level nesting is possible ; just make sure that every block in the path has a `string` property, and be careful that elements are the right type (`string` should be a String ; `children` should be an Array where each element is an Object with at least a `string` property ; and so on for every level). 
                - _Examples, with added spaces to show the indentations produced in Roam_ :
                    + This is a properly formatted output, with one level of nesting.
                    ```js
                    simpleNestedArray = [{string: 'Publication information',
                                          children: [{string: 'Journal:: [[Some journal]]'},
                                                     {string: 'Date:: YYYY'},
                                                     {string: 'DOI : 10.9999/2222222222222222'},
                                                     {string: 'URL : https://someurl.com/path/to/item'}]},
                                         {string: 'Author(s):: [[First Author]], [[Second Author]], [[Third Author]]'},
                                         {string: 'Abstract:: Lorem ipsum',
                                         {string: 'Tags:: #[[tag1]], #[[tag2]], #[[multi-word tag]]'}}]
                    ```
                    + This is a highly indented output, showing multi-level nesting.
                    ```js
                    highlyIndentedArray = [{string: 'Top block 1', 
                                            children: [{string: 'Child block 1'}, 
                                                       {string: 'Child block 2', 
                                                        children: [{string: 'Grandchild block 1'}, 
                                                                   {string: 'Grandchild block 2'}]}]}, 
                                           {string: 'Top block 2'}, 
                                           {string: 'Top block 3', 
                                            children: [{string: 'Another child block 1'}, 
                                                       {string: 'Another child block 2'}, 
                                                       {string: 'Another child block 3', 
                                                        children: [{string: 'Another grandchildren block 1',
                                                                    children: [{string: 'A grand-grandchild'}]}]}]}]
                            ```
##### How nesting works under the hood 
All blocks created by the extension are created using the `roamAlphaAPI.createBlock` function. In order to add both a parent block and its child block, there is a small pause to wait for the parent block to be added to the Roam graph and ask Roam for its UID. Once the UID is returned, block creation resumes, but not before - so the more nested items there are, the more time it will take. 
+ The parent-block's UID is obtained by querying for the top-level child of the grandparent (follow me here), and checkings its contents against the contents that we pushed as the contents of the parent block. Once there is a match, the UID is returned and all children are processed. 
    + For example, let's say the following data array has been returned by the formatting function, to be added to the Roam page :
    ```js
    itemData = [{string: 'Top block 1',
                 children: [{string: 'Child block 1'},
                            {string: 'Child block 2'},
                            {string: 'Child block 3'}]},
                "Top block 2",
                "Top block 3"]
    ```
    This will produce the following (it starts with `Top block 3` being added at the top of the page, then `Top block 2` being added at the top of the page, then `Top block 1` being added at the top of the page) :
    ```md
     - Top block 1 
     - Top block 2
     - Top block 3
    ``` 
    But now `Top block 1` has a few children that should be added under it. In order to do that, the UID of the `Top block 1` block has to be retrieved. 
    The extension does this by running a Datalog query : 
    ```js
    window.roamAlphaAPI.q('[:find ?bUID ?bText :in $ ?pUID :where[?b :block/uid ?bUID][?b :block/string ?bText][?b :block/order 0][?p :block/children ?b][?p :block/uid ?pUID]]', parent_uid)
    ```
    Here, `parent_uid` would be the page UID because `Top block 1` is a top-level block. For more deeply nested blocks, it would be the block UID of the parent block. 
    The query returns an Array, whose first element contains `bUID` (the UID of the top block) and `bText` (the text contents of the top block). Because this search occurs in the context where a grandchild (or more distant element) needs to be added, after its parent has been successfully added, there should never be a case where there is no result returned. 
    The value of `bText` is matched against `"Top block 1"` ; if it's a match, the children can be added under it :
    ```md
     - Top block 1
        + Child block 1
        + Child block 2
        + Child block 3
     - Top block 2
     - Top block 3
    ```

### typemap (optional) 
   + **Value**. An array providing a mapping between item types and the tags that should be used to categorize them in Roam. 
        * If `typemap` is not provided, the built-in `typemap_default` will be used (forked from the [melat0nin/zotero-roam-export](https://github.com/melat0nin/zotero-roam-export) plugin for Zotero) : 
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
   + By defining `typemap`, the user can specify custom mappings for as many or as few item types as desired. 
        * **Search path**. To determine which mapping to use for an item, the extension will by default use `typemap_default['itemType']` unless `typemap['itemType']` exists.
        * _Example_ :
        ```js
        typemap = {
            bookSection: "Book Chapter",
            journalArticle: "Paper",
            report: "Document"
        }
        ``` 
        The above will format a book section's metadata with `Type:: [[Book Chapter]]`, a journal article with `Type:: [[Paper]]`, a report with `Type:: [[Document]]`, and all other item types according to the mapping from`typemap_default`.
