/*REFERENCE:
Table Status 
0 - Free
1 - Punched Order
2 - Billed
5 - Reserved Table
*/


/*Open/Close Options*/
function openFreeSeatOptions(tableID){
	document.getElementById("freeSeatOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader">Table <b>'+tableID+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButton" onclick="punchNewOrder(\''+tableID+'\')">Punch New Order</button>'+ 
                  '<button class="btn btn-success tableOptionsButton" onclick="addToReserveList(\''+tableID+'\')">Reserve this Table</button>'+  
                  '<button class="btn btn-default tableOptionsButton" onclick="hideFreeSeatOptions()">Close</button>';
	document.getElementById("freeSeatOptionsModal").style.display ='block';
}

function hideFreeSeatOptions(){
	document.getElementById("freeSeatOptionsModal").style.display ='none';
}



function openReservedSeatOptions(tableID){
	document.getElementById("reservedSeatOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader">Reserved Table <b>'+tableID+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButton" onclick="punchNewOrder(\''+tableID+'\')">Punch New Order</button>'+ 
                  '<button class="btn btn-primary tableOptionsButton" onclick="removeFromReserveList(\''+tableID+'\')">Free this Table</button>'+  
                  '<button class="btn btn-default tableOptionsButton" onclick="hideReservedSeatOptions()">Close</button>';
	document.getElementById("reservedSeatOptionsModal").style.display ='block';
}

function hideReservedSeatOptions(){
	document.getElementById("reservedSeatOptionsModal").style.display ='none';
}




function openOccuppiedSeatOptions(tableInfo){

	var tableData = JSON.parse(decodeURI(tableInfo));
	console.log(tableData)

	if(tableData.status == 1){ /* Not Billed */
		document.getElementById("occuppiedSeatOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader">Table <b>'+tableData.table+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButton" onclick="editOrderKOT(\''+tableData.KOT+'\')">Edit KOT #'+tableData.KOT+'</button> '+
                  '<button class="btn btn-success tableOptionsButton" onclick="generateBillFromKOT(\''+tableData.KOT+'\')">Generate Bill</button> '+ 
                  '<button class="btn btn-default tableOptionsButton" onclick="hideOccuppiedSeatOptions()">Close</button> ';
	}
	else if(tableData.status == 2){ /* Billed */
		document.getElementById("occuppiedSeatOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader">Table <b>'+tableData.table+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButton" onclick="settlePrintedBill(\''+tableData.KOT+'\')">Settle Bill</button> '+ 
                  '<button class="btn btn-default tableOptionsButton" onclick="hideOccuppiedSeatOptions()">Close</button> ';
	}

	document.getElementById("occuppiedSeatOptionsModal").style.display ='block';
}

function hideOccuppiedSeatOptions(){
	document.getElementById("occuppiedSeatOptionsModal").style.display ='none';
}

/*seat options: actions*/
function editOrderKOT(kotID){

}

function generateBillFromKOT(kotID){
//ask to confirm (display bill preview)
//ask for applying any discounts
//Merge, split bill options
//check for all linked tables (Order clubbed on T1, T2 and T3)

}

function settlePrintedBill(kotID){
	//ask for payment mode, reference etc.
	//should release the table finally
}

function punchNewOrder(tableID){

}

function addToReserveList(tableID){
		if(fs.existsSync('./data/static/tablemapping.json')) {
	      fs.readFile('./data/static/tablemapping.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to Reserve. Please contact Accelerate Support.', '#e74c3c');
	    } else {
	    	if(data == ''){ data = '[]'; }
	          var tableMapping = JSON.parse(data); 

	          var isUpdated = false;

	          for(var i=0; i<tableMapping.length; i++){
	          	if(tableMapping[i].table == tableID){

	          		if(tableMapping[i].status != 0){
	          			return '';
	          		}

	          		tableMapping[i].assigned = "";
	          		tableMapping[i].KOT = "";
	          		tableMapping[i].status = 5;
	          		tableMapping[i].lastUpdate = "";

	          		isUpdated = true;

	          		break;
	          	}
	          }

	          if(!isUpdated){
	          	tableMapping.push({ "table": tableID, "assigned": "", "KOT": "", "status": 5, "lastUpdate": "12:00 pm" });
		      }

		       var newjson = JSON.stringify(tableMapping);
		       fs.writeFile('./data/static/tablemapping.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to Reserve. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	showToast('Table '+tableID+' has been marked as Reserved', '#27ae60');
		           	hideFreeSeatOptions();
		           	preloadTableStatus();

		        	}
		       }); 

		}
		});
	    } else {
	      showToast('System Error: Unable to Reserve. Please contact Accelerate Support.', '#e74c3c');
	    }
}

function removeFromReserveList(tableID){
		if(fs.existsSync('./data/static/tablemapping.json')) {
	      fs.readFile('./data/static/tablemapping.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to free the Table. Please contact Accelerate Support.', '#e74c3c');
	    } else {
	    	if(data == ''){ data = '[]'; }
	          var tableMapping = JSON.parse(data); 

	          for(var i=0; i<tableMapping.length; i++){
	          	if(tableMapping[i].table == tableID){

	          		if(tableMapping[i].status != 5){
	          			return '';
	          		}

	          		tableMapping.splice(i,1);

	          		break;
	          	}
	          }

		       var newjson = JSON.stringify(tableMapping);
		       fs.writeFile('./data/static/tablemapping.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to free the Table. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	showToast('Table '+tableID+' has been marked as Free', '#27ae60');
		           	hideReservedSeatOptions();
		           	preloadTableStatus();
		        	}
		       }); 

		}
		});
	    } else {
	      showToast('System Error: Unable to free the Table. Please contact Accelerate Support.', '#e74c3c');
	    }
}


function getTableStatus(tableID){
	/*returns table occupancy data*/
	if(!window.localStorage.tableMappingData){
		return '';
	}

	var tableMapData = JSON.parse(window.localStorage.tableMappingData);

	var n = 0;
	while(tableMapData[n]){
		if(tableMapData[n].table == tableID){
			return tableMapData[n];
		}
		n++;
	}

	return '';
}

function preloadTableStatus(){
		    if(fs.existsSync('./data/static/tablemapping.json')) {
		        fs.readFile('./data/static/tablemapping.json', 'utf8', function readFileCallback(err, data){
		      if (err){
		          showToast('System Error: Unable to read Table Mapping data. Please contact Accelerate Support.', '#e74c3c');
		      } else {

		          if(data == ''){ data = '[]'; }

		              var tableMapping = JSON.parse(data);
		              tableMapping.sort(); //alphabetical sorting 

		              window.localStorage.tableMappingData = JSON.stringify(tableMapping);

		              renderCurrentPlan();
		    }
		    });
		      } else {
		        showToast('System Error: Unable to read Table Mapping. Please contact Accelerate Support.', '#e74c3c');
		      } 	
}

function getTimeLapsed(time){
	return '5m';
}


function renderCurrentPlan(){

    if(fs.existsSync('./data/static/tables.json')) {
        fs.readFile('./data/static/tables.json', 'utf8', function readFileCallback(err, data){
      if (err){
          showToast('System Error: Unable to read Tables data. Please contact Accelerate Support.', '#e74c3c');
      } else {

          if(data == ''){ data = '[]'; }

              var tables = JSON.parse(data);
              tables.sort(); //alphabetical sorting 


		    if(fs.existsSync('./data/static/tablesections.json')) {
		        fs.readFile('./data/static/tablesections.json', 'utf8', function readFileCallback(err, data){
		      if (err){
		          showToast('System Error: Unable to read Tables data. Please contact Accelerate Support.', '#e74c3c');
		      } else {

		          if(data == ''){ data = '[]'; }

		              var tableSections = JSON.parse(data);
		              tableSections.sort(); //alphabetical sorting 


		              var renderSectionArea = '';

		              var n = 0;
		              while(tableSections[n]){
		        
		              	var renderTableArea = ''
		              	for(var i = 0; i<tables.length; i++){
		              		if(tables[i].type == tableSections[n]){

		              			var tableOccupancyData = getTableStatus(tables[i].name);

		              			if(tableOccupancyData){ /*Occuppied*/
									if(tableOccupancyData.status == 1){
		              				renderTableArea = renderTableArea + '<tag onclick="openOccuppiedSeatOptions(\''+encodeURI(JSON.stringify(tableOccupancyData))+'\')" class="tableTileRed">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+tableOccupancyData.assigned+'</tag>'+
															            '<tag class="tableInfo">Order Punched '+getTimeLapsed(tableOccupancyData.lastUpdate)+' ago</tag>'+
															        	'</tag>';	
									}
									else if(tableOccupancyData.status == 2){
		              				renderTableArea = renderTableArea + '<tag onclick="openOccuppiedSeatOptions(\''+encodeURI(JSON.stringify(tableOccupancyData))+'\')" class="tableTileYellow">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+tableOccupancyData.assigned+'</tag>'+
															            '<tag class="tableInfo">Billed '+getTimeLapsed(tableOccupancyData.lastUpdate)+' ago</tag>'+
															        	'</tag>';	
									}
									else if(tableOccupancyData.status == 5){
		              				renderTableArea = renderTableArea + '<tag onclick="openReservedSeatOptions(\''+tables[i].name+'\')" class="tableReserved">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+tables[i].capacity+' Seater</tag>'+
															            '<tag class="tableInfo">Reserved</tag>'+
															        	'</tag>';	
									}									
									else{
		              				renderTableArea = renderTableArea + '<tag onclick="openOccuppiedSeatOptions(\''+encodeURI(JSON.stringify(tableOccupancyData))+'\')" class="tableTileRed">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+tableOccupancyData.assigned+'</tag>'+
															            '<tag class="tableInfo">Last updated '+getTimeLapsed(tableOccupancyData.lastUpdate)+' ago</tag>'+
															        	'</tag>';											
									}


		              			}
		              			else{

		              				renderTableArea = renderTableArea + '<tag onclick="openFreeSeatOptions(\''+tables[i].name+'\')" class="tableTileGreen">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+tables[i].capacity+' Seater</tag>'+
															            '<tag class="tableInfo">Free</tag>'+
															        	'</tag>';		              				
		              			}

		              		}
		              	}

		              	renderSectionArea = renderSectionArea + '<div class="row" style="margin-top: 25px">'+
												   '<h1 class="seatingPlanHead">'+tableSections[n]+'</h1>'+
												   '<div class="col-lg-12" style="text-align: center;">'+renderTableArea+
												    '</div>'+
												'</div>'

		              	n++;
		              }
		              document.getElementById("fullSeatingRenderArea").innerHTML = renderSectionArea;
		    }
		    });
		      } else {
		        showToast('System Error: Unable to read Tables data. Please contact Accelerate Support.', '#e74c3c');
		      } 

    }
    });
      } else {
        showToast('System Error: Unable to read Tables data. Please contact Accelerate Support.', '#e74c3c');
      } 

}