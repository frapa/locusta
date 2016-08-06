function post(action, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/' + action + '/', true);

    //Send the proper header information along with the request
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    var params = [
        'user=' + locusta.username,
        'password=' + locusta.password
    ];
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            params.push(key + '=' + data[key])
         }
    }

    xhr.onload = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            if (xhr.status == 200){
                callback(JSON.parse(xhr.responseText));
            } else {
                callback({type: 'error', msg: 'Bad request.'});
            }
        }
    };

    xhr.send(params.join('&'));
}
