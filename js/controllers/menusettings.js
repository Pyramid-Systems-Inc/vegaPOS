
function openSubMenu(){	
	document.getElementById("menuDeatilsArea").style.display = "block";
}

function hideNewBill(){
	
	document.getElementById("newBillArea").style.display = "none";
	document.getElementById("openNewBillButton").style.display = "block";
}


/* Modal - New Category*/
function openNewMenuCategory(){
	document.getElementById("newMenuCategoryModal").style.display = "block";
	document.getElementById("openNewMenuCategoryButton").style.display = "none";
}

function hideNewMenuCategory(){
	
	document.getElementById("newMenuCategoryModal").style.display = "none";
	document.getElementById("openNewMenuCategoryButton").style.display = "block";
}


/* Modal - New Item*/
function openNewMenuItem(){
	/* removes previous cache */
	document.getElementById("newItemChoicesArea").innerHTML = ""; 
	document.getElementById("new_item_choice_count").value = 0;

	document.getElementById("newMenuItemModal").style.display = "block";
	document.getElementById("openNewMenuItemButton").style.display = "none";
}

function hideNewMenuItem(){
	
	document.getElementById("newMenuItemModal").style.display = "none";
	document.getElementById("openNewMenuItemButton").style.display = "block";
}


/* add new choice*/
function addChoice(){

	var count = document.getElementById("new_item_choice_count").value;
	count++;
	document.getElementById("new_item_choice_count").value = count;

if(!document.getElementById("newItemChoicesArea").innerHTML){
	document.getElementById("new_item_price").value = '';
	document.getElementById("new_item_price").disabled = true;
}

var newChoice = '<div class="row">'+
				    '<div class="col-lg-8">'+
				        '<div class="form-group">'+
				        	'<label for="new_item_name">Choice - '+count+' Name</label>'+
				        	'<button onclick="removeChoice(\'choice_'+count+'\')">X</button><input type="text" name="new_item_name" value="" class="form-control tip" id="new_item_name" required="required" />'+
				        '</div>'+
				    '</div>'+
				    '<div class="col-lg-4">'+
				        '<div class="form-group">'+
				            '<label for="new_item_price">Choice - '+count+' Price</label>'+
				            '<input type="text" name="new_item_price" value="" class="form-control tip" id="new_item_price" required="required" />'+
				        '</div>'+
				    '</div>'+                     
				'</div>';

document.getElementById("newItemChoicesArea").innerHTML = document.getElementById("newItemChoicesArea").innerHTML + newChoice;

}


/* remove from new choice*/
function removeChoice(id){

	//var optionToRemove = document.getElementById(id).remove();
	//optionToRemove.parentNode.removeChild(optionToRemove);

	document.getElementById("new_item_choice_count").value = document.getElementById("new_item_choice_count").value - 1;
}