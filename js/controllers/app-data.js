
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
  try {
    deleteDineSession(name);
    fetchAllDineSessions();
    cancelOtherDeleteConfirmation();
  } catch (error) {
    console.error('Error deleting dine session:', error);
    showToast('System Error: Unable to make changes in Dine Sessions data. Please contact Accelerate Support.', '#e74c3c');
  }
}



/* read saved comments */
function fetchAllSavedComments(){
	try {
		var modes = getAllSavedComments();
		modes.sort(); //alphabetical sorting
		var modesTag = '';

		for (var i=0; i<modes.length; i++){
			modesTag = modesTag + '<button type="button" style="margin-right: 5px" class="btn btn-outline" onclick="deleteSavedCommentConfirm(\''+modes[i]+'\')">'+modes[i]+'</button>';
		}

		if(!modesTag)
			document.getElementById("savedCommentsInfo").innerHTML = '<p style="color: #bdc3c7">No comments added yet.</p>';
		else
			document.getElementById("savedCommentsInfo").innerHTML = modesTag;
	} catch (error) {
		console.error('Error fetching saved comments:', error);
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

  try {
    // Check if comment already exists
    var existingComments = getAllSavedComments();
    var flag = 0;
    for (var i = 0; i < existingComments.length; i++) {
      if (existingComments[i] == commentName) {
        flag = 1;
        break;
      }
    }
    
    if (flag == 1) {
      showToast('Warning: Comment already exists. Please add a different comment.', '#e67e22');
    } else {
      addSavedComment(commentName);
      fetchAllSavedComments(); //refresh the list
      hideNewSavedComment();
    }
  } catch (error) {
    console.error('Error adding saved comment:', error);
    showToast('System Error: Unable to save Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
  }
}

function deleteSavedCommentConfirm(name){
	openOtherDeleteConfirmation(name, 'deleteSavedComment');
}

/* delete a comment */
function deleteSavedComment(name) {
  try {
    deleteSavedComment(name);
    fetchAllSavedComments();
    cancelOtherDeleteConfirmation();
  } catch (error) {
    console.error('Error deleting saved comment:', error);
    showToast('System Error: Unable to make changes in Saved Comments data. Please contact Accelerate Support.', '#e74c3c');
  }
}

