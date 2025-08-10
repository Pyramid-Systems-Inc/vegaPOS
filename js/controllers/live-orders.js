const { getAllOrders, getOrderByKotNumber, updateOrder, deleteOrder } = require('../database-access.js');

function renderKOT() {
    try {
        // Assuming orderStatus < 3 means it's a live order (not settled/cancelled)
        const liveOrders = getAllOrders().filter(o => o.order_status < 3);
        
        let fullKOT = "";
        if (liveOrders.length === 0) {
            document.getElementById("fullKOT").innerHTML = '<p style="padding: 20px; text-align: center; color: #bdc3c7;">No live orders.</p>';
            return;
        }

        liveOrders.forEach(order => {
            const orderDetails = JSON.parse(order.order_details_json);
            const cart = JSON.parse(order.cart_json);
            const extras = order.extras_json ? JSON.parse(order.extras_json) : [];
            const discount = order.discount_json ? JSON.parse(order.discount_json) : {};
            
            const kot = {
                KOTNumber: order.kot_number,
                orderDetails: orderDetails,
                table: order.table_name,
                customerName: order.customer_name,
                customerMobile: order.customer_mobile,
                stewardName: order.steward_name,
                stewardCode: order.steward_code,
                orderStatus: order.order_status,
                date: order.date,
                timePunch: order.time_punch,
                timeKOT: order.time_kot,
                timeBill: order.time_bill,
                timeSettle: order.time_settle,
                cart: cart,
                specialRemarks: order.special_remarks,
                extras: extras,
                discount: discount
            };

            let i = 0;
            let itemsInCart = "";
            
            const begKOT = `<li> <a href="#" onclick="pushToEditKOT('${encodeURI(JSON.stringify(kot))}')"> <h2>${kot.KOTNumber} <tag class="tableName">${kot.table}</tag></h2><div class="itemList"> <table>`;
            
            while (i < kot.cart.length) {
                itemsInCart += `<tr> <td class="name">${(kot.cart[i].isCustom ? kot.cart[i].name + ' (' + kot.cart[i].variant + ')' : kot.cart[i].name)}</td> <td class="price">x ${kot.cart[i].qty}</td> </tr>`;
                i++;
            }
            
            const timeAgo = moment(kot.timePunch, "HHmm").fromNow();

            const items = `${begKOT}${itemsInCart}</table> </div>${(i > 6 ? '<more class="more">More Items</more>' : '')}<tag class="bottomTag"> <p class="tagSteward">${kot.customerName || 'Guest'}</p> <p class="tagUpdate">${timeAgo}</p> </tag> </a>`;
            fullKOT += `${items}</li>`;
        });
        
        document.getElementById("fullKOT").innerHTML = fullKOT;
    } catch (error) {
        console.error('Error rendering KOTs:', error);
        showToast('System Error: Unable to load Live Orders. Please contact Accelerate Support.', '#e74c3c');
    }
}

/*Add to edit KOT*/
function pushToEditKOT(encodedKOT){
    
    var kot = JSON.parse(decodeURI(encodedKOT));
   
    if(window.localStorage.edit_KOT_originalCopy && window.localStorage.edit_KOT_originalCopy != ''){

        var alreadyEditingKOT = JSON.parse(window.localStorage.edit_KOT_originalCopy);
        if(alreadyEditingKOT.KOTNumber == kot.KOTNumber)//if thats the same order, neglect.
        {
            renderPage('new-order', 'Editing Order');
            return '';
        }
        else{
            showToast('Warning! There is already an active order being modified. Please complete it to continue.', '#e67e22');
            return '';
        }
    }

    if(window.localStorage.zaitoon_cart && window.localStorage.zaitoon_cart != '' && JSON.parse(window.localStorage.zaitoon_cart).length > 0){
        showToast('Warning! There is a new order being punched. Please complete it to continue.', '#e67e22');
        
        document.getElementById("overWriteCurrentOrderModal").style.display = 'block';
        document.getElementById("overWriteCurrentOrderModalConsent").innerHTML = '<button type="button" class="btn btn-default" onclick="overWriteCurrentOrderModalClose()" style="float: left">Cancel and Complete the New Order</button>'+
                                                '<button type="button" class="btn btn-danger" onclick="overWriteCurrentOrder(\''+encodedKOT+'\')">Proceed to Over Write</button>';
        return; // Wait for user action
    }    

    overWriteCurrentOrder(encodedKOT);
}

function overWriteCurrentOrderModalClose(){
    document.getElementById("overWriteCurrentOrderModal").style.display = 'none';  
}

function overWriteCurrentOrder(encodedKOT){
    var kot = JSON.parse(decodeURI(encodedKOT));

    var customerInfo = {};
    customerInfo.name = kot.customerName;
    customerInfo.mobile = kot.customerMobile;
    customerInfo.mappedAddress = kot.table;
    customerInfo.mode = kot.orderDetails.mode;
    customerInfo.modeType = kot.orderDetails.modeType;
    customerInfo.reference = kot.orderDetails.reference;

    //Pending new order will be removed off the cart.
    window.localStorage.zaitoon_cart = JSON.stringify(kot.cart);
    window.localStorage.customerData = JSON.stringify(customerInfo);
    window.localStorage.edit_KOT_originalCopy = decodeURI(encodedKOT);
    renderPage('new-order', 'Editing Order');
    overWriteCurrentOrderModalClose();
}