let $ = require('jquery');
let fs = require('fs');
/* THIS DOC REQUIRES JQUERY AND FILE STREAM*/


/* read categories */
function fetchAllCategories(){

		if(fs.existsSync('menuCategories.json')) {
	      fs.readFile('menuCategories.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	          
	          	var categories = JSON.parse(data);
	          	categories.sort(); //alphabetical sorting 
	          	var categoryTag = '';

				for (i=0; i<categories.length; i++){
					categoryTag = categoryTag + '<tr class="subMenuList" onclick="openSubMenu(\''+categories[i]+'\')"><td>'+categories[i]+'</td></tr>';
				}

				document.getElementById("categoryArea").innerHTML = categoryTag; 
		}
		});
	    } else {
	      console.log("File Doesn\'t Exist.")
	    }	
}


/* mark an item unavailable */
function markAvailability(code){
	/* Just invert the item availability status here*/

	if(document.getElementById("item_avail_"+code).innerHTML != 'Available'){
		document.getElementById("item_avail_"+code).innerHTML = 'Available';
		document.getElementById("item_avail_"+code).style.background = "#2ecc71";	
	}
	else{
		document.getElementById("item_avail_"+code).innerHTML = 'Out of Stock';
		document.getElementById("item_avail_"+code).style.background = "#e74c3c";		
	}

}

/*edit price of the item*/
function editItemPrice(encodedItem){

	//removes cache
	document.getElementById("extraChoicesArea").innerHTML = ''; 
	document.getElementById("removeExtraChoiceButton").style.display = 'none';	 
	


	var item = JSON.parse(decodeURI(encodedItem));

	var editContent = '';
	var customRow = '';

	document.getElementById("editMenuItemPriceModal").style.display = "block";
	document.getElementById("editItemPriceModalTitle").innerHTML = 'Edit <b>'+item.name+'</b>';
	
	if(item.isCustom){
			for(i=1; i<=item.customOptions.length; i++){
				customRow = customRow + '<div class="row" id="edit_choiceNamed_"'+i+'>'+
	                        '<div class="col-lg-8">'+
	                           '<div class="form-group">'+
	                              '<label for="new_item_name">Choice '+i+'</label> <input type="text" value="'+item.customOptions[i-1].customName+'" id="edit_choiceName_'+i+'" class="form-control tip"/>'+
	                           '</div>'+
	                        '</div>'+
	                        '<div class="col-lg-4">'+
	                           '<div class="form-group">'+
	                              '<label for="new_item_price">Price</label> <input type="text" value="'+item.customOptions[i-1].customPrice+'" class="form-control tip" id="edit_choicePrice_'+i+'" required="required" />'+
	                           '</div>'+
	                        '</div>'+                     
	                     '</div>';
			}

			editContent = '<div class="row">'+
	                        '<div class="col-lg-8">'+
	                           '<div class="form-group">'+
	                              '<label for="new_item_name">Item Name</label> <input type="text" value="'+item.name+'" id="item_main_name" class="form-control tip"/>'+
	                           '</div>'+
	                        '</div>'+  
	                        '<div class="col-lg-4" id="item_main_price_unit" style="display: none">'+
	                           '<div class="form-group">'+
	                              '<label for="new_item_name">Item Price</label> <input type="hidden" value="" id="item_main_price" class="form-control tip"/>'+
	                           '</div>'+
	                        '</div>'+  	                                          
	                     '</div>';

	        editContent = editContent + '<div id="existingChoices">' + customRow + '</div>';       

	}
	else{
			editContent = '<div class="row">'+
	                        '<div class="col-lg-8">'+
	                           '<div class="form-group">'+
	                              '<label for="new_item_name">Item Name</label> <input type="text" id="item_main_name" value="'+item.name+'" class="form-control tip"/>'+
	                           '</div>'+
	                        '</div>'+
	                        '<div class="col-lg-4" id="item_main_price_unit">'+
	                           '<div class="form-group">'+
	                              '<label for="new_item_price">Price</label> <input type="text" value="'+item.price+'" class="form-control tip" id="item_main_price" required="required" />'+
	                           '</div>'+
	                        '</div>'+                     
	                     '</div>'+
	                     '<div id="existingChoices"></div>';
	}

	document.getElementById("editItemArea").innerHTML = editContent;

	//If it has choices already, show CLEAR Choice buttons 
	if(item.isCustom){
		document.getElementById("removeExtraChoiceButton").style.display = 'block';	 
	}
}

function hideEditMenuItemPrice(){
	document.getElementById("editMenuItemPriceModal").style.display = "none";
}


/*edit - add new choice*/
function editAddMoreChoice(){

	var count = 1; //The number of choices already have (plus 1)

	while($("#edit_choicePrice_"+count).length != 0){
		count++;
	}

	/* clear choices button */
	document.getElementById("removeExtraChoiceButton").style.display = 'block';
	document.getElementById("item_main_price").value = '';	
	document.getElementById("item_main_price_unit").style.display = 'none';	

	var newChoice = $(document.createElement('div'))
	     .attr("id", 'TextBoxDiv'+count);


	var newRow = 	'<div class="row">'+
					    '<div class="col-lg-8">'+
					        '<div class="form-group">'+
					        	'<label for="new_item_name">Choice '+count+': Name</label>'+
					        	'<input type="text" class="form-control tip" id="edit_choiceName_'+count+'" required="required" />'+
					        '</div>'+
					    '</div>'+
					    '<div class="col-lg-4">'+
					        '<div class="form-group">'+
					            '<label for="new_item_price">Choice '+count+': Price</label>'+
					            '<input type="text" class="form-control tip" id="edit_choicePrice_'+count+'" required="required" />'+
					        '</div>'+
					    '</div>'+                     
					'</div>';




	newChoice.after().html(newRow);

	newChoice.appendTo("#extraChoicesArea");

}

/* edit - clear all the choices */
function removeExtraChoice(){
	document.getElementById("existingChoices").innerHTML = "";
	document.getElementById("extraChoicesArea").innerHTML = ""; 
	document.getElementById("removeExtraChoiceButton").style.display = 'none';

	/* All choices removed - option for entering single price */
	document.getElementById("item_main_price").type = 'text';
	document.getElementById("item_main_price").value = 0;
	document.getElementById("item_main_price_unit").style.display = 'block';
}


/*read and validate form with edited item details*/
function reviewItemPrice(){
	var item = {};
	item.name = document.getElementById("item_main_name").value;
	item.price = document.getElementById("item_main_price").value;

		var custom = [];
		var i = 1;
		while($("#edit_choiceName_"+i).length != 0){
			custom.push({'customName': $("#edit_choiceName_"+i).val(), 'customPrice': $("#edit_choicePrice_"+i).val()});
			i++;
		}

		item.customOptions = custom;	

 		custom.length > 0 ? item.isCustom = true : item.isCustom = false;

	/* VALIDATE BEFORE ADDING TO DATA FILE */
	console.log(item);
}





function openSubMenu(menuCategory){	

	//read menu

		if(fs.existsSync('mastermenu.json')) {
	      fs.readFile('mastermenu.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	          var mastermenu = JSON.parse(data); 
	          var itemsInCategory = "";
	          var availabilityTag = "";

				for (i=0; i<mastermenu.length; i++){

					if(menuCategory == mastermenu[i].category){

						//alphabetical sorting
						mastermenu[i].items.sort();

						for(j=0; j<mastermenu[i].items.length; j++){

							if(mastermenu[i].items[j].isAvailable){
								availabilityTag = '<span class="label availTag" id="item_avail_'+mastermenu[i].items[j].code+'" onclick="markAvailability(\''+mastermenu[i].items[j].code+'\')">Available</span>';
							}
							else{
								availabilityTag = '<span class="label notavailTag" id="item_avail_'+mastermenu[i].items[j].code+'" onclick="markAvailability(\''+mastermenu[i].items[j].code+'\')">Out of Stock</span>';
							}

							itemsInCategory = itemsInCategory + '<tr>'+
							                                       '<td>'+mastermenu[i].items[j].name+'</td>'+
							                                       '<td><button class="btn btn-sm itemPriceTag" onclick="editItemPrice(\''+encodeURI(JSON.stringify(mastermenu[i].items[j]))+'\')"><i class="fa fa-inr"></i> '+mastermenu[i].items[j].price+'</button></td>'+
							                                       '<td>'+availabilityTag+'</td>'+
							                                    '</tr>';
				
						}
					}

				}


				
				document.getElementById("menuRenderTitle").innerHTML = '<div class="box-header" id="menuRenderTitle" style="padding: 10px 0px">'+
                              '<h3 class="box-title" style="padding: 5px 0px; font-size: 21px;">'+menuCategory+
                              '<span class="editButtonGrey" onclick="openEditCategoryName(\''+menuCategory+'\')"><i class="fa fa-edit"></i></span>'+
                              '<span class="deleteButtonGrey" onclick="openDeleteConfirmation(\''+menuCategory+'\')"><i class="fa fa-trash-o"></i></span></h3>'+
                              '<button class="btn btn-success btn-sm" id="openNewMenuItemButton" onclick="openNewMenuItem(\''+menuCategory+'\')" style="float: right">New '+menuCategory+'</button>'+
                           '</div>';

                if(!itemsInCategory)
                	itemsInCategory = '<p style="color: #bdc3c7">No items found in '+menuCategory+'</p>';
				
				document.getElementById("menuRenderContent").innerHTML = itemsInCategory;
		}
		});
	    } else {
	      console.log("File Doesn\'t Exist.")
	    }		

	//menuRenderArea
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
function openNewMenuItem(category){
	/* removes previous cache */
	document.getElementById("newItemChoicesArea").innerHTML = ""; 
	document.getElementById("new_item_choice_count").value = 0;
	document.getElementById("removeChoiceButton").style.display = 'none';

	if(category)
		document.getElementById("newItemModalTitle").innerHTML = "Add New <b>"+category+"</b>";

	document.getElementById("newMenuItemModal").style.display = "block";
	document.getElementById("openNewMenuItemButton").style.display = "none";
}

function hideNewMenuItem(){
	
	document.getElementById("newMenuItemModal").style.display = "none";
	document.getElementById("openNewMenuItemButton").style.display = "block";
}


/* add new choice*/
function addChoice(){

	

	if(!document.getElementById("newItemChoicesArea").innerHTML){
		document.getElementById("new_item_price").value = '';
		document.getElementById("new_item_price").disabled = true;
		document.getElementById("removeChoiceButton").style.display = 'block';
	}

	var count = document.getElementById("new_item_choice_count").value;
	count++;
	document.getElementById("new_item_choice_count").value = count;


	var newChoice = $(document.createElement('div'))
	     .attr("id", 'TextBoxDiv'+count);


	var newRow = 	'<div class="row">'+
					    '<div class="col-lg-8">'+
					        '<div class="form-group">'+
					        	'<label for="new_item_name">Choice '+count+': Name</label>'+
					        	'<input type="text" class="form-control tip" id="choice_name_'+count+'" required="required" />'+
					        '</div>'+
					    '</div>'+
					    '<div class="col-lg-4">'+
					        '<div class="form-group">'+
					            '<label for="new_item_price">Choice '+count+': Price</label>'+
					            '<input type="text" class="form-control tip" id="choice_price_'+count+'" required="required" />'+
					        '</div>'+
					    '</div>'+                     
					'</div>';




	newChoice.after().html(newRow);

	newChoice.appendTo("#newItemChoicesArea");

}


/* remove from new choice*/
function removeChoice(id){
	document.getElementById("newItemChoicesArea").innerHTML = ""; 
	document.getElementById("new_item_choice_count").value = 0;
	document.getElementById("removeChoiceButton").style.display = 'none';
	document.getElementById("new_item_price").disabled = false;
}


/*read and validate form with new item details*/
function readNewItem(){
	var item = {};
	item.name = document.getElementById("new_item_name").value;
	item.price = document.getElementById("new_item_price").value;
	item.isCustom = document.getElementById("new_item_choice_count").value > 0 ? true: false;


	if(item.isCustom){
		var custom = [];
		var i = 1;
		while($("#choice_name_"+i).length != 0){
			custom.push({'customName': $("#choice_name_"+i).val(), 'customPrice': $("#choice_price_"+i).val()});
			i++;
		}

		item.customOptions = custom;		
	}

	/* VALIDATE BEFORE ADDING TO DATA FILE */
	console.log(item);
}



/* add new category */
function addCategory() {  

	var name = document.getElementById("add_new_category_name").value;
   
   var letterNumber = /^[0-9a-zA-Z]+$/;
   if(!name.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{ 
      //Check if file exists
      if(fs.existsSync('menuCategories.json')) {
         fs.readFile('menuCategories.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            obj = []
            obj.push(name); //add some data
            fs.writeFile('menuCategories.json', obj, 'utf8', (err) => {
                if(err)
                  console.log(err)
            });
         }
         else{
             flag=0;
             obj = JSON.parse(data);
             for (i=0; i<obj.length; i++) {
               if (obj[i] == name){
                  flag=1;
                  break;
               }
             }
             if(flag==1){
               console.log("Duplicate Entry not Allowed")
             }
             else{
                console.log(obj)
                obj.push(name);
                json = JSON.stringify(obj);
                fs.writeFile('menuCategories.json', json, 'utf8', (err) => {
                     if(err)
                        console.log(err)
                  });  
                fetchAllCategories(); //refresh the list
                hideNewMenuCategory();
             }
                 
         }
          
   }});
      } else {
         console.log("File Doesn\'t Exist. Creating new file.")
         obj.push(name);
         fs.writeFile('menuCategories.json', obj, 'utf8', (err) => {
            if(err)
               console.log(err)
         });
      }
   }
}


/* delete items in a given category */
function deleteCategoryFromMaster(menuCategory){

		if(fs.existsSync('mastermenu.json')) {
	      fs.readFile('mastermenu.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	          var mastermenu = JSON.parse(data); 
				for (i=0; i<mastermenu.length; i++){

					if(menuCategory == mastermenu[i].category){
						mastermenu.splice(i,1);
						break;
					}

				}
		       
		       var newjson = JSON.stringify(mastermenu);
		       fs.writeFile('mastermenu.json', newjson, 'utf8', (err) => {
		         if(err)
		            console.log(err)
		       }); 

		}
		});
	    } else {
	      console.log("File Doesn\'t Exist.")
	    }

}


/* delete a category */
function deleteCategory(name) {  

	/* delete from cateogry list and delete all the entries from master menu as well */

   //Check if file exists
   if(fs.existsSync('menuCategories.json')) {
       fs.readFile('menuCategories.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
       obj = JSON.parse(data); //now it an object
       //console.log(obj.length)
       for (i=0; i<obj.length; i++) {  
         if (obj[i] == name){
            obj.splice(i,1);
            break;
         }
       }
       console.log(obj)
       var newjson = JSON.stringify(obj);
       fs.writeFile('menuCategories.json', newjson, 'utf8', (err) => {
         if(err)
            console.log(err)

          deleteCategoryFromMaster(name);
       }); 
      }});
   } else {
      console.log("File Doesn\'t Exist.")
   }

   /* on successful delete */
   //document.getElementById("menuDeatilsArea").style.display = "none";
   //document.getElementById("categoryDeleteConfirmation").style.display = 'none';
   location.reload();

}

function openDeleteConfirmation(type){
	document.getElementById("deleteConfirmationConsent").innerHTML = '<button type="button" class="btn btn-default" onclick="cancelDeleteConfirmation()" style="float: left">Cancel</button>'+
                  							'<button type="button" class="btn btn-danger" onclick="deleteCategory(\''+type+'\')">Delete</button>';

	document.getElementById("deleteConfirmationText").innerHTML = 'All the items in the <b>'+type+'</b> category will also be deleted. Are you sure want to delete this category?';
	document.getElementById("categoryDeleteConfirmation").style.display = 'block';
}

function cancelDeleteConfirmation(){
	document.getElementById("categoryDeleteConfirmation").style.display = 'none';
}

/*edit category name alone */
function renameCategoryFromMaster(current, newName){
		
		if(fs.existsSync('mastermenu.json')) {
	      fs.readFile('mastermenu.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	          var mastermenu = JSON.parse(data); 
				for (i=0; i<mastermenu.length; i++){

					if(current == mastermenu[i].category){
						mastermenu[i].category = newName;
						break;
					}

				}
		       
		       var newjson = JSON.stringify(mastermenu);
		       fs.writeFile('mastermenu.json', newjson, 'utf8', (err) => {
		         if(err)
		            console.log(err)
		       }); 

		}
		});
	    } else {
	      console.log("File Doesn\'t Exist.")
	    }
}

function saveNewCategoryName(currentName){

	var newName = document.getElementById("edit_category_new_name").value;

	if(currentName != newName){ /* replace category name*/
		   //Check if file exists
		   if(fs.existsSync('menuCategories.json')) {
		       fs.readFile('menuCategories.json', 'utf8', function readFileCallback(err, data){
		       if (err){
		           console.log(err);
		       } else {
		       obj = JSON.parse(data); //now it an object
		       //console.log(obj.length)
		       for (i=0; i<obj.length; i++) {  
		         if (obj[i] == currentName){
		            obj[i] = newName;
		            break;
		         }
		       }

		       var newjson = JSON.stringify(obj);
		       fs.writeFile('menuCategories.json', newjson, 'utf8', (err) => {
		         if(err)
		            console.log(err)

		          	renameCategoryFromMaster(currentName, newName);
		       }); 
		      }});
		   } else {
		      console.log("File Doesn\'t Exist.")
		   }
	}

	document.getElementById("categoryEditNameConfirmation").style.display = 'none';
}


function openEditCategoryName(current){
	document.getElementById("editCategoryNameConsent").innerHTML = '<button type="button" class="btn btn-default" onclick="hideEditCategoryName()" style="float: left">Cancel</button>'+
                  							'<button type="button" onclick="saveNewCategoryName(\''+current+'\')" class="btn btn-success">Save</button>';
	
	document.getElementById("editCategoryNameArea").innerHTML = '<div class="row">'+
	                        '<div class="col-lg-12">'+
	                           '<div class="form-group">'+
	                              '<input style="border: none; border-bottom: 1px solid" placeholder="Enter a Name" type="text" id="edit_category_new_name" value="'+current+'" class="form-control tip"/>'+
	                           '</div>'+
	                        '</div>'+                  
	                     '</div>';

	document.getElementById("categoryEditNameConfirmation").style.display = 'block';
}

function hideEditCategoryName(){
	document.getElementById("categoryEditNameConfirmation").style.display = 'none';
}

