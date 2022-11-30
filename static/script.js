// Global Variables

RawApiData = {};

// =================================================================================
//                                  Functions

/* tableDisplayArray()
 * reads ApiData (as an array) into a table and then adds the table to the main HTML.
 */
function tableDisplayArray(ApiData, appOrRes, assetTable) {
    ApiData.sort();
    var count = 0;
    var htmlList = "<table><tr>";
    for (let asset of ApiData) {
        if (count == 3) {
            count = 0;
            htmlList += "</tr><tr>";
        }
        linkAsset = asset.replace(/ /g, "%20"); //replace spaces (convert to web link)
        htmlList += "<td onclick=getSpecificApi(\"" + appOrRes + "\",\"" + linkAsset + "\");>" + asset + "</td>";
        count += 1;
    }
    htmlList += "</tr></table>";
    document.getElementById(assetTable).innerHTML = htmlList;
    var count = document.getElementsByTagName("td").length;
    document.getElementById("replaceTotal").innerText = appOrRes + " count: " + count;
    getFilterSelect(assetTable); //find filters for this table.
}

/**tableDisplay()
 * reads Raw ApiData (as a json) into a table and then adds the table to the main HTML.
 * columns depend on headers passed in. Headers are being read from the button in HTML.
 * @param ApiData
 * @param headersToGet String indicates elementID with tableheaders attribute
 * @param assetTable String indicates elementID of table to fill
 */
function tableDisplay(ApiData, headersToGet, assetTable) {
    var sortedRow = [];
    var assetsRows = "";
    var columns = document.getElementById(headersToGet).getAttribute("tableheaders");
    if (columns.includes(",")) { //if it has more than one column, split.
        var columnsList = columns.split(",");
    } else {
        columnsList = [columns] //else use that single one column
    }
    //1.0 Prepare headers
    let assetsHeadersRows = "<table><thead><tr>";
    for (let columns of columnsList) {
        assetsHeadersRows += "<th>" + columns + "</th>";
    }
    assetsHeadersRows += "</tr></thead>";

    //2.0 Get value inside header from json
    assetsRows = "<tbody>";
    for (let itemOfJson of ApiData) { //.1 for each item of the json
        sortedRow = [];
        assetsRows += "<tr>"; //create row
        for (let headerOfJson of Object.keys(itemOfJson)) { //.2 for each header of item
            if (columnsList.includes(headerOfJson)) { //.3 if header is in table
                tablePosition = columnsList.indexOf(headerOfJson);
                // Tags
                if ((headerOfJson == "Tags")) {
                    sortedRow[tablePosition] = "<td class=\"tags\">"
                    for (let key in itemOfJson[headerOfJson]) {
                        sortedRow[tablePosition] += key + ":" + itemOfJson["Tags"][key] + "; ";
                    }
                    sortedRow[tablePosition] += "</td>"
                    // Rest
                } else {
                    sortedRow[tablePosition] = "<td>" + itemOfJson[headerOfJson] + "</td>"; //.4 get value inside json using header
                }
            }
        }
        sortedRow.push("</tr>"); //row finish
        for (let field of sortedRow) {
            assetsRows += field;
        }
    }
    //3. Add the table headers, rows then add into HTML
    assetsRows = assetsHeadersRows + assetsRows + "</tbody></table>";
    document.getElementById(assetTable).innerHTML = assetsRows;

    getFilterSelect(assetTable); //find filters for this table.
}

/**findMaxInTable()
 * Finds max value in a header
 * @param costOrConsumed String either "Cost" or "ConsumedQuantity"
 * @param minMax String apply min or max
 * @param assetTable String indicates elementID of table to find Max
 */
function findMinMaxInTable(minMax, assetTable) {
    document.getElementById("calcSelect").getElementsByTagName("option")[0].selected = true;
    var costOrConsumed = document.getElementById("headerSelect1").value;
    var tempArray = []; // initialised
    var newRows = "";
    var total = 0;
    // 1. Find the Selected header 
    var headers = document.getElementById(assetTable).getElementsByTagName("th");
    for (let i = 0; i < headers.length; i++) { // 1.1 find index of header
        if (headers[i].innerText == costOrConsumed) {
            var headerIndex = i;
        }
    }
    // 2. For each row, grab the value with index of the header. Append to array to find max.
    const rows = document.getElementById(assetTable).getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for (let row of rows) {
        tempArray.push(row.getElementsByTagName("td")[headerIndex].innerText);
    }
    // 3.1 Find max
    if (minMax == "max") {
        var calc = Math.max.apply(null, tempArray);
        // There may be many rows with the same max, so for loop.
        for (let index in tempArray) {
            if (tempArray[index] == calc) {
                newRows += rows[index].outerHTML; // 4.1 append max row to html
            }
        }
        document.getElementById(assetTable).getElementsByTagName("tbody")[0].innerHTML = newRows; // 4.2 replace
        //3.2 Find Min
    } else if (minMax == "min") {
        var calc = Math.min.apply(null, tempArray);
        for (let index in tempArray) {
            if (tempArray[index] == calc) {
                newRows += rows[index].outerHTML; // 4.1
            }
        }
        document.getElementById(assetTable).getElementsByTagName("tbody")[0].innerHTML = newRows; // 4.2
        //3.3 Find Total
    } else if (minMax == "total") {
        total = tempArray.reduce(function (sum, value) { return parseFloat(sum) + parseFloat(value); }, 0); // add all tempArray
        document.getElementById("replaceTotal").innerText = "Sum of " + costOrConsumed + ": " + total;
        //3.4 Find Count
    } else if (minMax == "count") {
        total = tempArray.length; // count elements
        document.getElementById("replaceTotal").innerText = "Rows count: " + total;
    }
}

/**getFilters()
 * Use headers to create filters.
 * @param assetTable table to find headers
 */
function getFilterSelect(assetTable) {
    var form = document.getElementById("filters").getElementsByTagName("form")[0];
    var headers = document.getElementById(assetTable).getElementsByTagName("th");
    var selects = "";
    selects = "<select onchange=getfilterInput();><option value=\"\" selected disabled>...</option>";
    if (headers.length <= 0) {
        selects += "<option value=\"Name\">Name</option>"
    } else {
        for (let header of headers) {
            selects += "<option value=\"" + header.innerText + "\">" + header.innerText + "</option>"
        }
    }
    selects += "</select><br><div class=\"replace\"></div><button type=\"button\" onclick=processFilter(\"mainTable\");>Submit</button>"
    form.innerHTML = selects;
}

/**getFilterInput()
 * Create an input depending on select. (e.g. Date should have "From, To". Name "Contains").
 */
function getfilterInput() {
    var form = document.getElementById("filters").getElementsByTagName("form")[0];
    var selection = "";
    form.getElementsByClassName("replace")[0] = "";
    selection = form.getElementsByTagName("select")[0].value;
    if (selection == "Date") {
        form.getElementsByClassName("replace")[0].innerHTML =
            "<label for=\"from\">From:</label><input type=\"date\" name=\"from\"><label for=\"to\">&emsp;To:</label><input type=\"date\" name=\"to\">";
    } else if ((selection == "Cost") || (selection == "ConsumedQuantity")) {
        form.getElementsByClassName("replace")[0].innerHTML = "<label for=\"numberInput\">Number:</label><input type=\"number\" name=\"numberInput\">";
        form.getElementsByClassName("replace")[0].innerHTML +=
            "<select id=\"op\"><option value=\"higherThan\">Higher than</option><option value=\"lowerThan\">Lower than</option><option value=\"equals\">Equals</option></select>";
    } else {
        form.getElementsByClassName("replace")[0].innerHTML = "<label for=\"textInput\">Contains:</label><input type=\"text\" name=\"textInput\">";
    }
}

/**processFilter()
 * Read filter inputs and apply to table.
 */
function processFilter(assetTable) {
    var form = document.getElementById("filters").getElementsByTagName("form")[0];
    var selection = form.getElementsByTagName("select")[0].value;
    if (selection == "Date") {
        var dateInputFrom = new Date(form.getElementsByTagName("input")[0].value);
        var dateInputTo = new Date(form.getElementsByTagName("input")[1].value);
        var typeInput = "Date";
    } else if ((selection == "Cost") || (selection == "ConsumedQuantity")) {
        var numberInput = form.getElementsByTagName("input")[0].value;
        var opSelect = form.getElementsByTagName("select")[1].value;
        var typeInput = "Number";
    } else if (selection == "Name") { //no headers exist - Applications or Resources
        const rows = document.getElementById(assetTable).getElementsByTagName("tbody")[0].getElementsByTagName("tr");
        var textInput = form.getElementsByTagName("input")[0].value;
        var newBody = "";
        for (let row of rows) {
            if (row.innerHTML.includes(textInput)) {
                newBody += row.outerHTML;
            }
        }
        document.getElementById(assetTable).getElementsByTagName("tbody")[0].innerHTML = newBody;
        return; //end Applications or Resources
    } else {
        var textInput = form.getElementsByTagName("input")[0].value;
        var typeInput = "Text", textInput;
    }

    // 1. Find the Selected header 
    var headers = document.getElementById(assetTable).getElementsByTagName("th");
    for (let i = 0; i < headers.length; i++) { // 1.1 find index of header
        if (headers[i].innerText == selection) {
            var headerIndex = i;
        }
    }
    // 2. For each row, grab the value with index of the header. Append to newBody only if it meets filter.
    var newBody = "";
    var cellData = "";
    const rows = document.getElementById(assetTable).getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for (let row of rows) {
        cellData = row.getElementsByTagName("td")[headerIndex].innerText;
        if ((typeInput == "Text") && (cellData.includes(textInput))) {
            newBody += row.outerHTML;
        } else if (typeInput == "Number") {
            //start num check
            if ((opSelect == "higherThan") && (parseFloat(cellData) > numberInput)) {
                newBody += row.outerHTML;
            } else if ((opSelect == "lowerThan") && (parseFloat(cellData) < numberInput)) {
                newBody += row.outerHTML;
            } else if ((opSelect == "equals") && (parseFloat(cellData) == numberInput)) {
                newBody += row.outerHTML;
            } //end
        } else if (typeInput == "Date") {
            let parseDate = cellData.split("/");
            let cellDate = new Date(parseDate[1] + "-" + parseDate[0] + "-" + parseDate[2]); //dates in JS use american 12-30-2020
            if ((cellDate >= dateInputFrom) && (cellDate <= dateInputTo)) {
                newBody += row.outerHTML;
            }
        }
    }
    document.getElementById(assetTable).getElementsByTagName("tbody")[0].innerHTML = newBody;
}



/**getApi()
 * Get the Api info from url
 * @param url
 * @return ApiData
 */
async function getApi(url) {
    const response = await fetch(url);
    var ApiData = await response.json();
    return ApiData
}

/**getSpecificApi()
 * Calls using application or resources and the name of the asset.
 * @param appOrRes "application" or "resources"
 * @param asset
 */
async function getSpecificApi(appOrRes, asset) {
    ApiData = getApi("https://engineering-task.elancoapps.com/api/" + appOrRes + "/" + asset);
    tableDisplay(await ApiData, "buttonAll", "mainTable");
}

// =================================================================================
//                                  Elements & Events

// Buttons
document.getElementById("buttonApplications").addEventListener("click", async function () {
    ApiData = getApi('https://engineering-task.elancoapps.com/api/applications');
    tableDisplayArray(await ApiData, "applications", "mainTable");
});
document.getElementById("buttonResources").addEventListener("click", async function () {
    ApiData = getApi('https://engineering-task.elancoapps.com/api/resources');
    tableDisplayArray(await ApiData, "resources", "mainTable");
});
document.getElementById("buttonAll").addEventListener("click", function () {
    tableDisplay(RawApiData, "buttonAll", "mainTable");
});

document.getElementById("calcSelect").addEventListener("change", function (event) { findMinMaxInTable(event.target.value, "mainTable") });

// Run anything at the start
document.addEventListener("DOMContentLoaded", async function () {
    RawApiData = await getApi('https://engineering-task.elancoapps.com/api/raw');
});
