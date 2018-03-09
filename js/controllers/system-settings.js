
function openNewSavedComment(){
	document.getElementById("newSavedCommentArea").style.display = "block";
	document.getElementById("openNewSavedCommentButton").style.display = "none";
}

function hideNewSavedComment(){
	
	document.getElementById("newSavedCommentArea").style.display = "none";
	document.getElementById("openNewSavedCommentButton").style.display = "block";
}


function openNewDineSession(){
	document.getElementById("newDineSessionArea").style.display = "block";
	document.getElementById("openNewSessionButton").style.display = "none";
}

function hideNewDineSession(){
	
	document.getElementById("newDineSessionArea").style.display = "none";
	document.getElementById("openNewSessionButton").style.display = "block";
}

function openOtherSettings(id){
	
	/*Tweak - Hide all */
	$( "#detailsDisplayOtherSettings" ).children().css( "display", "none" );
	$( "#detailsNewOtherSettings" ).children().css( "display", "none" );
	document.getElementById("openNewSessionButton").style.display = "block";
	document.getElementById("openNewSavedCommentButton").style.display = "block";

	document.getElementById(id).style.display = "block";

	switch(id){
		case "dineSessions":{
			fetchAllDineSessions();
			break;
		}
		case "savedComments":{
			fetchAllSavedComments();
			break;
		}	
    case "personalOptions":{
      renderPersonalisations();
      break;
    } 
    case "keyboardShortcuts":{
 
      break;
    } 
    case "systemSettings":{
 
      break;
    }  
    case "resetOptions":{
 
      break;
    }            
	}
}


function openOtherDeleteConfirmation(type, functionName){
	document.getElementById("settingsDeleteConfirmationConsent").innerHTML = '<button type="button" class="btn btn-default" onclick="cancelOtherDeleteConfirmation()" style="float: left">Cancel</button>'+
                  							'<button type="button" class="btn btn-danger" onclick="'+functionName+'(\''+type+'\')">Delete</button>';

	document.getElementById("settingsDeleteConfirmationText").innerHTML = 'Are you sure want to delete <b>'+type+'</b>?';
	document.getElementById("settingsDeleteConfirmation").style.display = 'block';
}

function cancelOtherDeleteConfirmation(){
	document.getElementById("settingsDeleteConfirmation").style.display = 'none';
}


/*read personalisation data*/
function renderPersonalisations(){

    if(fs.existsSync('./data/static/personalisations.json')) {
        fs.readFile('./data/static/personalisations.json', 'utf8', function readFileCallback(err, data){
      if (err){
          showToast('System Error: Unable to read Personalisations data. Please contact Accelerate Support.', '#e74c3c');
      } else {

          if(data == ''){ data = '[]'; }

              var params = JSON.parse(data);

          var isScreenIdleEnabled = false;

          //Render
          for (var i=0; i<params.length; i++){
            if(params[i].name == "theme"){
              /*TWEAK*/
              var themeName = params[i].value;
              themeName = themeName.replace(/skin-/g,"");
              themeName = themeName.replace(/-/g," ");
              if((themeName.split(" ")).length == 1){
                themeName = themeName+' Dark';
              }

              document.getElementById("title_"+params[i].value).innerHTML = themeName+'<tag class="selectThemeTitleDefaulted"> <i style="color: #2ecc71" class="fa fa-check-circle"></i></tag>';
            }
            else if(params[i].name == "menuImages"){
              document.getElementById("personalisationEditImage").value = params[i].value;
            }
            else if(params[i].name == "virtualKeyboard"){
              document.getElementById("personalisationEditKeyboard").value = params[i].value;
            }
            else if(params[i].name == "screenLockOptions"){
              if(params[i].value == 'SCREENSAVER' || params[i].value == 'LOCKSCREEN'){
                document.getElementById("personalisationInactiveScreen").value = params[i].value;
                isScreenIdleEnabled = true;
              }
              else{
                document.getElementById("personalisationInactiveScreen").value = 'NONE';
                isScreenIdleEnabled = false;
              }
              
            }
            else if(params[i].name == "screenLockDuration"){
              if(isScreenIdleEnabled){
                document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'table-row';
                document.getElementById("personalisationIdleDuration").value = params[i].value;
              }  
              else{
                document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'none';
                document.getElementById("personalisationIdleDuration").value = params[i].value;
              }    
            }                        
          }

    }
    });
      } else {
        showToast('System Error: Unable to read Personalisations data. Please contact Accelerate Support.', '#e74c3c');
      }   
}

function changePersonalisationFile(type, changedValue){


    if(fs.existsSync('./data/static/personalisations.json')) {
        fs.readFile('./data/static/personalisations.json', 'utf8', function readFileCallback(err, data){
      if (err){
          showToast('System Error: Unable to modify Personalisations data. Please contact Accelerate Support.', '#e74c3c');
      } else {

          if(data == ''){ data = '[]'; }

              var params = JSON.parse(data);


                  for (var i=0; i<params.length; i++){
                    if(params[i].name == type){
                      params[i].value = changedValue;
                      break;
                    }
                  }

           var newjson = JSON.stringify(params);
           fs.writeFile('./data/static/personalisations.json', newjson, 'utf8', (err) => {
             if(err){
                showToast('System Error: Unable to save Personalisations data. Please contact Accelerate Support.', '#e74c3c');
               }
           }); 

    }
    });
      } else {
        showToast('System Error: Unable to modify Personalisations data. Please contact Accelerate Support.', '#e74c3c');
      }   
 
}

/*actions*/
function changePersonalisationTheme(themeName){

  //document.getElementById("mainAppBody").classList;
  var tempList = document.getElementById("mainAppBody").classList.toString();
  tempList = tempList.split(" ");

  tempList[0] = themeName;

  tempList = tempList.toString();
  tempList = tempList.replace (/,/g, " ");

  document.getElementById("mainAppBody").className = tempList;

  //Tweak
  var x = document.getElementsByClassName("selectThemeTitleDefaulted");
  var n = 0;
  while(x[n]){
    $(".selectThemeTitleDefaulted").html("");
    n++;
  }

  document.getElementById("title_"+themeName).innerHTML += '<tag class="selectThemeTitleDefaulted"> <i style="color: #2ecc71" class="fa fa-check-circle"></i></tag>';
            

  //Update
  window.localStorage.appCustomSettings_Theme = themeName;
  changePersonalisationFile("theme", themeName);

  showToast('Theme changed successfully', '#27ae60');
}




function changePersonalisationImage(){
  var optName = document.getElementById("personalisationEditImage").value == 'YES'? true: false;

  if(optName){
    showToast('Photos will be displayed in the Menu', '#27ae60');
  }
  else{
    showToast('Photos has been disabled in the Menu', '#27ae60');
  }

  //Update
  window.localStorage.appCustomSettings_ImageDisplay = optName;
  changePersonalisationFile("menuImages", document.getElementById("personalisationEditImage").value);
}


function changePersonalisationLock(){
  var optName = document.getElementById("personalisationInactiveScreen").value;

  if(optName == 'SCREENSAVER'){
    showToast('Screen Saver will be displayed when the Screen is idle', '#27ae60');
    document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'table-row';
  }
  else if(optName == 'LOCKSCREEN'){
    showToast('Screen will be Locked when the Screen is idle', '#27ae60');
    document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'table-row';
  }
  else{
    optName = '';
    document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'none';
  }


  //Update
  window.localStorage.appCustomSettings_InactivityEnabled = optName;
  changePersonalisationFile("screenLockOptions", optName);

  initScreenSaver();
}


function changePersonalisationIdleDuration(){
  var optName = document.getElementById("personalisationIdleDuration").value;

  //Update
  window.localStorage.appCustomSettings_InactivityScreenDelay = optName;
  changePersonalisationFile("screenLockDuration", optName);

  initScreenSaver();
}


function changePersonalisationKeyboard(){
  var optName = parseFloat(document.getElementById("personalisationEditKeyboard").value);


  if(optName == 0){
    showToast('Virtual Keyboard disabled', '#27ae60');
  }
  else if(optName == 1){
    showToast('Virtual Keyboard gets activated on Input only', '#27ae60');
  }
  else if(optName == 2){
    showToast('Virtual Keyboard is enabled', '#27ae60');
  }


  //Update
  window.localStorage.appCustomSettings_Keyboard = optName;
  changePersonalisationFile("virtualKeyboard", optName);
}




/* read dine sessions */
function fetchAllDineSessions(){

		if(fs.existsSync('./data/static/dinesessions.json')) {
	      fs.readFile('./data/static/dinesessions.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to read Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
	    } else {

	    		if(data == ''){ data = '[]'; }

	          	var params = JSON.parse(data);
	          	params.sort(); //alphabetical sorting 
	          	var paramsTag = '';

				for (var i=0; i<params.length; i++){
					paramsTag = paramsTag + '<tr role="row"> <td>#'+(i+1)+'</td> <td>'+params[i].name+'</td> <td>'+moment(params[i].startTime,"HHmm").format("HH:mm a")+'</td> <td>'+moment(params[i].endTime,"HHmm").format("hh:mm a")+'</td> <td onclick="deleteDineSessionConfirm(\''+params[i].name+'\')"> <i class="fa fa-trash-o"></i> </td> </tr>';
				}

				if(!paramsTag)
					document.getElementById("dineSessionsTable").innerHTML = '<p style="color: #bdc3c7">No sessions added yet.</p>';
				else
					document.getElementById("dineSessionsTable").innerHTML = '<thead style="background: #f4f4f4;"> <tr> <th style="text-align: left"></th> <th style="text-align: left">Session</th> <th style="text-align: left">Time From</th> <th style="text-align: left">Time To</th> <th style="text-align: left"></th> </tr> </thead>'+
																	'<tbody>'+paramsTag+'</tbody>';
		}
		});
	    } else {
	      showToast('System Error: Unable to read Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
	    }	
}


/* add new dine session */
function addDineSession() {  

	var paramObj = {};
	paramObj.name = document.getElementById("add_new_dineSession_name").value;
	paramObj.startTime = document.getElementById("add_new_dineSession_from").value;
  paramObj.endTime = document.getElementById("add_new_dineSession_to").value;

  paramObj.startTime = ((paramObj.startTime).toString()).replace (/:/g, "");
  paramObj.startTime = parseFloat(paramObj.startTime);

  paramObj.endTime = ((paramObj.endTime).toString()).replace (/:/g, "");
  paramObj.endTime = parseFloat(paramObj.endTime);
	
	if(paramObj.name == ''){
		showToast('Warning: Please set a name.', '#e67e22');
		return '';
	}
	else if(paramObj.startTime == '' || paramObj.endTime == ''){
		showToast('Warning: Please set Start Time and End Time', '#e67e22');
		return '';
	}
	else if(Number.isNaN(paramObj.startTime) || Number.isNaN(paramObj.endTime)){
		showToast('Warning: Invalid time value.', '#e67e22');
		return '';
	}	

  if(paramObj.endTime <= paramObj.startTime){
    showToast('Warning: End Time must be greater than Start Time', '#e67e22');
    return '';
  }

      //Check if file exists
      if(fs.existsSync('./data/static/dinesessions.json')) {
         fs.readFile('./data/static/dinesessions.json', 'utf8', function readFileCallback(err, data){
       if (err){
           showToast('System Error: Unable to read Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
       } else {
         if(data==""){
            var obj = []
            obj.push(paramObj); //add some data
            var json = JSON.stringify(obj);
            fs.writeFile('./data/static/dinesessions.json', json, 'utf8', (err) => {
                if(err){
                  showToast('System Error: Unable to save Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
              }
              else{

                fetchAllDineSessions(); //refresh the list
                hideNewDineSession();

              }
            });
         }
         else{
             var flag=0;
             if(data == ''){ data = '[]'; }
             var obj = [];
             obj = JSON.parse(data);
             for (var i=0; i<obj.length; i++) {
               if (obj[i].name == paramObj.name){
                  flag=1;
                  break;
               }
             }
             if(flag==1){
               showToast('Warning: Parameter already exists. Please choose a different name.', '#e67e22');
             }
             else{
                obj.push(paramObj);
                var json = JSON.stringify(obj);
                fs.writeFile('./data/static/dinesessions.json', json, 'utf8', (err) => {
                     if(err){
                        showToast('System Error: Unable to save Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
                    }
		            else{
			                fetchAllDineSessions(); //refresh the list
			                hideNewDineSession();
		              	
		              }
                  });  

             }
                 
         }
          
   }});
      } else {
         obj.push(paramObj);
         fs.writeFile('./data/static/dinesessions.json', obj, 'utf8', (err) => {
            if(err){
               showToast('System Error: Unable to save Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
           }
           else{
                fetchAllDineSessions(); //refresh the list
                hideNewDineSession();         	
           }
         });
      }
  
}


function deleteDineSessionConfirm(name){
	openOtherDeleteConfirmation(name, 'deleteDineSession');
}


/* delete a dine session */
function deleteDineSession(name) {  

   //Check if file exists
   if(fs.existsSync('./data/static/dinesessions.json')) {
       fs.readFile('./data/static/dinesessions.json', 'utf8', function readFileCallback(err, data){
       if (err){
           showToast('System Error: Unable to read Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
       } else {
       	if(data == ''){ data = '[]'; }
       var obj = JSON.parse(data); //now it an object
       for (var i=0; i<obj.length; i++) {  
         if (obj[i].name == name){
            obj.splice(i,1);
            break;
         }
       }
       var newjson = JSON.stringify(obj);
       fs.writeFile('./data/static/dinesessions.json', newjson, 'utf8', (err) => {
         if(err)
            showToast('System Error: Unable to make changes in Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
        
        	/* on successful delete */
   			  fetchAllDineSessions();
       }); 
      }});
   } else {
      showToast('System Error: Unable to modify Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
   }

   cancelOtherDeleteConfirmation()

}



/* read saved comments */
function fetchAllSavedComments(){

		if(fs.existsSync('./data/static/savedcomments.json')) {
	      fs.readFile('./data/static/savedcomments.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to read Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
	    } else {

	    		if(data == ''){ data = '[]'; }

	          	var modes = JSON.parse(data);
	          	modes.sort(); //alphabetical sorting 
	          	var modesTag = '';

				for (var i=0; i<modes.length; i++){
					modesTag = modesTag + '<button type="button" style="margin-right: 5px" class="btn btn-outline" onclick="deleteSavedCommentConfirm(\''+modes[i]+'\')">'+modes[i]+'</button>';
        }

				if(!modesTag)
					document.getElementById("savedCommentsInfo").innerHTML = '<p style="color: #bdc3c7">No comments added yet.</p>';
				else
					document.getElementById("savedCommentsInfo").innerHTML = modesTag;
		}
		});
	    } else {
	      showToast('System Error: Unable to read Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
	    }	
}




/* add new comment */
function addNewComment() {  

	var commentName = document.getElementById("add_new_savedComment").value;

	if(commentName == ''){
		showToast('Warning: Please set a name', '#e67e22');
		return '';
	}

     //Check if file exists
      if(fs.existsSync('./data/static/savedcomments.json')) {
         fs.readFile('./data/static/savedcomments.json', 'utf8', function readFileCallback(err, data){
       if (err){
           showToast('System Error: Unable to read Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
       } else {
         if(data==""){
            var obj = []
            obj.push(commentName); //add some data
            var json = JSON.stringify(obj);
            fs.writeFile('./data/static/savedcomments.json', json, 'utf8', (err) => {
                if(err){
                  showToast('System Error: Unable to save Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
              }
              else{

                fetchAllSavedComments(); //refresh the list
                hideNewSavedComment();

              }
            });
         }
         else{
             var flag=0;
             if(data == ''){ data = '[]'; }
             var obj = [];
             obj = JSON.parse(data);
             for (var i=0; i<obj.length; i++) {
               if (obj[i] == commentName){
                  flag=1;
                  break;
               }
             }
             if(flag==1){
               showToast('Warning: Comment already exists. Please add a different comment.', '#e67e22');
             }
             else{
                obj.push(commentName);
                var json = JSON.stringify(obj);
                fs.writeFile('./data/static/savedcomments.json', json, 'utf8', (err) => {
                     if(err){
                        showToast('System Error: Unable to save Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
                    }
		            else{
			                fetchAllSavedComments(); //refresh the list
			                hideNewSavedComment();
		              	
		              }
                  });  

             }
                 
         }
          
   }});
      } else {
         obj.push(commentName);
         fs.writeFile('./data/static/savedcomments.json', obj, 'utf8', (err) => {
            if(err){
               showToast('System Error: Unable to save Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
           }
           else{
                fetchAllSavedComments(); //refresh the list
                hideNewSavedComment();         	
           }
         });
      }
  
}

function deleteSavedCommentConfirm(name){
	openOtherDeleteConfirmation(name, 'deleteSavedComment');
}

/* delete a comment */
function deleteSavedComment(name) {  

   //Check if file exists
   if(fs.existsSync('./data/static/savedcomments.json')) {
       fs.readFile('./data/static/savedcomments.json', 'utf8', function readFileCallback(err, data){
       if (err){
           showToast('System Error: Unable to read Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
       } else {
       	if(data == ''){ data = '[]'; }
       var obj = JSON.parse(data); //now it an object
       for (var i=0; i<obj.length; i++) {  
         if (obj[i] == name){
            obj.splice(i,1);
            break;
         }
       }
       var newjson = JSON.stringify(obj);
       fs.writeFile('./data/static/savedcomments.json', newjson, 'utf8', (err) => {
         if(err)
            showToast('System Error: Unable to make changes in Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
        
        	/* on successful delete */
   			  fetchAllSavedComments();
       }); 
      }});
   } else {
      showToast('System Error: Unable to modify Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
   }

   cancelOtherDeleteConfirmation()

}

