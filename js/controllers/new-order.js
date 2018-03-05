
/*Add Item to Cart */

function saveToCart(productToAdd){

		var cart_products = window.localStorage.zaitoon_cart ?  JSON.parse(window.localStorage.zaitoon_cart) : [];

		var i = 0;
		var flag = -1;

		while(i < cart_products.length){
          if(cart_products[i].code == productToAdd.code){

              if(cart_products[i].variant == productToAdd.variant){
                flag = i;
                break;
              }         	
          }

          i++;
        }


      if(flag != -1){
          cart_products[flag].qty +=1;
      }
      else{
      		cart_products.push({"name": productToAdd.name, "price": productToAdd.price, "isCustom": productToAdd.isCustom, "variant": productToAdd.variant, "code": productToAdd.code, "qty": 1});
      }

		window.localStorage.zaitoon_cart = JSON.stringify(cart_products)
}

function additemtocart(encodedItem){

	var productToAdd = JSON.parse(decodeURI(encodedItem));
	
	if(productToAdd.isCustom){
		//Pop up
		
		var i = 0;
		var optionList = '';
		while(productToAdd.customOptions[i]){
			optionList = optionList + '<li onclick="addCustomToCart(\''+productToAdd.name+'\', \''+productToAdd.code+'\', \''+productToAdd.customOptions[i].customPrice+'\', \''+productToAdd.customOptions[i].customName+'\')">'+
										'<a>'+productToAdd.customOptions[i].customName+' <tag style="float: right"><i class="fa fa-inr"></i> '+productToAdd.customOptions[i].customPrice+'</tag></a>'+
									  '</li>';
			i++;
		}
		document.getElementById("customiseItemModal").style.display ='block';
		document.getElementById("customiseItemTitle").innerHTML = "Choice of <b>"+productToAdd.name+"</b>";
		document.getElementById("customOptionsList").innerHTML = '<ol class="rectangle-list">'+optionList+'</ol>';
	}
	else if(!productToAdd.isCustom){
		saveToCart(productToAdd)
		renderCart()
	}	
}

function addCustomToCart(name, code, price, variant){

		var productToAdd = {};
		productToAdd.name = name;
		productToAdd.code = code;
		productToAdd.price = price;
		productToAdd.variant = variant;
		productToAdd.isCustom = true;

		saveToCart(productToAdd)
		document.getElementById("customiseItemModal").style.display ='none'
		renderCart()
}

function hideCustomiseItem(){
	document.getElementById("customiseItemModal").style.display ='none';
}

function deleteItem(item, isCustom, variant){
	var itemCode = JSON.parse(decodeURI(item))
	var cart_products = JSON.parse(window.localStorage.zaitoon_cart)



		if(isCustom == 'true'){

				var i = 0;
					while(i < cart_products.length){

							if(cart_products[i].code == itemCode && cart_products[i].variant == variant){
								cart_products.splice(i,1);
								break;
							}
				        i++;
				    }


		}
        else{
				var i = 0;

					while(i < cart_products.length){

						if(cart_products[i].code == itemCode){
							cart_products.splice(i,1);
							break;
						}
				        i++;
				    }

        }

    window.localStorage.zaitoon_cart = JSON.stringify(cart_products)
    renderCart()

}

function changeqty(item, isCustom, variant){

	var itemCode = JSON.parse(decodeURI(item))
	var cart_products = JSON.parse(window.localStorage.zaitoon_cart)
	

		if(isCustom == 'true'){

				var i = 0;
					while(i < cart_products.length){

							if(cart_products[i].code == itemCode && cart_products[i].variant == variant){
								var temp = document.getElementById("qty"+cart_products[i].code+cart_products[i].variant).value;
								cart_products[i].qty = parseInt(temp);
								break;
							}
				        i++;
				    }


		}
        else{
				var i = 0;

					while(i < cart_products.length){

						if(cart_products[i].code == itemCode){
							cart_products[i].qty = parseInt(document.getElementById("qty"+cart_products[i].code+cart_products[i].variant).value);
							break;
						}
				        i++;
				    }

        }



    window.localStorage.zaitoon_cart = JSON.stringify(cart_products)
    renderCart()
}

function renderCart(){

	//Render Cart Items based on local storage
	var cart_products = window.localStorage.zaitoon_cart ?  JSON.parse(window.localStorage.zaitoon_cart) : [];

	var billing_modes = window.localStorage.billingModesData ? JSON.parse(window.localStorage.billingModesData): [];
	
	var selectedBillingModeName = document.getElementById("customer_form_data_mode").value;
	var selectedBillingModeInfo = '';
	
	var n = 0;
	while(billing_modes[n]){
		if(billing_modes[n].name == selectedBillingModeName){
			selectedBillingModeInfo = billing_modes[n];
			break;
		}
		n++;
	}


		if(fs.existsSync('./data/static/billingparameters.json')) {
	      fs.readFile('./data/static/billingparameters.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to read Billing Parameters data. Please contact Accelerate Support.', '#e74c3c');
	    } else {

	    		if(data == ''){ data = '[]'; }

	          	var params = JSON.parse(data);

	          	var selectedModeExtrasList = (selectedBillingModeInfo.extras).split(",");
	          	var cartExtrasList = [];

	          	var n = 0;
	          	var m = 0;
	          	while(selectedModeExtrasList[n]){
	          		m = 0;
	          		while(params[m]){	  
	          			if(selectedModeExtrasList[n] == params[m].name)        			
	          				cartExtrasList.push(params[m])
	          			
	          			m++;
	          		}
	          		n++;
	          	}

	          	renderCartAfterProcess(cart_products, selectedBillingModeInfo, cartExtrasList)	          	

		}
		});
	    } else {
	      showToast('System Error: Unable to read Billing Parameters data. Please contact Accelerate Support.', '#e74c3c');
	    }	

}

function renderCartAfterProcess(cart_products, selectedBillingModeInfo, selectedModeExtras){

	/*
		cart_products - cart of items 
		selectedBillingModeInfo - info relating to the particular mode like minBillAmount, isDiscountable? etc.
		selectedModeExtras - extras of taxes to be calculated		
	*/

	if(cart_products.length < 1){
		document.getElementById("cartTitleHead").innerHTML = '';
		document.getElementById("summaryDisplay").innerHTML = '';
		document.getElementById("cartDetails").innerHTML = '<p style="font-size: 21px; text-align: center; font-weight: 300; color: #b9b9b9; }">'+
							'<img style="width: 20%; margin: 20px 0px 5px 0px;" src="images/common/emptycart.png"><br>Order Cart is empty!</p>'+
							'<p style="font-size: 12px; text-align: center; color: #c3c3c3;">To add an item to the cart, enter its name in the above box or clicking on the item from the item list in the right.</p>';
		return 0;
	}

	var i = 0;
	var temp = '';
	var totqty = 0;
	var tot = 0;
	var grandPayableSum = 0;

	var variantName = '';
	while(i < cart_products.length){
		variantName = '';
		totqty = totqty + cart_products[i].qty
		tot = tot + (cart_products[i].price*cart_products[i].qty)
		var itemrem = cart_products[i].code;

		if(cart_products[i].isCustom){
			variantName = ' ('+cart_products[i].variant+')';
		}

		temp = '<tr class="success"><td class="text-center"><i class="fa fa-trash-o tip pointer posdel" title="Remove" onclick="deleteItem(\''+itemrem+'\', \''+cart_products[i].isCustom+'\', \''+cart_products[i].variant+'\')"></i></td><td><button type="button" class="btn btn-block btn-xs edit btn-success"><span class="sname">'+cart_products[i].name+variantName+'</span></button></td><td class="text-right"> <span class="text-right sprice"><i class="fa fa-inr"></i>'+cart_products[i].price+'</span></td><td><input class="form-control input-qty kb-pad text-center rquantity" id="qty'+cart_products[i].code+cart_products[i].variant+'" name="quantity[]" type="text" value="'+cart_products[i].qty+'" data-item="2" onchange="changeqty(\''+itemrem+'\', \''+cart_products[i].isCustom+'\', \''+cart_products[i].variant+'\')"></td><td class="text-right"><span class="text-right ssubtotal"><i class="fa fa-rupee"></i>'+cart_products[i].price*cart_products[i].qty+'</span></td></tr>' + temp
		i++
	}
	
	document.getElementById("cartTitleHead").innerHTML = '<tr class="success cartTitleRow"> <th class="satu cartTitleRow" onclick="clearCartConsent()"><i class="fa fa-trash-o"></i></th><th class="cartTitleRow">Item</th> <th class="cartTitleRow">Price</th> <th class="cartTitleRow" >Qty</th> <th class="cartTitleRow">Subtotal</th>  </tr>';
	document.getElementById("cartDetails").innerHTML = temp;
	

	/*Calculate Taxes and Other Charges*/ 

          var otherChargesSum = 0;        
          var otherCharges = '';
          var otherChargerRenderCount = 1;
          var k = 0;

          otherCharges = '<tr class="info"><td width="25%" class="cartSummaryRow">Discount</td><td class="text-right cartSummaryRow" style="padding-right:10px;">0</td>';
          /*discount applied after kot generation only*/

          if(selectedModeExtras.length > 0){

          	for(k = 0; k < selectedModeExtras.length; k++){
          		if(k%2 == 1){
          			otherCharges = otherCharges + '</tr><tr class="info">';
          		}

          		var tempExtraTotal = 0;
          		if(selectedModeExtras[k].value != 0){
          			if(selectedModeExtras[k].unit == 'PERCENTAGE'){
          				tempExtraTotal = selectedModeExtras[k].value * tot/100;
          			}
          			else if(selectedModeExtras[k].unit == 'FIXED'){
          				tempExtraTotal = selectedModeExtras[k].value;
          			}
          		}

          		tempExtraTotal = Math.round(tempExtraTotal * 100) / 100;

          		otherCharges = otherCharges + '<td width="25%" class="cartSummaryRow">'+selectedModeExtras[k].name+' ('+(selectedModeExtras[k].unit == 'PERCENTAGE'? selectedModeExtras[k].value + '%': '<i class="fa fa-inr"></i>'+selectedModeExtras[k].value)+')</td><td class="text-right cartSummaryRow"><i class="fa fa-inr"></i>'+tempExtraTotal+'</td>';
          		otherChargesSum = otherChargesSum + tempExtraTotal;
          		
          	}
          }


          otherChargerRenderCount = otherChargerRenderCount + k;

          if(otherChargerRenderCount%2 == 1){
          	otherCharges = otherCharges + '<td class="cartSummaryRow"></td><td class="cartSummaryRow"></td></tr>';
          }
          else{
          	otherCharges = otherCharges + '</tr>';
          }


          grandPayableSum = tot + otherChargesSum;

          grandPayableSum = Math.round(grandPayableSum * 100) / 100


	document.getElementById("summaryDisplay").innerHTML = '<table class="table table-condensed totals" style="margin: 0">'+
                        '   <tbody>'+
                        '     <tr class="info">'+
                        '         <td width="25%" class="cartSummaryRow">Total Items</td>'+
                        '        <td class="text-right cartSummaryRow" style="padding-right:10px;"><span id="count">'+totqty+'</span></td>'+
                        '         <td width="25%" class="cartSummaryRow">Total</td>'+
                        '         <td class="text-right cartSummaryRow" colspan="2"><span id="total"><i class="fa fa-inr"></i>'+tot+'</span></td>'+
                        '      </tr>'+otherCharges+
                        '      <tr class="success cartSumRow">'+
                        '         <td colspan="2" class="cartSumRow" style="font-weight: 400 !important; font-size: 16px;">'+
                        '            Total Payable'+
                        '         </td>'+
                        '         <td class="text-right cartSumRow" colspan="2" ><span id="total-payable"><i class="fa fa-inr"></i>'+grandPayableSum+'</span></td>'+
                        '      </tr>'+
                        '   </tbody>'+
                        '</table>';
}

/*Clear cart*/
function clearCart(){
	window.localStorage.zaitoon_cart = "";
	renderCart();
	hideClearCartModal();
}

function clearCartConsent(){
	document.getElementById("clearCartConsentModal").style.display = "block";
}

function hideClearCartModal(){
	document.getElementById("clearCartConsentModal").style.display = "none";
}

/*customer info*/
function renderCustomerInfo(){

	var customerInfo = window.localStorage.customerData ?  JSON.parse(window.localStorage.customerData) : {};
	var billingModesInfo = {};

		if(fs.existsSync('./data/static/billingmodes.json')) {
	      fs.readFile('./data/static/billingmodes.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to load Billing Modes. Please contact Accelerate Support.', '#e74c3c');
	    	renderCart();
	    } else {

	    		if(data == ''){ data = '[]'; }

	          	billingModesInfo = JSON.parse(data);
	          	billingModesInfo.sort(); //alphabetical sorting 

	          	window.localStorage.billingModesData = data; /*For cart rendering purpose*/
	          	
				/*Billing modes not set or not rendering*/
				if(jQuery.isEmptyObject(billingModesInfo)){
					document.getElementById("orderCustomerInfo").innerHTML = '<p style="text-align: center; color: #dd4b39;">Billing Modes not set. <tag class="extrasSelButton" onclick="renderPage(\'bill-settings\', \'Bill Settings\'); openBillSettings(\'billingModes\')">Adding Billing Modes</tag> to continue</p>';
					showToast('Warning: Billing Modes are not set', '#e67e22');
					return '';
				}

				if(jQuery.isEmptyObject(customerInfo)){
					customerInfo.name = "";
					customerInfo.mobile = "";
					customerInfo.mode = "";
					customerInfo.modeType = "";
					customerInfo.mappedAddress = "";
					customerInfo.reference = "";
				}
				else{

					var modeOptions = '';
					var n = 0;
					while(billingModesInfo[n]){
						modeOptions = modeOptions + '<option value="'+billingModesInfo[n].name+'">'+billingModesInfo[n].name+'</option>';
						n++;
					}
					
					document.getElementById("orderCustomerInfo").innerHTML = '<div class="row" style="padding: 0 15px"> '+
			                                 '<div class="col-xs-9" style="padding: 0; padding-right: 2px">'+
			                                    '<div class="form-group" style="margin-bottom:5px;">'+
			                                       '<div class="input-group" style="width:100%;">'+
			                                             '<select name="group" onchange="changeCustomerInfo(\'mode\')" id="customer_form_data_mode" class="form-control input-tip select2">'+modeOptions+'</select>'+
			                                       '</div>'+
			                                       '<div style="clear:both;"></div>'+
			                                    '</div>'+
			                                ' </div>'+
			                                 '<div class="col-xs-3" style="padding: 0; padding-left: 2px">'+
			                                    '<div class="form-group" style="margin-bottom:5px;">'+
			                                       '<input type="text" value="'+customerInfo.mappedAddress+'" onchange="changeCustomerInfo(\'mappedAddress\')" id="customer_form_data_mappedAddress" class="form-control kb-text" placeholder="Table" />'+
			                                    '</div>'+
			                                 '</div> '+                       
			                           '</div>'+
			                           '<div class="row" style="padding: 0 15px">'+
			                                 '<div class="col-xs-6" style="padding: 0; padding-right: 2px">'+
			                                    '<div class="form-group" style="margin-bottom:5px;">'+
			                                       '<input type="text" onchange="changeCustomerInfo(\'name\')" value="'+customerInfo.name+'" id="customer_form_data_name" class="form-control kb-text" placeholder="Name" />'+
			                                    '</div>'+
			                                 '</div>'+
			                                 '<div class="col-xs-6" style="padding: 0; padding-left: 2px">'+
			                                   ' <div class="form-group" style="margin-bottom:5px;">'+
			                                       '<input type="text" onchange="changeCustomerInfo(\'mobile\')" value="'+customerInfo.mobile+'" id="customer_form_data_mobile" class="form-control kb-text" placeholder="Mobile" />'+
			                                    '</div>'+
			                                 '</div>   '+                     
			                           '</div>';	


			        document.getElementById("customer_form_data_mode").value = customerInfo.mode;
			        renderCart();
				}
		}
		});
	    }
	    else{
	    	showToast('System Error: Unable to load Billing Modes. Please contact Accelerate Support.', '#e74c3c');
	    	renderCart();
	    }	

}

function changeCustomerInfo(type){
	var value = document.getElementById("customer_form_data_"+type).value;
	var customerInfo = window.localStorage.customerData ?  JSON.parse(window.localStorage.customerData) : {};
	
	if(jQuery.isEmptyObject(customerInfo)){
		customerInfo.name = "";
		customerInfo.mobile = "";
		customerInfo.mode = "";
		customerInfo.modeType = "";
		customerInfo.mappedAddress = "";
		customerInfo.reference = "";
	}

		switch(type){
			case "name":{
				customerInfo.name = value;
				break;
			}
			case "mobile":{
				customerInfo.mobile = value;
				break;
			}	
			case "mappedAddress":{
				customerInfo.mappedAddress = value;
				break;
			}	
			case "mode":{
				customerInfo.mode = value;
				renderCart();
				break;
			}
			case "reference":{
				customerInfo.reference = value;
				break;
			}										
		}

	window.localStorage.customerData = JSON.stringify(customerInfo);
}



function renderCategoryTab(defaultTab){

		if(fs.existsSync('./data/static/menuCategories.json')) {
	      fs.readFile('./data/static/menuCategories.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to read Menu Categories data. Please contact Accelerate Support.', '#e74c3c');
	    } else {

	    		if(data == ''){ data = '[]'; }

	          	var categories = JSON.parse(data);
	          	categories.sort(); //alphabetical sorting 
	          	var categoryTag = '';


				for (var i=0; i<categories.length; i++){
					if(categories[i] == defaultTab)
					{
						categoryTag = categoryTag + '<button type="button" class="btn btn-outline-sub activeCatTab" onclick="renderMenu(\''+categories[i]+'\')">'+categories[i]+'</button>'
					}	
					else{
						categoryTag = categoryTag + '<button type="button" class="btn btn-outline-sub" onclick="renderMenu(\''+categories[i]+'\')">'+categories[i]+'</button>'
					}
				}

				if(!categoryTag)
					categoryTag = '<p style="color: #dd4b39; padding: 20px; text-align: center; font-size: 14px; margin-bottom: 0px;">Menu is not added yet.</p>';


				document.getElementById("subMenuSelectionArea").innerHTML = categoryTag;
	        

	        	var dropTag = '';
				for (var i=0; i<categories.length; i++){
					if(categories[i] == defaultTab)
					{
						dropTag = dropTag + '<a href="#" onclick="renderMenu(\''+categories[i]+'\')">'+categories[i]+'</a>';
					}	
					else{
						dropTag = dropTag + '<a href="#" onclick="renderMenu(\''+categories[i]+'\')">'+categories[i]+'</a>';
					}
				}

				if(!dropTag)
					dropTag = '<p style="color: #dd4b39; padding: 20px; text-align: center; font-size: 14px; margin-bottom: 0px;">Menu is not added yet.</p>';

				document.getElementById("posSubMenuDropdown").innerHTML = dropTag;
			



			
				
		}
		});
	    } else {
	      showToast('System Error: Unable to read Menu Categories data. Please contact Accelerate Support.', '#e74c3c');
	    }	
}


function getImageCode(text){
	text = text.replace(/[^a-zA-Z ]/g, "");
	var words = text.split(' ');

	if(words.length > 1){
		return words[0].substring(0,1)+words[1].substring(0,1);
	}
	else{
		return (text.substring(0, 2)).toUpperCase();
	}
}

function renderMenu(subtype){

		if(fs.existsSync('./data/static/mastermenu.json')) {
	      fs.readFile('./data/static/mastermenu.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        
	    } else {


	    /* PERSONALISATIONS */
		var showPhotosFlag = window.localStorage.appCustomSettings_ImageDisplay == 'true' ? true: false;


	          		var mastermenu = JSON.parse(data); 

	          		var itemsInSubMenu = "";

					if(!subtype){
						subtype = mastermenu[0].category;
					}

					renderCategoryTab(subtype);
	         
				for (var i=0; i<mastermenu.length; i++){

					if(mastermenu[i].category == subtype){
						itemsInSubMenu = '';
						for(var j=0; j<mastermenu[i].items.length; j++){
							var temp = encodeURI(JSON.stringify(mastermenu[i].items[j]));
							if(mastermenu[i].items[j].isPhoto && showPhotosFlag){
								itemsInSubMenu = itemsInSubMenu + '<button onclick="additemtocart(\''+temp+'\')" type="button" id="p1" type="button" class="btn btn-both btn-flat product"><span class="bg-img" style="background: none !important;"><img src="data/photos/menu/1009.jpg" alt="Minion Banana" style="width: 110px; height: 110px;"></span><span><span>'+mastermenu[i].items[j].name+'</span></span></button>';
							}
							else{
								itemsInSubMenu = itemsInSubMenu + '<button onclick="additemtocart(\''+temp+'\')" type="button" id="p1" type="button" class="btn btn-both btn-flat product"><span class="bg-img"><div id="itemImage">'+getImageCode(mastermenu[i].items[j].name)+'</div></span><span><span>'+mastermenu[i].items[j].name+'</span></span></button>';
							}
						}
						break;
					}
				}
				
				document.getElementById("item-list").innerHTML = itemsInSubMenu;
				document.getElementById("posSubMenuTitle").innerHTML = subtype;

				if(!itemsInSubMenu){
					document.getElementById("item-list").innerHTML = '<p style="font-size: 18px; color: #bfbfbf; padding: 20px;">No available items in '+subtype+'</p>';
				}

				/*Adjust height*/ /*TWEAK*/
				var measures = {};
				measures.fullHeight = document.getElementById("fullRightPanel").offsetHeight;
				measures.menuOriginal = document.getElementById("item-list").offsetHeight;
				measures.menuRendered = document.getElementById("item-list").scrollHeight;
				measures.subOriginal = document.getElementById("subMenuSelectionArea").offsetHeight;
				measures.subRendered = document.getElementById("subMenuSelectionArea").scrollHeight;

				document.getElementById('subMenuSelectionArea').setAttribute("style","height: auto !important; overflow: none !important");

				if(measures.menuRendered > measures.menuOriginal){
					if(measures.subRendered + measures.menuRendered > measures.fullHeight){
						/*Adjust Height*/
						document.getElementById('subMenuSelectionArea').setAttribute("style","height: 17vh !important; overflow: scroll !important");
					}
				}
		}
		});
	    } else {
	      showToast('System Error: Unable to read Menu data. Please contact Accelerate Support.', '#e74c3c');
	    }	

	

	/*
	else{
		if(fs.existsSync('./data/static/mastermenu.json')) {
	      fs.readFile('./data/static/mastermenu.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	          var mastermenu = JSON.parse(data); 

	          var wholeMenu = "";
	          var subMenu = ""
	          var itemsInSubMenu = "";

	         
				for (var i=0; i<mastermenu.length; i++){

					subMenu = '<div class="items"><h1>'+mastermenu[i].category+'</h1>';

					itemsInSubMenu = '';
					for(var j=0; j<mastermenu[i].items.length; j++){
						var temp = encodeURI(JSON.stringify(mastermenu[i].items[j]));
						itemsInSubMenu = itemsInSubMenu + '<button onclick="additemtocart(\''+temp+'\')" type="button" id="p1" type="button" class="btn btn-both btn-flat product"><span class="bg-img"><img src="https://spos.tecdiary.com/uploads/thumbs/213c9e007090ca3fc93889817ada3115.png" alt="Minion Banana" style="width: 100px; height: 100px;"></span><span><span>'+mastermenu[i].items[j].name+'</span></span></button>';
			
					}

					subMenu = subMenu + itemsInSubMenu +'</div>';
					wholeMenu = wholeMenu + subMenu;
				}
				
				document.getElementById("item-list").innerHTML = wholeMenu;
		}
		});
	    } else {
	      console.log("File Doesn\'t Exist.")
	    }	
	}
	*/
}




/* Sample KOT */
/*

{
	"KOTNumber": "KOT1001",
	"table": "T3",
	"customerName": "Abhijith",
	"customerMobile": "9043960876",
	"stewardName": "Maneesh",
	"stewardCode": "9848010922",
	"orderStatus": 1,
	"date": "24-01-2018",
	"timePunch": "2217",
	"timeKOT": "2219",
	"timeBill": "",
	"timeSettle": "",
	"cart": [{
		"name": "Chicken Shawarma",
		"code": "1086",
		"qty": 1,
		"isCustom": true,
		"variant": "Paratha Roll",
		"price": "75",
		"comments": ""
	}, {
		"code": "1081",
		"name": "Boneless BBQ Fish",
		"qty": 1,
		"isCustom": false,
		"price": "220",
		"comments": "Make it less spicy"
	}],
	"extras": [{
		"name": "GST",
		"value": 5,
		"unit": "PERCENTAGE",
		"amount": 15
	}, {
		"name": "Service Charge",
		"value": 45,
		"unit": "FIXED",
		"amount": 45
	}],
	"discount": {
		"amount": 35.4,
		"type": "Staffs Guest",
		"unit": "PERCENTAGE",
		"value": "12"
	},
	"specialRemarks": "Allergic to Tomato"
}

*/

function generateKOT(){

	//Render Cart Items based on local storage
	var cart_products = window.localStorage.zaitoon_cart ?  JSON.parse(window.localStorage.zaitoon_cart) : [];
	if(cart_products.length == 0){
		showToast('Empty Cart! Add items and try again', '#e74c3c');
		return '';
	}

	var billing_modes = window.localStorage.billingModesData ? JSON.parse(window.localStorage.billingModesData): [];
	
	var selectedBillingModeName = document.getElementById("customer_form_data_mode").value;
	var selectedBillingModeInfo = '';
	
	var n = 0;
	while(billing_modes[n]){
		if(billing_modes[n].name == selectedBillingModeName){
			selectedBillingModeInfo = billing_modes[n];
			break;
		}
		n++;
	}


		if(fs.existsSync('./data/static/billingparameters.json')) {
	      fs.readFile('./data/static/billingparameters.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to read Billing Parameters data. Please contact Accelerate Support.', '#e74c3c');
	    } else {

	    		if(data == ''){ data = '[]'; }

	          	var params = JSON.parse(data);

	          	var selectedModeExtrasList = (selectedBillingModeInfo.extras).split(",");
	          	var cartExtrasList = [];

	          	var n = 0;
	          	var m = 0;
	          	while(selectedModeExtrasList[n]){
	          		m = 0;
	          		while(params[m]){	  
	          			if(selectedModeExtrasList[n] == params[m].name)        			
	          				cartExtrasList.push(params[m])
	          			
	          			m++;
	          		}
	          		n++;
	          	}

	          	generateKOTAfterProcess(cart_products, selectedBillingModeInfo, cartExtrasList)	          	

		}
		});
	    } else {
	      showToast('System Error: Unable to read Billing Parameters data. Please contact Accelerate Support.', '#e74c3c');
	    }	
}

function generateKOTAfterProcess(cart_products, selectedBillingModeInfo, selectedModeExtras){
	/*Process Figures*/
	var subTotal = 0;

	var n = 0;
	while(cart_products[n]){
		subTotal = subTotal + cart_products[n].qty * cart_products[n].price;
		n++;
	}

		  /*Calculate Taxes and Other Charges*/ 
          var otherCharges = [];        
          var k = 0;

          if(selectedModeExtras.length > 0){
          	for(k = 0; k < selectedModeExtras.length; k++){

          		var tempExtraTotal = 0;
          		if(selectedModeExtras[k].value != 0){
          			if(selectedModeExtras[k].unit == 'PERCENTAGE'){
          				tempExtraTotal = selectedModeExtras[k].value * subTotal/100;
          			}
          			else if(selectedModeExtras[k].unit == 'FIXED'){
          				tempExtraTotal = selectedModeExtras[k].value;
          			}
          		}

          		tempExtraTotal = Math.round(tempExtraTotal * 100) / 100;

          		otherCharges.push({
			 		"name": selectedModeExtras[k].name,
					"value": selectedModeExtras[k].value,
					"unit": selectedModeExtras[k].unit,
					"amount": tempExtraTotal
          		})
          	}
          }


    //Get customer info.
	var customerInfo = window.localStorage.customerData ?  JSON.parse(window.localStorage.customerData) : {};
	
	if(jQuery.isEmptyObject(customerInfo)){
		showToast('Customer Details missing', '#e74c3c');
		return '';
	}

	if(customerInfo.mappedAddress == ''){
		showToast('Table Number or Address missing', '#e74c3c');
		return '';
	}

	/* customerInfo.json
		{
			"name": "Anas Jafry",
			"mobile": "9884179675",
			"mode": "VIP Guest",
			"mappedAddress": "T3",
			"reference": "Ref. to any other API (say booking number)"
		}
	*/

	var stewName = '';
	var stewCode = '9884169765';
	var spremarks = '';
   
      //Check if file exists

      fs.readFile('./data/static/lastKOT.txt', 'utf8', function readFileCallback(err, data){
       if (err){
           showToast('System Error: Unable to read order related data. Please contact Accelerate Support.', '#e74c3c');
       } else{
          var num = parseInt(data) + 1;
          var kot = 'KOT' + num;
          var today = new Date();
          var time;
          var dd = today.getDate();
          var mm = today.getMonth()+1; //January is 0!
          var yyyy = today.getFullYear();
          var hour = today.getHours();
          var mins = today.getMinutes();

          if(dd<10) {
              dd = '0'+dd;
          } 

          if(mm<10) {
              mm = '0'+mm;
          } 

          if(hour<10) {
              hour = '0'+hour;
          } 

          if(mins<10) {
              mins = '0'+mins;
          }

          today = dd + '-' + mm + '-' + yyyy;
          time = hour + '' + mins;

          var obj = {}; 
          obj.KOTNumber = kot;
          obj.table = customerInfo.mappedAddress;
          obj.customerName = customerInfo.name;
          obj.customerMobile = customerInfo.mobile; 
          obj.stewardName = 'STEWARD NAME';
          obj.stewardCode = 'STEWARD CODE';
          obj.orderStatus = 1;
          obj.date = today;
          obj.timePunch = time;
          obj.timeKOT = "";
          obj.timeBill = "";
          obj.timeSettle = "";
          obj.cart = cart_products;
          obj.specialRemarks = 'SPECIAL COMMENTS';
          obj.extras = otherCharges,
          obj.discount = {}

          console.log(obj)
          
          

          var json = JSON.stringify(obj); //convert it back to json
          var file = './data/KOT/'+kot+'.json';
          fs.writeFile(file, json, 'utf8', (err) => {
              if(err)
                 showToast('System Error: Unable to generate KOT. Please contact Accelerate Support.', '#e74c3c');
              else
              	 showToast('#'+kot+' generated Successfully', '#27ae60');
           });


          fs.writeFile("./data/static/lastKOT.txt", num, 'utf8', (err) => {
              if(err)
                 showToast('System Error: Unable to modify order related data. Please contact Accelerate Support.', '#e74c3c');
           });
       }
       });
}