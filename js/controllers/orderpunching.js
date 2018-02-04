let fs = require('fs')

/*Add Item to Cart */
function additemtocart(encodedItem){
	
	var item = JSON.parse(decodeURI(encodedItem));

	console.log(item)

/*
	if(item.isCustom){
		//Pop up
	}

	else{
		console.log("success")
		//add directly
		var cart_products = !_.isUndefined(window.localStorage.cart) ?  JSON.parse(window.localStorage.cart) : [];
		cart_products.push(item);
		window.localStorage.cart = JSON.stringify(cart_products);
	}
*/	

	//window.localstorage("cart") =
}

function renderCart(){
	//Render Cart Items based on local storage
	//Calculate Tax

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