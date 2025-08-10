function renderOnlineOrders($http){
	// Use local orders from the database
	try {
		const { getAllOrders } = require('../database-access.js');
		const orders = getAllOrders();
		// Filter for online orders if needed, or show all
		var items = "";
		var incomingOrdersCount = orders.length;
		for (var i = 0; i < orders.length; i++) {
			var orderID = orders[i].kot_number || orders[i].id;
			var userName = orders[i].customer_name || '';
			var userID = orders[i].customer_mobile || '';
			var cart = {};
			try { cart = JSON.parse(orders[i].cart_json || '{}'); } catch (e) { cart = {}; }
			var amountPaid = cart.cartTotal || 0;
			var timePlace = orders[i].time_punch || '';
			items += '<tr role="row" onclick="OrderWiseItemList(\''+orderID+'\')"> <td>'+orderID+'</td> <td>'+userName+'<br>'+userID+'</td> <td><i class="fa fa-inr"></i> '+amountPaid+'</td> <td>'+timePlace+'</td> </tr>';
		}
		document.getElementById("onlineOrders").innerHTML = items;
		document.getElementById("incomingOrdersCount").innerHTML = incomingOrdersCount;
		window.localStorage.lastOrderFetchData = JSON.stringify(orders);
	} catch (err) {
		console.error(err);
		document.getElementById("onlineOrders").innerHTML = '<tr><td colspan="4">System Error: Unable to load orders.</td></tr>';
		document.getElementById("incomingOrdersCount").innerHTML = 0;
	}

}

function OrderWiseItemList(orderID){
	//console.log(orderID);
	var lastOrderFetchData = window.localStorage.lastOrderFetchData ?  JSON.parse(window.localStorage.lastOrderFetchData) : [];
	for (var i = 0; i < lastOrderFetchData.length; i++) {
		var order = lastOrderFetchData[i];
		var thisOrderID = order.kot_number || order.id;
		if (thisOrderID == orderID) {
			var ordertype = order.isPrepaid ? "PREPAID ORDER" : "Cash on Delivery";
			document.getElementById("orderInfo").innerHTML = '<h3 class="box-title" style="padding: 5px 0px; font-size: 21px;">Order #'+orderID+' <tag class="onlinePrepaid">'+ordertype+'</tag> </h3> <button class="btn btn-success btn-sm" style="float: right">Punch KOT</button>';
			var cart = {};
			try { cart = JSON.parse(order.cart_json || '{}'); } catch (e) { cart = {}; }
			var itemsArr = cart.items || [];
			var item = "";
			for (var j = 0; j < itemsArr.length; j++) {
				item += '<tr> <td>'+(j+1)+'</td> <td>'+itemsArr[j].name+'</td> <td>'+itemsArr[j].qty+'</td> <td><i class="fa fa-inr"></i> '+itemsArr[j].price+'</td> <td><i class="fa fa-inr"></i> '+(itemsArr[j].qty*itemsArr[j].price)+'</td> </tr>';
			}
			var amountPaid = cart.cartTotal || 0;
			item += '<tr style="background: #fcfcfc"> <td></td> <td></td> <td><b>Sub Total</b></td> <td></td> <td><i class="fa fa-inr"></i> '+amountPaid+'</td> </tr>';
			item += '<tr style="background: #fcfcfc"> <td></td> <td></td> <td><b>Total Extras</b></td> <td></td> <td><i class="fa fa-inr"></i> 0</td> </tr>';
			item += '<tr style="background: #fcfcfc"> <td></td> <td></td> <td><b>Total Discounts</b></td> <td></td> <td><i class="fa fa-inr"></i> 0</td> </tr>';
			item += '<tr style="background: #fcfcfc"> <td></td> <td></td> <td><b>Total Amount Received</b></td> <td></td> <td><i class="fa fa-inr"></i> '+amountPaid+'</td> </tr>';
			document.getElementById("itemInfo").innerHTML = item;
			document.getElementById("addressInfo").innerHTML = '<div class="col-xs-5"> <div class="deliveryAddress"> <p class="deliveryTitle">Delivery Address</p> <p class="deliveryText">'+(order.deliveryAddress || '')+'</p> <p class="deliveryText">Mob. <b>'+(order.customer_mobile || '')+'</b></p> </div> </div> <div class="col-xs-2"> </div> <div class="col-xs-5"> <div class="deliveryAddress"> <p class="deliveryTitle">COMMENTS TO CHEF</p> <p class="deliveryComment">'+(order.comments || '')+'</p> </div> </div>';
			break;
		}
	}

}