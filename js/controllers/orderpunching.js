let fs = require('fs')

/*Add Item to Cart */
function additemtocart(encodedItem){

	var productToAdd = JSON.parse(decodeURI(encodedItem));

	var cart_products = window.localStorage.zaitoon_cart ?  JSON.parse(window.localStorage.zaitoon_cart) : [];

	if(productToAdd.isCustom){
		//Pop up
	}

	else if(!productToAdd.isCustom){
		var existing_product = false
		var i = 0 
		while(i < cart_products.length){
          if(cart_products[i].code == productToAdd.code){
          	existing_product = true
            cart_products[i].qty++
            break
          }
          i++;
        }
        if(existing_product==false){
			cart_products.push({"name": productToAdd.name, "price": productToAdd.price, "isCustom": productToAdd.isCustom, "isAvailable": productToAdd.isAvailable, "code": productToAdd.code, "qty": 1});
		}
		window.localStorage.zaitoon_cart = JSON.stringify(cart_products)
		renderCart()
	}	

	//window.localstorage("cart") =
}

function deleteItem(item){
	var itemCode = JSON.parse(decodeURI(item))
	var cart_products = JSON.parse(window.localStorage.zaitoon_cart)
	//console.log(itemCode)
	var i = 0;
	while(i < cart_products.length){
        if(cart_products[i].code == itemCode){
        	//console.log(cart_products[i])
          	cart_products.splice(i,1);
          	//console.log(cart_products);
        	break;
        }
        i++;
    }
    window.localStorage.zaitoon_cart = JSON.stringify(cart_products)
    renderCart()

}

function changeqty(item){
	var itemCode = JSON.parse(decodeURI(item))
	var cart_products = JSON.parse(window.localStorage.zaitoon_cart)
	//console.log(itemCode)
	var i = 0;
	while(i < cart_products.length){
        if(cart_products[i].code == itemCode){
        	//console.log(cart_products[i])
          	console.log(document.getElementById("qty"+cart_products[i].code).value)
          	cart_products[i].qty = document.getElementById("qty"+cart_products[i].code).value;
          	//console.log(cart_products);
        	break;
        }
        i++;
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
	while(i < cart_products.length){
		totqty = totqty + cart_products[i].qty
		tot = tot + (cart_products[i].price*cart_products[i].qty)
		var itemrem = encodeURI(JSON.stringify(cart_products[i].code))
		temp = temp + '<tr class="danger"><td><button type="button" class="btn btn-block btn-xs edit btn-warning"><span class="sname">'+cart_products[i].name+'</span></button></td><td class="text-right"> <span class="text-right sprice">'+cart_products[i].price+'</span></td><td><input class="form-control input-qty kb-pad text-center rquantity" id="qty'+cart_products[i].code+'" name="quantity[]" type="text" value="'+cart_products[i].qty+'" data-item="2" onchange="changeqty(\''+itemrem+'\')"></td><td class="text-right"><span class="text-right ssubtotal"><i class="fa fa-rupee"></i>'+cart_products[i].price*cart_products[i].qty+'</span></td> <td class="text-center"><i class="fa fa-trash-o tip pointer posdel" id="1516883446564" title="Remove" onclick="deleteItem(\''+itemrem+'\')"></i></td></tr>'
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
		if(fs.existsSync('mastermenu.json')) {
	      fs.readFile('mastermenu.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	          var mastermenu = JSON.parse(data); 

	          var wholeMenu = "";
	          var subMenu = ""
	          var itemsInSubMenu = "";

	         
				for (i=0; i<mastermenu.length; i++){

					subMenu = '<div class="items"><h1>'+mastermenu[i].category+'</h1>';

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
renderMenu()