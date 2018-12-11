/**************************************************************************
 * File: no_dupes.js 
 * Author: Devin Hero
 * Created: Dec 10 2018
 * 
 * De-duplicates the contents of a json file.
 */

let fs = require('fs');
const jsonFileContents = require('./leads');
// const jsonFileContents = require('./leads_modified');
let baseContents = jsonFileContents.leads.slice(0);

//.sort() array method helpers
let SortById = (a, b) => ('' + a._id).localeCompare(b._id);
let SortByTimestamp = (a, b) => ('' + a.entryDate).localeCompare(b.entryDate);
let SortByEmail = (a, b) => ('' + a.email).localeCompare(b.email);


//Object helper functions
let DoesObjectShareKeyValuePairs = (baseObj, compareObj) =>{
  for(let key in baseObj){
    if (baseObj[key] !== compareObj[key])
      return false;
  }
  return true;
}
let isEmpty = obj => {
  for(let key in obj) {
    if(obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

//Back-to-front searcher for original array
let FindLastElementByParams = (array, param1, val1, param2, val2) =>{
  for(let i = array.length-1; 0 <= i; i--){
    if(array[i][param1] === val1 && array[i][param2] === val2)
      return array[i];
  }
}

//Log an item
let logItem = (item, tabCount = 0) =>{
  let tabs = "  ";
  for(let i = 0; i < tabCount; i++)
    tabs += "  ";
  console.log(tabs, item._id.slice(0,5), item.entryDate, item.email, item.firstName, item.lastName, item.address);
}

/* FilterUniqueParamByLatestTime()
      -Removes all but the most recently created item, or if there are duplicates of
       the latest timestamp, removes all but the last item found in the original data.
       Directly removes one element from arrSlice and pushes it to resultArray.
      -Inputs:
        arrSlice    - Array of items to filter.
                      ITEMS MUST HAVE THE SAME VALUE FOR THE SPECIFIED PARAMETER.
        param       - The parameter being de-duplicated.
      -Outputs:
        Console     - Declares which items are to be discarded, if any
        return      - Returns the item to keep from the slice
*/
let FilterUniqueParamByLatestTime = (arrSlice, param ) =>{
  arrSlice.sort(SortByTimestamp);
  let savedItem = {};
  
  if(arrSlice.length === 1){
    //No duplicates
    savedItem = arrSlice.pop();
  }else if(arrSlice[arrSlice.length-2].entryDate === arrSlice[arrSlice.length-1].entryDate){
    //Duplicate latest entryDate, find last matching item in original data
    savedItem = FindLastElementByParams(baseContents,
      "entryDate", arrSlice[arrSlice.length-1].entryDate, param, arrSlice[arrSlice.length-1][param]);
    arrSlice = arrSlice.filter(item => !DoesObjectShareKeyValuePairs(savedItem, item));
  }else{
    //Latest timestamp found, return it
    savedItem = arrSlice.pop();
  }

  if(arrSlice.length > 0){
    console.log("DELETING ITEMS: ");
    arrSlice.forEach(item => logItem(item, 1));
  }

  return savedItem;
}

/* FilterArrayByParam
      -Removes duplicate items specified by the input parameter.
      -Inputs
        sortedArr   - The full array to de-duplicate.
                      THE ARRAY MUST BE PRE-SORTED BY THE SPECIFIED PARAMETER
        param       - The parameter being de-duplicated.
      Outputs
        results     - The filtered contents of the array.
*/
let FilterArrayByParam = (sortedArr, param) =>{
  let startSlice = 0;
  results = []
  for(let i = 1; i < sortedArr.length; i++){
    let currentId = sortedArr[i][param];
    let prevId = sortedArr[i-1][param];
    if(currentId !== prevId ){
      results.push( FilterUniqueParamByLatestTime( sortedArr.slice(startSlice,i), param, results ));
      startSlice = i;
    }
    if(i === sortedArr.length-1){
      results.push( FilterUniqueParamByLatestTime( sortedArr.slice(startSlice,i+1), param, results ));
    }
  }
  return results;
}


///////////////   BEGIN   ///////////////


//Log original content
console.log('ORIGINAL CONTENT:');
baseContents.forEach(item => logItem(item));
console.log('Original content length: ', baseContents.length);

console.log('\nFILTERING...\n');

//Filter by Email
let emailSortedContents = baseContents.slice(0).sort(SortByEmail);
let emailFilteredContents = FilterArrayByParam(emailSortedContents, "email");

// console.log('\nEMAIL FILTERED CONTENT:')
// emailFilteredContents.forEach(item => logItem(item))
// console.log('Email Filtered content length: ', emailFilteredContents.length);

//Filter by ID
let idSortedContents = emailFilteredContents.slice(0).sort(SortById);
let idFilteredContents = FilterArrayByParam(idSortedContents, "_id");

// console.log('\nID FILTERED CONTENT:')
// idFilteredContents.forEach(item => logItem(item))
// console.log('Id Filtered content length: ', idFilteredContents.length);

//Log results
console.log('\nFILTERED CONTENT:');
idFilteredContents.forEach(item => logItem(item));
console.log('\nFiltered content length: ', idFilteredContents.length);
console.log('Items deleted: ', baseContents.length - idFilteredContents.length);

//Conform to original format and save to output file
let output = {
  leads: idFilteredContents
}
var jsonOutput = JSON.stringify(output);
let callback = function(){};
fs.writeFile('leads_deduped.json', jsonOutput, 'utf8', callback);
console.log('Leads results saved to leads_deduped.json');