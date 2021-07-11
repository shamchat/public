(function(exports){

    exports.logger = function(text) {
        console.log((new Date()).getTime()+" "+text);
    }
    
    exports.makeid = function() {
        let result           = [];
        for (let i = 0; i < 16; i++) {
            result[i] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62));
        }
        return result.join('');
    };
    
    exports.getDateTime = function() {
        let date = new Date();
        let hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;
        let min  = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;
        let sec  = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;
        let day  = date.getDate();
        day = (day < 10 ? "0" : "") + day;
        return year + ":" + month + ":" + day + ", " + hour + ":" + min + ":" + sec;
    };
    
    exports.time = function() {
        return (new Date()).getTime();
    }
    
    exports.escape_html = function(text) {
      if (typeof text === 'number') return text;
      if (typeof text !== 'string') return '';
      var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    };
    
    exports.intersection = function(array1, array2) {
        return array1.filter(value => -1 !== array2.indexOf(value));
    };
    
    
    exports.mysql_escape = function(stringToEscape){
        if (stringToEscape == '') return stringToEscape;
    
        return stringToEscape
            .replace(/\\/g, "\\\\")
            .replace(/\'/g, "\\\'")
            .replace(/\"/g, "\\\"")
            .replace(/\n/g, "\\\n")
            .replace(/\r/g, "\\\r")
            .replace(/\x00/g, "\\\x00")
            .replace(/\x1a/g, "\\\x1a");
    };
    
    exports.hex_encode = function(text){
        let hex, i;
    
        let result = "";
        for (i=0; i<text.length; i++) {
            hex = text.charCodeAt(i).toString(16);
            result += ("000"+hex).slice(-4);
        }
    
        return result;
    };
    
    exports.hex_decode = function(text){
        let j;
        let hexes = text.match(/.{1,4}/g) || [];
        let back = "";
        for(j = 0; j<hexes.length; j++) {
            back += String.fromCharCode(parseInt(hexes[j], 16));
        }
    
        return back;
    }
    
    exports.hashcode = function(str) {
        var hash = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
    
    exports.dict_without_keys = function(dict, keys) {
        let new_dict = {};
        Object.keys(dict).forEach(key => {
            if (!keys.includes(key)) new_dict[key] = dict[key];
        });
        return new_dict;
    }
    
    exports.dict_with_keys = function(dict, keys) {
        let new_dict = {};
        Object.keys(dict).forEach(key => {
            if (keys.includes(key)) new_dict[key] = dict[key];
        });
        return new_dict;
    }
    
    exports.dict_has_subvalue = function(dict, key, value) {
        return Object.values(dict).some(e => e[key] == value);
    }
    
    exports.dict_merge = function(master, slave) {
        Object.keys(slave).forEach(key => master[key] = slave[key]);
    }
    
    }(typeof exports === 'undefined' ? this.utils = {} : exports));