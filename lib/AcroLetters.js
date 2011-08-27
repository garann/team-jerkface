const alpha = [
    't','t','t','t','t','t','t','t','t','t','t','t','t','t','t','t',
    'o','o','o','o','o','o','o','o','o','o','o','o',
    'a','a','a','a','a','a','a','a','a','a','a',
    'w','w','w','w','w','w','w','w','w','w',
    'b','b','b','b','b','b','b','b','b',
    'c','c','c','c','c','c','c','c',
    'd','d','d','d','d','d','d',
    's','s','s','s','s','s',
    'f','f','f','f','f','f',
    'm','m','m','m','m',
    'r','r','r','r',
    'h','h','h','h',
    'i','i','i','i',
    'y','y','y',
    'e','e','e',
    'g','g','g',
    'l','l',
    'n','n',
    'u','u',
    'j',
    'k',
    'p',
    'v',
    'x',
    'z',
    'r',
    'q'
];

var AcroLetters = function() {
}

AcroLetters.prototype.fetch = function() {
    var acroSize = randomFromTo(5, 7);
    var acro = "";

    while(acro.length < acroSize) {
        //acro += alpha[randomFromTo(0, (alpha.length - 1))];
        var next = alpha[randomFromTo(0, (alpha.length - 1))];
        if (acro.length > 0) {
            if (acro.indexOf(next) == -1) { // no repeating
                acro += next;
            }
        } else {
            acro += next;
        }
    }
    return acro;
}

var randomFromTo = function(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
}

exports.AcroLetters = AcroLetters;