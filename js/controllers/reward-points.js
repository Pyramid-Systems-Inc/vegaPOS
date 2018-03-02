
function findUser(user){

	user = document.getElementById("rewardsSearchInput").value;


	var data = {
		"token": "sHtArttc2ht+tMf9baAeQ9ukHnXtlsHfexmCWx5sJOhfj2K2BuoKt3w1z6ZOSyjiAnvlKgAiBxp9djP5lmlIXlmA2VrSaLsAuEeKLLhVhJk=",
		"id": 0,
		"key": user
	}

	$.ajax({
		type: 'POST',
		url: 'https://www.zaitoon.online/services/possearchrewards.php',
		data: JSON.stringify(data),
		contentType: "application/json",
		dataType: 'json',
		success: function(data) {
			if(data.status)
				renderHistory(data, user)
			else
				alert('Not Found')
		    console.log(data)
		}
	});	
}

function loadMoreOrders(user, nextID){
	console.log('show '+nextID+' for '+user)
	
	var data = {
		"token": "sHtArttc2ht+tMf9baAeQ9ukHnXtlsHfexmCWx5sJOhfj2K2BuoKt3w1z6ZOSyjiAnvlKgAiBxp9djP5lmlIXlmA2VrSaLsAuEeKLLhVhJk=",
		"id": nextID*5,
		"key": user
	}

	console.log(data)
	$.ajax({
		type: 'POST',
		url: 'https://www.zaitoon.online/services/possearchrewards.php',
		data: JSON.stringify(data),
		contentType: "application/json",
		dataType: 'json',
		success: function(data) {
			if(data.status){
				console.log(data)
				appendToHistory(data, nextID, user)

			}
			else
				alert('Not Found')
		    
		}
	});		
}


function renderHistory(data, userID){

document.getElementById("renderAreaUserInfo").innerHTML = '<div class="box box-primary">'+
                    '<div class="box-body" style="padding: 30px 10px 30px 10px; text-align: center">'+
                        '<img src="data/photos/users/default_customer.png">'+
                        '<h1 style="font-size: 24px; font-weight: 400">'+data.response.name+'</h1>'+
                        '<p style="margin: 0; color: #3498db">'+data.response.mobile+'</p>'+
                        '<p style="margin: 0; color: #7f8c8d">'+data.response.email+'</p>'+   
                    '</div>'+
                '</div>'+
                '<button class="btn btn-success rewardsButton">Redeem Points</button>'+
                '<p style="color: #7f8c8d; margin-top: 5px; text-align: center"><i class="fa fa-warning"></i> Requires an active Internet Connection</p>'



var tableList = '';
var i = 0;
while(data.list[i]){

	var itemsList = ''
	var n = 0;
	while(data.list[i].cart.items[n]){
		itemsList = itemsList + data.list[i].cart.items[n].itemName + '('+data.list[i].cart.items[n].qty+'). ';
		n++;
	}

	tableList = tableList +     '<tr>'+
                                    '<td>'+(i+1)+'</td>'+
                                    '<td>'+data.list[i].date+'</td>'+
                                    '<td>'+itemsList+'</td>'+
                                    '<td><i class="fa fa-inr"></i> '+data.list[i].cart.cartTotal+'</td>'+
                                    '<td>'+data.list[i].cart.cartPoints+'</td>'+
                                '</tr>';
    i++;                            
}


document.getElementById("renderAreaUserStats").innerHTML = '<div>'+
				'<div class="row">'+
					'<div class="col-xs-4">'+
                        '<div class="box box-primary">'+
                            '<div class="box-body">'+
                                '<div class="rewardsCount">'+data.count+'</div>'+
                                '<div class="rewardsName">VISITS</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="col-xs-4">'+
                        '<div class="box box-primary">'+
                            '<div class="box-body">'+
                                '<div class="rewardsCount">'+data.volume+'<i class="fa fa-inr rewardsRs"></i></div>'+
                                '<div class="rewardsName">TOTAL SPENT</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="col-xs-4">'+
                        '<div class="box box-primary">'+
                            '<div class="box-body">'+
                                '<div class="rewardsCount">'+data.points+'</div>'+
                                '<div class="rewardsName">ACTIVE POINTS</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+ 
                '</div>'+ 
                '<div class="box box-primary">'+
                    '<div class="box-body">'+
                        '<div class="box-header" style="padding: 10px 0px">'+
                           '<h3 class="box-title" style="padding: 5px 0px; font-size: 21px;">Recent Visits</h3>'+
                        '</div>'+
                        '<div class="table-responsive">'+
                            '<table class="table" style="margin: 0">'+
                            	'<col width="5%"><col width="15%"><col width="50%"><col width="15%"><col width="15%">'+
                                '<thead style="background: #f4f4f4;">'+
                                    '<tr>'+
                                        '<th style="text-align: left">#</th>'+
                                        '<th style="text-align: left">Date</th>'+
                                        '<th style="text-align: left">Summary</th>'+
                                        '<th style="text-align: left">Amount</th>'+
                                        '<th style="text-align: left">Points</th>'+
                                    '</tr>'+
                                '</thead>'+
                            '</table>'+
                            '<div style="height: 40vh !important; overflow: scroll">'+
                            '<table class="table" style="margin: 0">'+
                            	'<col width="5%"><col width="15%"><col width="50%"><col width="15%"><col width="15%">'+
                                '<tbody id="allHistoryOrders">'+tableList+'</tbody>'+
                            '</table>'+
                            '</div>'+
                            '<div id="buttonArea"><button id="loadMoreButton" onclick="loadMoreOrders(\''+userID+'\', 1)" style="display: none">Load More</button></div>'+
                        '</div>'+
                        '<div class="clearfix"></div>'+
                    '</div>'+
                '</div>'

	/*If to display the LOAD MORE button*/
	if(data.list.length%5 == 0){
		document.getElementById("loadMoreButton").style.display = 'block';
	}

}


function appendToHistory(data, currentKey, user){

	var tableList = '';
	var i = 0;
	while(data.list[i]){

		var itemsList = ''
		var n = 0;
		while(data.list[i].cart.items[n]){
			itemsList = itemsList + data.list[i].cart.items[n].itemName + '('+data.list[i].cart.items[n].qty+'). ';
			n++;
		}

		tableList = tableList +     '<tr>'+
	                                    '<td>'+((currentKey*5)+i+1)+'</td>'+
	                                    '<td>'+data.list[i].date+'</td>'+
	                                    '<td>'+itemsList+'</td>'+
	                                    '<td><i class="fa fa-inr"></i> '+data.list[i].cart.cartTotal+'</td>'+
	                                    '<td>'+data.list[i].cart.cartPoints+'</td>'+
	                                '</tr>';
	    i++;                            
	}


	document.getElementById("allHistoryOrders").innerHTML = document.getElementById("allHistoryOrders").innerHTML + tableList;
	document.getElementById("buttonArea").innerHTML = '<button id="loadMoreButton" onclick="loadMoreOrders(\''+user+'\', '+(currentKey+1)+')" style="display: none">Load More</button>';

	/*If to display the LOAD MORE button*/
	if(data.list.length%5 == 0){
		document.getElementById("loadMoreButton").style.display = 'block';
	}
}