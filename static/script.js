RawApiData = {};
/**{
    "ConsumedQuantity": "0.02595301",
    "Cost": "0.052413816",
    "Date": "19/11/2020",
    "InstanceId": "LA-4b8d7dd5-480d-450e-a28e-35225f625f93",
    "MeterCategory": "Log Analytics",
    "ResourceGroup": "Officer",
    "ResourceLocation": "EastUS",
    "Tags": {
      "app-name": "Officer",
      "environment": "Development",
      "business-unit": "Digital"
    },
    "UnitOfMeasure": "1 GB",
    "Location": "US East",
    "ServiceName": "Log Analytics"
  } */

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
            htmlList += "<tr>";
        }
        linkAsset = asset.replace(/ /g, "%20"); //replace spaces (convert to web link)
        htmlList += "<td onclick=getSpecificApi(\"" + appOrRes + "\",\"" + linkAsset + "\");>" + asset + "</td>";
        count += 1;
    }
    htmlList += "</tr></table>";
    document.getElementById(assetTable).innerHTML = htmlList;
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
                    for (let key in itemOfJson[headerOfJson]){
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
}

/**findMaxInTable()
 * Finds max value in a header
 * @param costOrConsumed String either "Cost" or "ConsumedQuantity"
 * @param minMax String apply min or max
 * @param assetTable String indicates elementID of table to find Max
 */
function findMinMaxInTable(minMax, assetTable) {
    var costOrConsumed = document.getElementById("headerSelect1").value;
    var tempArray = [];
    var newRows = "";
    var headers = document.getElementById(assetTable).getElementsByTagName("th");
    for (let i = 0; i < headers.length; i++) { // 1. find index of header
        if (headers[i].innerText == costOrConsumed) {
            var headerIndex = i;
        }
    }
    // 2. For each row, grab the value with index of the header. Append to array to find max.
    const rows = document.getElementById(assetTable).getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for (let row of rows) {
        tempArray.push(row.getElementsByTagName("td")[headerIndex].innerText);
    }
    // 3. Find max
    if (minMax == "max") {
        var calc = Math.max.apply(null, tempArray);
    } else {
        var calc = Math.min.apply(null, tempArray);
    }
    // There may be many rows with the same max, so for loop.
    //document.getElementById("mainTable").getElementsByTagName("tbody")[0].innerHTML = ""; //clear the table
    for (let index in tempArray) {
        if (tempArray[index] == calc) {
            newRows += rows[index].outerHTML; // 4. append max row to html
        }
    }
    document.getElementById("mainTable").getElementsByTagName("tbody")[0].innerHTML = newRows;
    document.getElementById("calcSelect").getElementsByTagName("option")[0].selected = true;
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
document.getElementById("buttonAll").addEventListener("click", function () { tableDisplay(RawApiData, "buttonAll", "mainTable") });

document.getElementById("calcSelect").addEventListener("change", function (event) { findMinMaxInTable(event.target.value, "mainTable") });

// Run anything at the start
document.addEventListener("DOMContentLoaded", async function () {
    RawApiData = await getApi('https://engineering-task.elancoapps.com/api/raw');
});
