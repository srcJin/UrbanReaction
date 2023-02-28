let appId = 'abc';
const button = document.querySelector('button');
function add(n1, n2) {
    if (n1 + n2 > 0) {
        return n1 + n2;
    }
    return;
}
function clickHandler(message) {
    // let userName = 'Max';
    console.log('Clicked! ' + message);
}
// a comment
if (button) {
    button.addEventListener('click', clickHandler.bind(null, "You're welcome!"));
}
