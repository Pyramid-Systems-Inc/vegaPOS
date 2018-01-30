

function openEditUserModal(){

	document.getElementById("newUserModal").style.display = "block";

} 

function closeEditUserModal(){

	document.getElementById("newUserModal").style.display = "none";

} 


function openNewUser(){
	
	document.getElementById("newUserArea").style.display = "block";
	document.getElementById("openNewUserButton").style.display = "none";
}

function hideNewUser(){
	
	document.getElementById("newUserArea").style.display = "none";
	document.getElementById("openNewUserButton").style.display = "block";
}