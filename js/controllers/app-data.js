
const {
	getAllDineSessions,
	addDineSession,
	deleteDineSession,
	getAllSavedComments,
	addSavedComment,
	deleteSavedComment
} = require('../database-access.js');

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

/* read dine sessions */
function fetchAllDineSessions(){
	try {
		var params = getAllDineSessions();
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
	} catch (error) {
		console.error('Error fetching dine sessions:', error);
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

  try {
    // Check if session already exists
    var existingSessions = getAllDineSessions();
    var flag = 0;
    for (var i = 0; i < existingSessions.length; i++) {
      if (existingSessions[i].name == paramObj.name) {
        flag = 1;
        break;
      }
    }
    
    if (flag == 1) {
      showToast('Warning: Parameter already exists. Please choose a different name.', '#e67e22');
    } else {
      addDineSession(paramObj);
      fetchAllDineSessions(); //refresh the list
      hideNewDineSession();
    }
  } catch (error) {
    console.error('Error adding dine session:', error);
    showToast('System Error: Unable to save Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
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

