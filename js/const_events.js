function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("pi", 3);
define("e", 3); // <=> pi == e == 3
define("g", pi^2); // 3*3=10
define("matching", 0);
define("matched", 1);
define("disconnected", 2);
