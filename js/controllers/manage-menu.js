

/* THIS DOC REQUIRES JQUERY AND FILE STREAM*/


/*
var db = new PouchDB('my_database_2');
console.log(db)

var remoteCouch = 'http://admin:admin@127.0.0.1:5984/test_vega';


function showTodos() {
  db.allDocs({include_docs: true, descending: true}, function(err, doc) {
    console.log(doc.rows);
  });
}



function addTodo(text) {
  var todo = {
    _id: new Date().toISOString(),
    title: text,
    completed: false
  };
  db.put(todo, function callback(err, result) {
    if (!err) {
      console.log('Successfully posted a todo!');
      showTodos();
    }
  });
}

addTodo('CS');

function sync() {
  var opts = {live: true};
  db.replicate.to(remoteCouch, opts, '');
  db.replicate.from(remoteCouch, opts, '');
}


sync();

*/

const database = require('../database.js');

/* read categories */
function fetchAllCategories(){
	try {
		var categories = database.getAllCategories();
		var categoryTag = '';

		for (var i=0; i<categories.length; i++){
			categoryTag = categoryTag + '<tr class="subMenuList" onclick="openSubMenu(\''+categories[i].name+'\')"><td>'+categories[i].name+'</td></tr>';
		}

		if(!categoryTag)
			categoryTag = '<p style="color: #bdc3c7">No Category added yet.</p>';

		document.getElementById("categoryArea").innerHTML = categoryTag;
	} catch (err) {
		showToast('System Error: Unable to read Category data. Please contact Accelerate Support.', '#e74c3c');
	}
}


/* mark an item unavailable */
function markAvailability(code){
	try {
		const database = require('../database.js');
		const item = database.getMenuItemByCode(code);
		
		if (item) {
			const newAvailability = !item.is_available;
			database.updateMenuItem(code, {
				...item,
				is_available: newAvailability
			});

			if(document.getElementById("item_avail_"+code).innerHTML != 'Available'){
				document.getElementById("item_avail_"+code).innerHTML = 'Available';
				document.getElementById("item_avail_"+code).style.background = "#27ae60";	
			}
			else{
				document.getElementById("item_avail_"+code).innerHTML = 'Out of Stock';
				document.getElementById("item_avail_"+code).style.background = "#e74c3c";		
			}
		}
	} catch (err) {
		showToast('System Error: Unable to update Menu data. Please contact Accelerate Support.', '#e74c3c');
	}
}

/*edit price of the item*/
function editItemPrice(encodedItem, inCateogry){

	//removes cache
	document.getElementById("extraChoicesArea").innerHTML = ''; 
	document.getElementById("removeExtraChoiceButton").style.display = 'none';	 
	


	var item = JSON.parse(decodeURI(encodedItem));

	var editContent = '';
	var customRow = '';

	document.getElementById("editMenuItemPriceModal").style.display = "block";
	document.getElementById("editItemPriceModalTitle").innerHTML = 'Edit <b>'+item.name+'</b>';
	document.getElementById("editPriceModalActions").innerHTML = '<button type="button" class="btn btn-default" onclick="hideEditMenuItemPrice()" style="float: left">Cancel</button>'+
                  												   '<button type="button" onclick="reviewItemPrice(\''+inCateogry+'\')" class="btn btn-success">Save</button>';
	
	if(item.isCustom){
			for(var i=1; i<=item.customOptions.length; i++){
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
	document.getElementById("editItemCodeSecret").innerHTML = '<input type="hidden" id="item_main_code_secret" value="'+item.code+'"/>';

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







function openSubMenu(menuCategory){	

	//read menu

		if(fs.existsSync('./data/static/mastermenu.json')) {
	      fs.readFile('./data/static/mastermenu.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to read Menu data. Please contact Accelerate Support.', '#e74c3c');
	    } else {
	    		if(data == ''){ data = '[]'; }
	          var mastermenu = JSON.parse(data); 
	          var itemsInCategory = "";
	          var availabilityTag = "";

				for (var i=0; i<mastermenu.length; i++){

					if(menuCategory == mastermenu[i].category){

						//alphabetical sorting
						mastermenu[i].items.sort();

						for(var j=0; j<mastermenu[i].items.length; j++){

							if(mastermenu[i].items[j].isAvailable){
								availabilityTag = '<span class="label availTag" id="item_avail_'+mastermenu[i].items[j].code+'" onclick="markAvailability(\''+mastermenu[i].items[j].code+'\')">Available</span>';
							}
							else{
								availabilityTag = '<span class="label notavailTag" id="item_avail_'+mastermenu[i].items[j].code+'" onclick="markAvailability(\''+mastermenu[i].items[j].code+'\')">Out of Stock</span>';
							}

							itemsInCategory = itemsInCategory + '<tr>'+
							                                       '<td>'+mastermenu[i].items[j].name+'</td>'+
							                                       '<td><button class="btn btn-sm itemPriceTag" onclick="editItemPrice(\''+encodeURI(JSON.stringify(mastermenu[i].items[j]))+'\', \''+menuCategory+'\')"><i class="fa fa-inr"></i> '+mastermenu[i].items[j].price+'</button></td>'+
							                                       '<td>'+availabilityTag+'</td>'+
							                                    '</tr>';
				
						}
					}

				}


				
				document.getElementById("menuRenderTitle").innerHTML = '<div class="box-header" id="menuRenderTitle" style="padding: 10px 0px">'+
                              '<h3 class="box-title" style="padding: 5px 0px; font-size: 21px;">'+menuCategory+'</h3>'+
                           '</div>';

               	//Submenu options
               	var subOptions = '<div class="floaty" style="right: -85px; top: 10px">'+
                                  '<div class="floaty-btn" onclick="openNewMenuItem(\''+menuCategory+'\')">'+
                                    '<span class="floaty-btn-label">Add a New '+menuCategory+'</span>'+
                                    '<svg width="24" height="24" viewBox="0 0 24 24" class="floaty-btn-icon floaty-btn-icon-plus absolute-center">'+
										'<path d="M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z" fill="#fff"/>'+
    									'<path d="M0-.75h24v24H0z" fill="none"/>'+
                                    '</svg>'+
                                    '<svg width="24" height="24" viewBox="0 0 24 24" class="floaty-btn-icon floaty-btn-icon-create absolute-center">'+
                                      '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#fff"/>'+
                                      '<path d="M0 0h24v24H0z" fill="none"/>'+
                                    '</svg>'+
                                  '</div>'+
                                  '<ul class="floaty-list">'+
                                    '<li class="floaty-list-item floaty-list-item--blue" onclick="openEditCategoryName(\''+menuCategory+'\')">'+
                                      '<span class="floaty-list-item-label">Edit Category Name</span>'+
                                      '<svg width="20" height="20" viewBox="0 0 24 24" class="absolute-center">'+
                                        '<path d="M5 17v2h14v-2H5zm4.5-4.2h5l.9 2.2h2.1L12.75 4h-1.5L6.5 15h2.1l.9-2.2zM12 5.98L13.87 11h-3.74L12 5.98z"/>'+
                                        '<path d="M0 0h24v24H0z" fill="none"/>'+
                                      '</svg>'+
                                    '</li>'+
                                    '<li class="floaty-list-item floaty-list-item--red" onclick="openDeleteConfirmation(\''+menuCategory+'\')">'+
                                      '<span class="floaty-list-item-label">Delete '+menuCategory+'</span>'+
                                      '<svg width="20" height="20" viewBox="0 0 24 24" class="absolute-center">'+
                                          '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>'+
                                          '<path d="M0 0h24v24H0z" fill="none"/>'+
                                      '</svg>'+
                                    '</li>'+     
                                  '</ul>'+
                                '</div>';

                document.getElementById("submenuOptions").innerHTML = subOptions;

				//Floating Button Animation
				var $floaty = $('.floaty');

				$floaty.on('mouseover click', function(e) {
				  $floaty.addClass('is-active');
				  e.stopPropagation();
				});

				$floaty.on('mouseout', function() {
				  $floaty.removeClass('is-active');
				});

				$('.container').on('click', function() {
				  $floaty.removeClass('is-active');
				});



                if(!itemsInCategory)
                	itemsInCategory = '<p style="color: #bdc3c7">No items found in '+menuCategory+'</p>';
				
				document.getElementById("menuRenderContent").innerHTML = itemsInCategory;
		}
		});
	    } else {
	      showToast('System Error: Unable to read Menu data. Please contact Accelerate Support.', '#e74c3c');
	    }		

	//menuRenderArea
	document.getElementById("menuDetailsArea").style.display = "block";
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

	if(category){
		document.getElementById("newItemModalTitle").innerHTML = "Add New <b>"+category+"</b>";
		document.getElementById("newItemModalActions").innerHTML = '<button type="button" class="btn btn-default" onclick="hideNewMenuItem()" style="float: left">Cancel</button>'+
                  								'<button type="button" onclick="readNewItem(\''+category+'\')" class="btn btn-success">Add</button>';
	}
		
	document.getElementById("new_item_name").value = '';
	document.getElementById("new_item_price").value = '';
	document.getElementById("newMenuItemModal").style.display = "block";
}

function hideNewMenuItem(){	
	document.getElementById("newMenuItemModal").style.display = "none";
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
function validateMenuItem(item){

	var error = '';

	if(item.name == ''){
		error = 'Item Name can not be empty.';
		return {'status': false, 'error': error}
	}
	else if(!item.isCustom && item.price == ''){
		error = 'Item Price can not be empty.';
		return {'status': false, 'error': error}		
	}
	else if(!item.isCustom && isNaN(item.price)){
		error = 'Item Price has to be a valid Number.';
		return {'status': false, 'error': error}		
	}
	else if(item.isCustom){

		var i = 0;
		while(item.customOptions[i]){
			
			if(item.customOptions[i].customName == ''){
				error = 'Choice Names can not be empty.';
				return {'status': false, 'error': error}
			}
			else if(item.customOptions[i].customPrice == ''){
				error = 'Choice Prices can not be empty.';
				return {'status': false, 'error': error}
			}
			else if(isNaN(item.customOptions[i].customPrice)){
				error = 'Choice Prices must be valid Numbers.';
				return {'status': false, 'error': error}
			}

			i++;
		}	

		error = '';
		return {'status': true, 'error': error}	
	}	
	else{
		error = '';
		return {'status': true, 'error': error}		
	}
}


function saveItemToFile(category, item, editFlag) {



    /*to find the latest item code*/
    if (fs.existsSync('./data/static/mastermenu.json')) {
        fs.readFile('./data/static/mastermenu.json', 'utf8', function readFileCallback(err, data) {
            if (err) {
                showToast('System Error: Failed to read Menu data. Could not create an Item Code. Please contact Accelerate Support.', '#e74c3c');
            } else {
                if (data == '') {
                    data = '[]';
                }
                var mastermenu = JSON.parse(data);
                var lastKey = 0; //To generate the item code

                if (!editFlag) {
                    for (var i = 0; i < mastermenu.length; i++) {
                        for (var j = 0; j < mastermenu[i].items.length; j++) {
                            if (mastermenu[i].items[j].code > lastKey) {
                                lastKey = mastermenu[i].items[j].code;
                            }
                        }
                    }

                    item.code = lastKey + 1;
                }


                //Proceed to Save

                /*begin save*/


                /*beautify item price if Custom item*/
                if (item.isCustom) {
                    var min = 0;
                    var max = 0;
                    var i = 0;
                    while (item.customOptions[i]) {
                        if (i == 0) {
                            min = item.customOptions[i].customPrice;
                        }

                        if (max < item.customOptions[i].customPrice) {
                            max = item.customOptions[i].customPrice;
                        }

                        if (min > item.customOptions[i].customPrice) {
                            min = item.customOptions[i].customPrice;
                        }

                        i++;
                    }

                    if (min < max) {
                        item.price = min + '-' + max;
                    } else {
                        item.price = max;
                    }

                }


                if (fs.existsSync('./data/static/mastermenu.json')) {
                    fs.readFile('./data/static/mastermenu.json', 'utf8', function readFileCallback(err, data) {

                        if (err) {
                            showToast('System Error: Unable to read Menu data. Please contact Accelerate Support.', '#e74c3c');
                        } else {
                            if (data == "") {
                                var obj = []
                                var menuitem = []
                                menuitem.push(item)
                                obj.push({
                                    "category": category,
                                    "items": menuitem
                                }); //add some data

                                json = JSON.stringify(obj); //convert it back to json
                                fs.writeFile('./data/static/mastermenu.json', json, 'utf8', (err) => {
                                    if (err) {
                                        showToast('System Error: Unable to save Menu data. Please contact Accelerate Support.', '#e74c3c');
                                    } else {
                                        showToast('Success! ' + item.name + ' is added to the Menu.', '#27ae60');
                                        console.log('Adding item.. DONE!')

                                    }

                                });
                            } else {
                                var flag = 0; //Category exists or not
                                if (data == '') {
                                    data = '[]';
                                }
                                var obj = JSON.parse(data); //now it an object

                                for (var i = 0; i < obj.length; i++) {
                                    if (obj[i].category == category) {
                                        flag = 1;
                                        break;
                                    }
                                }
                                if (flag == 1) { //category exists
                                    var dupflag = 0;
   
                                    for (var j = 0; j < obj[i].items.length; j++) {
                                        if (obj[i].items[j].code == item.code) {
                                            dupflag = 1;
                                            break;
                                        }
                                    }

                                    if (dupflag == 1) {
                                        if (editFlag) { //Found
                                        	
                                            obj[i].items[j] = item
                                            json = JSON.stringify(obj); //convert it back to json
                                            fs.writeFile('./data/static/mastermenu.json', json, 'utf8', (err) => {
                                                if (err) {
                                                    showToast('System Error: Unable to save Menu data. Please contact Accelerate Support.', '#e74c3c');
                                                } else {
                                                    showToast(item.name + ' is added to the Menu.', '#27ae60');
                                                    openSubMenu(category);
                                                }

                                            });
                                        } else {
                                            showToast('Warning: Item Code already exists. Please choose a different code.', '#e67e22');
                                        }

                                    } else {
                                    	obj[i].items[j] = item;
                                        var json = JSON.stringify(obj); //convert it back to json
                                       
                                        fs.writeFile('./data/static/mastermenu.json', json, 'utf8', (err) => {
                                        	
                                            if (err) {
                                                showToast('System Error: Unable to save Menu data. Please contact Accelerate Support.', '#e74c3c');
                                            } else {
                                            	
                                                showToast(item.name + ' is added to the Menu.', '#27ae60');
                                                openSubMenu(category);
                                            }

                                        });
                                    }

                                } else { //no category found -> create one and then save
                                    var menuitem = []
                                    menuitem.push(item)

                                    obj.push({
                                        "category": category,
                                        "items": menuitem
                                    }); //add some data
                                    json = JSON.stringify(obj); //convert it back to json
                                    fs.writeFile('./data/static/mastermenu.json', json, 'utf8', (err) => {
                                        if (err) {
                                            showToast('System Error: Unable to save Menu data. Please contact Accelerate Support.', '#e74c3c');
                                        } else {
                                            showToast(item.name + ' is added to the Menu.', '#27ae60');
                                            openSubMenu(category);
                                        }
                                    });
                                }

                            }

                        }
                    });
                } else {
                    //var itemjson = JSON.stringify(item);
                    var menuitem = []
                    menuitem.push(item)
                    obj.push({
                        "category": category,
                        "items": menuitem
                    });
                    var json = JSON.stringify(obj);
                    fs.writeFile('./data/static/mastermenu.json', json, 'utf8', (err) => {
                        if (err) {
                            showToast('System Error: Unable to save Menu data. Please contact Accelerate Support.', '#e74c3c');
                        } else {
                            showToast(item.name + ' is added to the Menu.', '#27ae60');
                            openSubMenu(category);
                        }
                    });
                }

                /* end of save*/

            }

        });

    } else {
        showToast('System Error: Failed to read Menu data. Could not create an Item Code. Please contact Accelerate Support.', '#e74c3c');
    }
}




function readNewItem(category){
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
	var response = validateMenuItem(item);

	if(response.status){
		item.isAvailable = true;
		saveItemToFile(category, item, false);
		document.getElementById("newMenuItemModal").style.display = 'none';
	}
	else{
		showToast('Warning: '+response.error, '#e67e22');
	}
}

/*read and validate form with edited item details*/
function reviewItemPrice(category){
	var item = {};
	item.name = document.getElementById("item_main_name").value;
	item.price = document.getElementById("item_main_price").value;
	item.code = document.getElementById("item_main_code_secret").value;

		var custom = [];
		var i = 1;
		while($("#edit_choiceName_"+i).length != 0){
			custom.push({'customName': $("#edit_choiceName_"+i).val(), 'customPrice': $("#edit_choicePrice_"+i).val()});
			i++;
		}

		item.customOptions = custom;	

 		custom.length > 0 ? item.isCustom = true : item.isCustom = false;

	/* VALIDATE BEFORE ADDING TO DATA FILE */
	var response = validateMenuItem(item);

	if(response.status){
		item.isAvailable = true;
		saveItemToFile(category, item, true);
		document.getElementById("editMenuItemPriceModal").style.display = 'none';
	}
	else{
		showToast('Warning: '+response.error, '#e67e22');
	}
}


/* add new category */
function addCategory() {  

	var name = document.getElementById("add_new_category_name").value;

	if(name == ''){
		showToast('Warning: Category Name is invalid. Please set a name.', '#e67e22');
		return ''
	}


      //Check if file exists
      if(fs.existsSync('./data/static/menuCategories.json')) {
         fs.readFile('./data/static/menuCategories.json', 'utf8', function readFileCallback(err, data){
       if (err){
           showToast('System Error: Unable to read Categories data. Please contact Accelerate Support.', '#e74c3c');
       } else {
         if(data==""){
            obj = []
            obj.push(name); //add some data
            json = JSON.stringify(obj);
            fs.writeFile('./data/static/menuCategories.json', json, 'utf8', (err) => {
                if(err){
                  showToast('System Error: Unable to save Categories data. Please contact Accelerate Support.', '#e74c3c');
              }
              else{

                fetchAllCategories(); //refresh the list
                hideNewMenuCategory();
                openSubMenu(name);

              }
            });
         }
         else{
             flag=0;
             if(data == ''){ data = '[]'; }
             obj = JSON.parse(data);
             for (var i=0; i<obj.length; i++) {
               if (obj[i] == name){
                  flag=1;
                  break;
               }
             }
             if(flag==1){
               showToast('Warning: Category already exists. Please choose a different name.', '#e67e22');
             }
             else{
                obj.push(name);
                json = JSON.stringify(obj);
                fs.writeFile('./data/static/menuCategories.json', json, 'utf8', (err) => {
                     if(err){
                        showToast('System Error: Unable to save Categories data. Please contact Accelerate Support.', '#e74c3c');
                    }
		            else{

		                fetchAllCategories(); //refresh the list
		                hideNewMenuCategory();
		                openSubMenu(name);
		              	
		              }
                  });  

             }
                 
         }
          
   }});
      } else {
         obj.push(name);
         fs.writeFile('./data/static/menuCategories.json', obj, 'utf8', (err) => {
            if(err){
               showToast('System Error: Unable to save Categories data. Please contact Accelerate Support.', '#e74c3c');
           }
           else{
 		                fetchAllCategories(); //refresh the list
		                hideNewMenuCategory();
		                openSubMenu(name);          	
           }
         });
      }
  
}


/* delete items in a given category */
function deleteCategoryFromMaster(menuCategory){

		if(fs.existsSync('./data/static/mastermenu.json')) {
	      fs.readFile('./data/static/mastermenu.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to read Categories data. Please contact Accelerate Support.', '#e74c3c');
	    } else {
	    	if(data == ''){ data = '[]'; }
	          var mastermenu = JSON.parse(data); 
				for (var i=0; i<mastermenu.length; i++){

					if(menuCategory == mastermenu[i].category){
						mastermenu.splice(i,1);
						break;
					}

				}
		       
		       var newjson = JSON.stringify(mastermenu);
		       fs.writeFile('./data/static/mastermenu.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to save Categories data. Please contact Accelerate Support.', '#e74c3c');
		         }
		         fetchAllCategories();
		       }); 

		}
		});
	    } else {
	      showToast('System Error: Unable to save Categories data. Please contact Accelerate Support.', '#e74c3c');
	    }

}


/* delete a category */
function deleteCategory(name) {  

	/* delete from cateogry list and delete all the entries from master menu as well */

   //Check if file exists
   if(fs.existsSync('./data/static/menuCategories.json')) {
       fs.readFile('./data/static/menuCategories.json', 'utf8', function readFileCallback(err, data){
       if (err){
           showToast('System Error: Unable to read Categories data. Please contact Accelerate Support.', '#e74c3c');
       } else {
       	if(data == ''){ data = '[]'; }
       var obj = JSON.parse(data); //now it an object
       //console.log(obj.length)
       for (var i=0; i<obj.length; i++) {  
         if (obj[i] == name){
            obj.splice(i,1);
            break;
         }
       }
       var newjson = JSON.stringify(obj);
       fs.writeFile('./data/static/menuCategories.json', newjson, 'utf8', (err) => {
         if(err)
            showToast('System Error: Unable to make changes in Categories data. Please contact Accelerate Support.', '#e74c3c');

          deleteCategoryFromMaster(name);
       }); 
      }});
   } else {
      showToast('System Error: Unable to modify Categories data. Please contact Accelerate Support.', '#e74c3c');
   }

   /* on successful delete */
   document.getElementById("menuDetailsArea").style.display = "none";
   document.getElementById("categoryDeleteConfirmation").style.display = 'none';
   //location.reload();

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
		
		if(fs.existsSync('./data/static/mastermenu.json')) {
	      fs.readFile('./data/static/mastermenu.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to read Categories data. Please contact Accelerate Support.', '#e74c3c');
	    } else {
	    	if(data == ''){ data = '[]'; }
	          var mastermenu = JSON.parse(data); 
				for (var i=0; i<mastermenu.length; i++){

					if(current == mastermenu[i].category){
						mastermenu[i].category = newName;
						break;
					}

				}
		       
		       var newjson = JSON.stringify(mastermenu);
		       fs.writeFile('./data/static/mastermenu.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to save Categories data. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	fetchAllCategories();
		        	openSubMenu(newName);
		        	}
		       }); 

		}
		});
	    } else {
	      showToast('System Error: Unable to save Categories data. Please contact Accelerate Support.', '#e74c3c');
	    }
}

function saveNewCategoryName(currentName){

	var newName = document.getElementById("edit_category_new_name").value;

	if(newName == ''){
		showToast('Warning: Name is invalid. Please set a name.', '#e67e22');
		return ''
	}

	if(currentName != newName){ /* replace category name*/
		   //Check if file exists
		   if(fs.existsSync('./data/static/menuCategories.json')) {
		       fs.readFile('./data/static/menuCategories.json', 'utf8', function readFileCallback(err, data){
		       if (err){
		           showToast('System Error: Unable to read Categories data. Please contact Accelerate Support.', '#e74c3c');
		       } else {
		       	if(data == ''){ data = '[]'; }
		       var obj = JSON.parse(data); //now it an object
		       var locatedPointer = '';

		       for (var i=0; i<obj.length; i++) { 
		       	 /*check if new name exists*/
		       	 if(obj[i] == newName){
		       	 	showToast('Warning: Name already exists. Please choose a different name.', '#e67e22');
		       	 	return '';
		       	 }

		       	 /*find the match for name change*/ 
		         if (obj[i] == currentName && locatedPointer == ''){
		         	locatedPointer = i;
		         }
		       }

		       //Change name to new name
		       obj[locatedPointer] = newName;

		       var newjson = JSON.stringify(obj);
		       fs.writeFile('./data/static/menuCategories.json', newjson, 'utf8', (err) => {
		         if(err){


		            showToast('System Error: Unable to save Categories data. Please contact Accelerate Support.', '#e74c3c');
		        }else{
		          	renameCategoryFromMaster(currentName, newName);
		          }
		       }); 
		      }});
		   } else {
		      showToast('System Error: Unable to save Categories data. Please contact Accelerate Support.', '#e74c3c');
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

//showToast('Hello from Abhijith', 'blue');


