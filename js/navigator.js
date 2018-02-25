
const settings = require('electron-settings')

let $ = require('jquery');

document.body.addEventListener('click', (event) => {

	console.log('Click Triggered... ')
  if (event.target.dataset.section) {
    handleSectionTrigger(event)
  } else if (event.target.dataset.modal) {
    handleModalTrigger(event)
  } else if (event.target.classList.contains('modal-hide')) {
    hideAllModals()
  }
})

function handleSectionTrigger (event) {
  console.log('Section Triggered')
  hideAllSectionsAndDeselectButtons()

  // Highlight clicked button and show view
  event.target.classList.add('is-selected')

  // Display the current section
  const sectionId = `${event.target.dataset.section}-section`
  document.getElementById(sectionId).classList.add('is-shown')

  // Save currently active button in localStorage
  const buttonId = event.target.getAttribute('id')
  settings.set('activeSectionButtonId', buttonId)
}

function activateDefaultSection () {

 // document.getElementById('appRenderArea').innerHTML = attachView('new-orders');
}

function showMainContent () {
  document.querySelector('.js-nav').classList.add('is-shown')
  document.querySelector('.js-content').classList.add('is-shown')
}

function handleModalTrigger (event) {
  hideAllModals()
  const modalId = `${event.target.dataset.modal}-modal`
  document.getElementById(modalId).classList.add('is-shown')
}

function hideAllModals () {
  const modals = document.querySelectorAll('.modal.is-shown')
  Array.prototype.forEach.call(modals, (modal) => {
    modal.classList.remove('is-shown')
  })
  showMainContent()
}

function hideAllSectionsAndDeselectButtons () {
  const sections = document.querySelectorAll('.js-section.is-shown')
  Array.prototype.forEach.call(sections, (section) => {
    section.classList.remove('is-shown')
  })

  const buttons = document.querySelectorAll('.nav-button.is-selected')
  Array.prototype.forEach.call(buttons, (button) => {
    button.classList.remove('is-selected')
  })
}

function displayAbout () {
 // document.querySelector('#about-modal').classList.add('is-shown')
}

// Default to the view that was active the last time the app was open
const sectionId = settings.get('activeSectionButtonId')
if (sectionId) {
  showMainContent()
  const section = document.getElementById(sectionId)
  if (section) section.click()
} else {
  activateDefaultSection()
  displayAbout()
}

function fetchInitFunctions(pageName){
	switch (pageName){
		case 'new-orders':{
			renderCart();
			renderMenu();
			break;
		}
		case 'live-orders':{
			alert('FOUND')
			break;
		}
	}
}


function attachView(name){
	const links = document.querySelectorAll('link[for="'+name+'"]')

	if(links.length == 1){
		  // Import and add  page to the DOM
		  let template = links[0].import.querySelector('.task-template')
		  let clone = document.importNode(template.content, true)

		  document.querySelector('.content').innerHTML = '';
		  document.querySelector('.content').appendChild(clone);

		  fetchInitFunctions(name);


	}else{
		document.querySelector('.content').innerHTML = "Error while loading the view. Please contact Accelerate Support (support@accelerate.net.in)";
	}
}

//Default View
attachView('new-order');
