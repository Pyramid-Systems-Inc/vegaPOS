function openLoginModal(){
	document.getElementById("loginModal").style.display = "block";
}

function hideLoginModal(){
	document.getElementById("loginModal").style.display = "none";
}


function openCouponRedeemModal(data){
	document.getElementById("couponRedeemConfirmation").innerHTML = '<p style="font-size: 18px; font-weight: bold; padding-left: 5px; color: #1abc9c;">'+data.brief+'</p>'+
							'<table class="table" style="margin: 0"> <tbody> <tr> <td style="border-top: none">Issued To</td> <td style="border-top: none;">'+data.issuedTo+'</td> </tr>'+
							'<tr> <td>Total Value</td> <td style="font-size: 21px; font-weight: bold; color: #1abc9c"><i class="fa fa-inr"></i>'+data.totalValue+'</td> </tr><tr> <td>Minimum Bill Amount</td> <td><i class="fa fa-inr"></i>'+data.minBill+'</td> </tr> <tr> <td style="color: #e74c3c">Expiry Date</td> <td style="color: #e74c3c">'+data.expiry+'</td> </tr>'+
							'</tbody> </table> <p style="color: gray; padding-left: 8px; margin: 0; padding-top: 15px">Issued by '+data.issuedAdmin+' at '+data.issuedOutlet+' on '+data.issuedDate+'</p>';
	document.getElementById("couponRedeemModal").style.display = "block";
}

function hideCouponRedeemModal(){
	document.getElementById("couponRedeemModal").style.display = "none";
}


/*to redeem coupon entered*/
function processRedeemCoupon(){
	alert('Code to be Written!')
	hideCouponRedeemModal();
}


function doLogin(){
		var username = document.getElementById("login_server_username").value;
		var password = document.getElementById("login_server_password").value;

		// Use local database for authentication
		try {
			const { db } = require('../database-init.js');
			const userSettings = db.prepare("SELECT value_json FROM settings WHERE key = 'userprofiles'").get();
			if (!userSettings || !userSettings.value_json) {
				showToast('No users found. Please contact admin.', '#e74c3c');
				return;
			}
			const users = JSON.parse(userSettings.value_json);
			const user = users.find(u => u.code === username && u.password === password);
			if (user) {
				var userInfo = {
					name: user.name,
					mobile: user.code,
					role: user.role
				};
				window.localStorage.loggedInAdminData = JSON.stringify(userInfo);
				window.localStorage.loggedInAdmin = true;
				showToast('Successfully logged in as ' + user.name, '#27ae60');
				hideLoginModal();
				renderDefaults();
				initScreenSaver();
				renderServerConnectionStatus && renderServerConnectionStatus();
			} else {
				showToast('Invalid username or password.', '#e74c3c');
			}
		} catch (err) {
			console.error(err);
			showToast('System Error: Unable to login.', '#e74c3c');
		}

}


function forceLogout(customeError){
	window.localStorage.loggedInAdmin = "";
	renderDefaults();

	/*clear previous search*/
	document.getElementById("renderAreaUserInfo").innerHTML = "";
	document.getElementById("renderAreaUserStats").innerHTML = "";	
	
	if(customeError)
		showToast(customeError, '#e74c3c');
	else
		showToast('You have been logged out', '#e74c3c');
}


/*To render errors - check if logged in*/
function renderDefaults(){

	if(window.localStorage.loggedInAdmin){
		document.getElementById("errorRenderArea").innerHTML = '<p style="color: gray; font-size: 16px; font-weight: 300; text-align: center;">Enter the Coupon/Voucher Code or the Customer\'s Registered Mobile Number</p>'
	}
	else{
		document.getElementById("errorRenderArea").innerHTML = '<p style="color: #dd4b39; font-size: 18px; font-weight: 400; text-align: center;">Please <tag class="extrasSelButton" style="font-size: 16px" onclick="openLoginModal()">Login</tag> to the Server to Continue</p>';
	}
}



function searchRequest(){

	if(!window.localStorage.loggedInAdmin){
		return '';
	}

	/*clear previous search*/
	document.getElementById("renderAreaUserInfo").innerHTML = "";
	document.getElementById("renderAreaUserStats").innerHTML = "";


	var user = document.getElementById("rewardsSearchInput").value;
	// Use local orders to calculate reward points and history
	try {
		const { getAllOrders } = require('../database-access.js');
		const orders = getAllOrders();
		// Filter orders by customer mobile
		const userOrders = orders.filter(o => o.customer_mobile === user);
		if (userOrders.length === 0) {
			document.getElementById("errorRenderArea").innerHTML = '<p style="color: #dd4b39; font-size: 18px; font-weight: 400; text-align: center;">No records found for this customer.</p>';
			showToast('No records found for this customer.', '#e74c3c');
			return;
		}
		// Calculate stats
		const visits = userOrders.length;
		let totalSpent = 0;
		let totalPoints = 0;
		let name = userOrders[0].customer_name || user;
		let email = '';
		let list = [];
		userOrders.forEach(order => {
			let cart = {};
			try {
				cart = JSON.parse(order.cart_json || '{}');
			} catch (e) { cart = {}; }
			let cartTotal = cart.cartTotal || 0;
			let cartPoints = cart.cartPoints || 0;
			totalSpent += cartTotal;
			totalPoints += cartPoints;
			list.push({
				date: order.date,
				cart: {
					items: (cart.items || []).map(i => ({ itemName: i.name, qty: i.qty })),
					cartTotal,
					cartPoints
				}
			});
		});
		// Compose data object similar to server response
		const data = {
			status: true,
			response: { name, mobile: user, email },
			count: visits,
			volume: totalSpent,
			points: totalPoints,
			list
		};
		renderHistory(data, user);
		renderDefaults();
	} catch (err) {
		console.error(err);
		document.getElementById("errorRenderArea").innerHTML = '<p style="color: #dd4b39; font-size: 18px; font-weight: 400; text-align: center;">System Error: Unable to fetch rewards data.</p>';
		showToast('System Error: Unable to fetch rewards data.', '#e74c3c');
	}
}

function loadMoreOrders(user, nextID){
		// For offline, just re-use the same logic as searchRequest, paginated
		try {
			const { getAllOrders } = require('../database-access.js');
			const orders = getAllOrders();
			const userOrders = orders.filter(o => o.customer_mobile === user);
			// Paginate 5 at a time
			const pagedList = userOrders.slice(nextID * 5, (nextID + 1) * 5).map(order => {
				let cart = {};
				try {
					cart = JSON.parse(order.cart_json || '{}');
				} catch (e) { cart = {}; }
				return {
					date: order.date,
					cart: {
						items: (cart.items || []).map(i => ({ itemName: i.name, qty: i.qty })),
						cartTotal: cart.cartTotal || 0,
						cartPoints: cart.cartPoints || 0
					}
				};
			});
			const data = { list: pagedList };
			appendToHistory(data, nextID, user);
		} catch (err) {
			console.error(err);
			showToast('System Error: Unable to load more orders.', '#e74c3c');
		}
}


function renderHistory(data, userID){

	var redeemButton = '<button class="btn btn-success rewardsButton">Redeem Points</button>';
	if(data.points < 50){
		redeemButton = '<button class="btn btn-success rewardsButton" disabled>Redeem Points</button>'+
		'<p style="color: #7f8c8d; margin-top: 5px; text-align: center"><i class="fa fa-warning"></i> Minimum 50 active points required to Redeem</p>';
	}

document.getElementById("renderAreaUserInfo").innerHTML = '<div class="box box-primary">'+
                    '<div class="box-body" style="padding: 30px 10px 30px 10px; text-align: center">'+
                        '<img src="data/photos/users/default_customer.png">'+
                        '<h1 style="font-size: 24px; font-weight: 400">'+data.response.name+'</h1>'+
                        '<p style="margin: 0; color: #3498db">'+data.response.mobile+'</p>'+
                        '<p style="margin: 0; color: #7f8c8d">'+data.response.email+'</p>'+   
                    '</div>'+
                '</div>'+redeemButton



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
                            '<div id="buttonArea"><button class="btn btn-default" id="loadMoreButton" onclick="loadMoreOrders(\''+userID+'\', 1)" style="display: none">Load More</button></div>'+
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
	document.getElementById("buttonArea").innerHTML = '<button class="btn btn-default" id="loadMoreButton" onclick="loadMoreOrders(\''+user+'\', '+(currentKey+1)+')" style="display: none">Load More</button>';

	/*If to display the LOAD MORE button*/
	if(data.list.length%5 == 0){
		document.getElementById("loadMoreButton").style.display = 'block';
	}
}