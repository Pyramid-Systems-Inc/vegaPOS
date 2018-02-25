let fs = require('fs')

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
	//Calculate Tax
	var cart_products = window.localStorage.zaitoon_cart ?  JSON.parse(window.localStorage.zaitoon_cart) : [];
	var i = 0
	var temp = '';
	var totqty = 0 
	var tot = 0
	var variantName = '';
	while(i < cart_products.length){
		variantName = '';
		totqty = totqty + cart_products[i].qty
		tot = tot + (cart_products[i].price*cart_products[i].qty)
		var itemrem = cart_products[i].code;

		if(cart_products[i].isCustom){
			variantName = ' ('+cart_products[i].variant+')';
		}

		temp = temp + '<tr class="danger"><td><button type="button" class="btn btn-block btn-xs edit btn-warning"><span class="sname">'+cart_products[i].name+variantName+'</span></button></td><td class="text-right"> <span class="text-right sprice">'+cart_products[i].price+'</span></td><td><input class="form-control input-qty kb-pad text-center rquantity" id="qty'+cart_products[i].code+cart_products[i].variant+'" name="quantity[]" type="text" value="'+cart_products[i].qty+'" data-item="2" onchange="changeqty(\''+itemrem+'\', \''+cart_products[i].isCustom+'\', \''+cart_products[i].variant+'\')"></td><td class="text-right"><span class="text-right ssubtotal"><i class="fa fa-rupee"></i>'+cart_products[i].price*cart_products[i].qty+'</span></td> <td class="text-center"><i class="fa fa-trash-o tip pointer posdel" id="1516883446564" title="Remove" onclick="deleteItem(\''+itemrem+'\', \''+cart_products[i].isCustom+'\', \''+cart_products[i].variant+'\')"></i></td></tr>'
		i++
	}
	var bill = '<tbody> <tr class="info"> <td width="25%">Total Items</td> <td class="text-right" style="padding-right:10px;"><span id="count">'+totqty+'</span></td> <td width="25%">Total</td> <td class="text-right" colspan="2"><span id="total"><i class="fa fa-rupee"></i>'+tot+'</span></td> </tr> <tr class="info"> <td width="25%"><a href="#" id="add_discount">Discount</a></td> <td class="text-right" style="padding-right:10px;"><span id="ds_con">0</span></td> <td width="25%"><a href="#" id="add_tax">Order Tax</a></td> <td class="text-right"><span id="ts_con">0</span></td> </tr> <tr class="success"> <td colspan="2" style="font-weight:bold;"> Total Payable <a role="button" data-toggle="modal" data-target="#noteModal"> <i class="fa fa-comment"></i> </a> </td> <td class="text-right" colspan="2" style="font-weight:bold;"><span id="total-payable"><i class="fa fa-rupee"></i>'+tot+'</span></td> </tr> </tbody>'
	document.getElementById("cartDetails").innerHTML = temp;
	document.getElementById("totaltbl").innerHTML = bill;
}


function renderMenu(subtype){
	
	if(subtype){
		//Render Only the items of those subtype
	}
	
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

	         
				for (i=0; i<mastermenu.length; i++){

					subMenu = '<div class="items"><h1>'+mastermenu[i].category+'</h1>';

					itemsInSubMenu = '';
					for(j=0; j<mastermenu[i].items.length; j++){
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
}
