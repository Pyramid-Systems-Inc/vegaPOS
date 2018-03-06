function renderKOT() {

    var temp = '';
    dirname = './data/KOT'
    fs.readdir(dirname, function(err, filenames) {
        if (err) {
            console.log(err);
            return;
        }

        filenames.forEach(function(filename) {
            console.log(filename)
            fs.readFile(dirname + '/' + filename, 'utf-8', function(err, data) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    var kot = JSON.parse(data);
                    var i = 0;
                    var fullKOT = "";
                    var begKOT = "";
                    var itemsInCart = "";
                    var items = "";
                    begKOT = '<li> <a href="#"> <h2>' + kot.KOTNumber + ' <tag class="tableName">'+kot.table+'</tag></h2><div class="itemList"> <table>';
                    while (i < kot.cart.length) {
                        itemsInCart = itemsInCart + '<tr> <td class="name">' + kot.cart[i].name + '</td> <td class="price">x ' + kot.cart[i].qty + '</td> </tr>';
                        i++;
                    }
                    items = begKOT + itemsInCart + '</table> </div><more class="more">More Items</more> <tag class="bottomTag"> <p class="tagSteward">' + kot.customerName + '</p> <p class="tagUpdate">First KOT Printed 10 mins ago</p> </tag> </a>';
                    fullKOT = fullKOT + items + '</li>';
                    finalRender(fullKOT)
                }

            });
        });
        

    });
}

function finalRender(fullKOT) {
    document.getElementById("fullKOT").innerHTML = document.getElementById("fullKOT").innerHTML + fullKOT;
}