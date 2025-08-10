const { getAllCategories, getMenuItemsByCategory, updateMenuItemByCode } = require('../database-access.js');
const fs = require('fs');

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

/* read categories */
function fetchAllCategoriesPhotos(){
    try {
        const categories = getAllCategories();
        let categoryTag = '';

        if (categories.length > 0) {
            categories.forEach(category => {
                categoryTag += `<tr class="subMenuList" onclick="openSubMenuPhotos('${category.name}')"><td>${category.name}</td></tr>`;
            });
        } else {
            categoryTag = '<p style="color: #bdc3c7">No Category added yet.</p>';
        }

        document.getElementById("categoryAreaPhotos").innerHTML = categoryTag;
    } catch (error) {
        console.error('Error fetching categories for photos:', error);
        showToast('System Error: Unable to read Category data. Please contact Accelerate Support.', '#e74c3c');
    }
}

function openSubMenuPhotos(categoryName){	
    try {
        const menuItems = getMenuItemsByCategory(categoryName);
        let itemsInSubMenu = "";
        
        if (menuItems.length > 0) {
            menuItems.forEach(item => {
                const temp = encodeURI(JSON.stringify(item));
                if(item.is_photo){
                    itemsInSubMenu += `<button onclick="openPhotoOptions('${item.name}', '${item.code}', 'PHOTO_AVAILABLE', '${categoryName}')" type="button" class="btn btn-both btn-flat product"><span class="bg-img" style="background: none !important;"><img src="data/photos/menu/${item.code}.jpg" alt="${item.name}" style="width: 110px; height: 110px;"></span><span><span>${item.name}</span></span></button>`;
                }
                else{
                    itemsInSubMenu += `<button onclick="openPhotoOptions('${item.name}', '${item.code}', 'PHOTO_NOT_AVAILABLE', '${categoryName}')" type="button" class="btn btn-both btn-flat product"><span class="bg-img"><div id="itemImage">${getImageCode(item.name)}</div></span><span><span>${item.name}</span></span></button>`;
                }
            });
        }
        
        document.getElementById("item-list").innerHTML = itemsInSubMenu;
        document.getElementById("posSubMenuTitle").innerHTML = categoryName;

        if(!itemsInSubMenu){
            document.getElementById("item-list").innerHTML = `<p style="font-size: 18px; color: #bfbfbf; padding: 20px 0;">No available items in ${categoryName}</p>`;
        }
    } catch (error) {
        console.error('Error fetching menu items for photos:', error);
        showToast('System Error: Unable to read Menu data. Please contact Accelerate Support.', '#e74c3c');
    }

	document.getElementById("menuDetailsAreaPhotos").style.display = "block";
}


function openPhotoOptions(name, item, type, category){
	if(type == 'PHOTO_AVAILABLE'){ /* Photo Already Uploaded */
		document.getElementById("photoOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader"><b>'+name+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButtonBig" onclick="loadPhotoCropper(\''+item+'\', \''+name+'\', \''+category+'\', 1)">Change Photo</button> '+
                  '<button class="btn btn-danger tableOptionsButtonBig" onclick="removeItemPhoto(\''+item+'\', \''+category+'\')">Remove Photo</button> '+ 
                  '<button class="btn btn-default tableOptionsButton" onclick="hidePhotoOptions()">Close</button> ';
	}
	else if(type == 'PHOTO_NOT_AVAILABLE'){ /* No photo */
		document.getElementById("photoOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader"><b>'+name+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButtonBig" onclick="loadPhotoCropper(\''+item+'\', \''+name+'\', \''+category+'\', 0)">Upload Photo</button> '+ 
                  '<button class="btn btn-default tableOptionsButton" onclick="hidePhotoOptions()">Close</button> ';
	}

	document.getElementById("photoOptionsModal").style.display ='block';
}

function hidePhotoOptions(){
	document.getElementById("photoOptionsModal").style.display ='none';
}


function removeItemPhoto(item, category){

    if(fs.existsSync('./data/photos/menu/'+item+'.jpg')) {
	    fs.unlinkSync('./data/photos/menu/'+item+'.jpg')
	}

	changePhotoFlagInMenu(item, 5, category);
	hidePhotoOptions();
}

//Photo Cropper
function loadPhotoCropper(code, name, category, changeFlag){

	hidePhotoOptions();
	document.getElementById("photoEditModalTitle").innerHTML = 'Choose Photo for <b>'+name+'</b>';
	document.getElementById("photoCropperModal").style.display = 'block';

      var image;
      
      var cropBoxData;
      var canvasData;
      var cropper;

      var resultImage;

	    var handleFileSelect = function(input) {

	    	document.getElementById("uploadedItemImageContainer").style.display = 'block';

	      		var file = input.files[0];
	      		var reader = new FileReader();

	      		reader.onload = function (evt) {
	          		resultImage = evt.target.result;
	          		$('#uploadedItemImage').attr('src', evt.target.result);
		          	image = document.getElementById('uploadedItemImage');

				      cropper = new Cropper(image, {
				      	  aspectRatio: 1 / 1,
						  autoCropArea: 0.8,
						  scalable: true,
				          ready: function () {
				            cropper.setCropBoxData(cropBoxData).setCanvasData(canvasData);
				          }
				      }); 
		  
	      		};
	      
	      		reader.readAsDataURL(file);
	    };


	    //File Upload
	    $("#itemPhotoFileInput").change(function(){
	        handleFileSelect(this);
	    });

	    //Saved Cropped Image
      	$("#cropUploadedImageButton").click(function(){
	        cropBoxData = cropper.getCropBoxData();
	        canvasData = cropper.getCroppedCanvas({
				  width: 180,
				  height: 180,
				  fillColor: '#fff',
				  imageSmoothingEnabled: false,
				  imageSmoothingQuality: 'high',
				});

	        

	        var newFile = canvasData.toDataURL();
	        cropper.destroy();

	        var data = newFile.replace(/^data:image\/\w+;base64,/, "");
			var buf = new Buffer(data, 'base64');
			fs.writeFile('./data/photos/menu/'+code+'.jpg', buf, (err) => {
              if(err){
				showToast('Oops! The photo was not uploaded.', '#e74c3c');
              }
              else{
              	showToast('Photo saved Successfully', '#27ae60');
              	changePhotoFlagInMenu(code, changeFlag, category);
              	hidePhotoCropper();
              }
              	 
           });


		});

}

function hidePhotoCropper(){
	document.getElementById("uploadedItemImageContainer").style.display = 'none';
	document.getElementById("photoCropperModal").style.display = 'none';
}

function changePhotoFlagInMenu(code, changeFlag, optionalCategory){

		var optedFlag = false;

		if(changeFlag === 1){ //Changing Photo
			optedFlag = true;
		}
		else if(changeFlag === 0){ //Uploading New Photo
			optedFlag = true;
		}
		else if(changeFlag === 5){ //Removing Existing Photo
			optedFlag = false;
		}
		
        try {
            updateMenuItemByCode(code, { is_photo: optedFlag ? 1 : 0 });

            if(optionalCategory){
                openSubMenuPhotos(optionalCategory);
            }
            
        } catch (error) {
            console.error('Error updating photo flag in menu:', error);
            showToast('System Error: Failed to make changes in Menu data. Please contact Accelerate Support.', '#e74c3c');
        }
}