function vaguize(timestamp) {
    var now = new Date();
    var date = new Date(timestamp);
    var difference = (now.getTime() - parseInt(timestamp)) / 1000;

    if (date.getFullYear() != now.getFullYear()) {
        return strftime('on %e %b %Y', date);
    } else if (difference > 86400*7) { // more than one week ago
        return strftime('on %e %b', date);
    } else if (date.getDate() !== now.getDate()) {
        return strftime('on %A', date);
    } else {
        return strftime('today at %H:%M', date);
    }
}
