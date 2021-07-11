
/* global jQuery */
/* global io */
/* global getQueryVariable */
/* global moment */

var REAL_VERSION = 1;
var AD_FREQ = 7;

var constants = {
	FLAG_CLEAN: 1,
	FLAG_SRP: 2,
	FLAG_EDGY: 4,

	SECTIONS: ['Clean', 'NSFW', 'Edgy'],

	DELAY_TIMEOUT: 15000
};

var delay_unsent_messages = 5 * 1000; // sec
var delay_interests_timeout = 10 * 1000;
var delay_typing_check = 1.5 * 1000;
var delay_message = 0; //1000

var suggestion_options = ['Satan', 'hit or miss', 'Tracer', 'El Barto', 'Shrek', 'Timmy Turner', 'Yuri Plisetsky', 'Yuri Katsuki', 'Viktor Nikiforov', 'Pico', 'Eiji Okumura', 'Shouto Todoroki', 'Izuku Midoriya', 'Bakugou Katsuki', 'Nagisa Hazuki', 'Rei Ryugazaki', 'Barack Obama', 'Donald J. Trump', 'Angela Merkel', 'Eugene Beady', "a lesbian", "a chair", "Santa", "Advanced AI", "Peter Parker", "meme boy", "duckduckgo", "Dinkelberg", "Jesus", "a rat", "Kirby", "xxxFunnyGuy512xxx", "God", "Gloria Gaynor", "Whitney Houston", "Robert Downey Jr.", "T-Series", "Jimmy McGill, lawyer at law", "Tuco Salamandra", "C.A.T.", "RaJEEP Tayip Erdogan", "A Communist Monk", "A blank name", "Bill Gays", "Steve Nojobs", "Chris Hansen", "A computer predator", "Wants to see the manager", "A loose cannon", "None of your business", "Trevor Phillips", "Satan himself", "Tim Cook", "EL PRESIDENT DEL LA UNIDOS ESTADOS", "David Husslehawf", "Keith Kogane", "Lance McClain", "Takashi Shirogane", "Mozzart", "Bach", "Van Gogh", "Finlandia", "Ask me anything", "Drunk! Chris Hansen", "Spongebob", "Patrick Star", "Drunk! Spongebob", "Drunk! Patrick Star", "Kim Jong Un", "Pico (clean RP)", "Kokichi Ouma", "Hifumi Yamada", "Dystro (scooby)", "Richard Stallman", "Dick Stallman", "DJ S3RL", "Literally your mother", "Literally your father", "Literally done", "Literally liberally a pilot", "Literally liberally a medical doctor", "4chan the hacker", "Tweek Tweak", "Craig Tucker", "Kyle Broflovski", "Eric Cartman", "Stan Marsh", "Kenny McCormick", "Stan Darsh", "Osama Bin Laden", "FBI", "CIA", "Terry Andrew Davis", "A ghost", "A cashier", "Steven Hawking", "George Washington", "George Bush", "John F****** Kennedy", "Namecheap", "Namecheap Support Agent", "Indian Support Agent", "Namecheap but without the name", "Reddit hater", "Tweek X Craig", "Indian Tech Support", "Messiah", "The LORD", "Rihanna", "Lady Gaga", "Googoo Gaga", "Gaga, o-lala", "A 2005 Internet sensation", "Google Analytics", "Wanna join a cult?", "A robot", "A bot", "An android", "A fake mustache", "A serial killer", "A wanted fugitive", "A fake medical doctor", "Dexter", "OG Loc", "Carl Johnson", "Big Smoke", "Cluckin Bell", "Sweet", "Ryder", "ICE", "BIG chungus", "What if Zelda was a girl?", "Kagamine Len", "Sandy Cheeks", 'Levi Heichou', 'EREN', 'Eren Jager', 'Jagermeister', 'A bird but not really', 'a bot, ama', 'jeremy heere, jeremy there', 'Steve from Minecraft', 'Monokuma', 'Monobear', 'Drunk! Monokuma', 'Beach! Monokuma', 'Kaishi', 'Tai-chi', 'Secret admirer', 'toto by africa', 'africa (author of toto)', 'todo by africa', 'africa by todoroki', 'zoo wee mama', 'xiaomi airdots', 'redmi airdots', 'china (#1)', 'Your mother', 'SRP enthusaist', 'Jaye', "Bald Komaeda", "Your partner", "A Pyramid Scammer", "Nijad Abdullah Nelly", "Yakubian", "Jacobian", "DETERMINANTA", "DISKRIMINANTA", "the corona virus", "the swine flu", "small chungus"];
words_srp.pop();
words_edgy.pop(); //remove 0

var blacklist_limit = 50;

var events = {
	announcement: 1000,
	banned: 100,
	pervert: 200,
	minor: 300,
	matching: 0,
	matched: 1,
	left: 2,
	typing: 3,
	namechange: 4,
	checkingarchive: 5,
	failedarchive: 6,
	suggestnamechange: 7,
	connecting: 8,
	temporarilyunavailable: 69,
	readstarter: 9
};

var states = {
	disconnected: 0,
	connecting: 1,
	connected: 2,
	searching: 3,
	chatting: 4,
	archive: 5,
	timeout_chatting: 6,
	timeout_searching: 7
};

var dreasons = {
	voluntary: 0,
	pvoluntary: 1,
	timeout: 2,
	ptimeout: 3,
	reconnect: 4,
	timeout_final: 5
};

var senders = {
	none: 0,
	system: 1,
	me: 2,
	peer: 3
};
var last_sender = senders.none;

var state = states.disconnected;
var meta = {last_time:0, real_version:REAL_VERSION};
meta.oldardale="Welcome to the incredible world of Kokichi Ouma (my boyfriend), where you can be Kokichi Ouma (my boyfriend)! Just choose Kokichi Ouma (my boyfriend), and get ready for a thrillingly improbable conversation with Kokichi Ouma (my boyfriend) online.";
var socket = undefined;
var me = {};
var peer = {};
var pending_messages = {};

var all_messages = [];

var thread_unsent_messages = 0;
var thread_interests_timeout = 0;
var thread_typing_check = 0;
var old_text = "";

var $text_name, $text_interests, $text_blacklist, $checkbox_night_mode, $checkbox_enforce_interests, $checkbox_expose_interests,$checkbox_cooldown, $checkbox_interests_timeout, $checkbox_sound, $tagify_interests, $tagify_blacklist, $button_connect_home;
var $button_connect, $button_send, $text_message, $list_messages;

var site_settings = {};

function parsi(s) {
	try {
		return JSON.parse(s);
	} catch(err) {
		console.log("Parse error");
		return { status: "ERROR", message: "" };
	}
}

function save_setting(name, value) { // set settings value
	site_settings[name] = value;
	//Cookies.set('site_settings', site_settings, { expires: 3650 });
	localStorage.setItem('site_settings', JSON.stringify(site_settings));
}

function load_settings() { // read settings to memory
	console.log("Loading settings");
	site_settings = parsi(localStorage.getItem("site_settings"));
	if (site_settings == null) {
		console.log("Local storage is null, trying cookies");
		site_settings = parsi(Cookies.get('site_settings'));
	}
	if (typeof site_settings.status === 'string' && site_settings.status == 'ERROR') {
		console.log("Error reading site_settings cookie. Clearing to avoid fatal injuries");
		console.log("Previous value:");
		console.log(Cookies.get('site_settings'));
		site_settings = {
			name: '',
			interests: [],
			blacklist: [],
			night_mode: 1,
			enforce_interests: true,
			expose_interests: false,
			cooldown: 0,
			interests_timeout: false,
			sound: true,
			history: [],
			history2: {},
			srp: 1,
			font_size: 'unset',
			starter: '',
			locked_blacklist: new Array(100).fill(0)
		};
		//Cookies.set('site_settings', site_settings, { expires: 3650 });
		localStorage.setItem('site_settings', JSON.stringify(site_settings));
	}
	console.log(site_settings);
	/*if (typeof site_settings.history === 'undefined') */site_settings.history = [];
	/*if (typeof site_settings.history2 === 'undefined') */site_settings.history2 = {};
	if (typeof site_settings.srp === 'undefined') site_settings.srp = 1;
	if (typeof site_settings.font_size === 'undefined') site_settings.font_size = 'unset';
	if (typeof site_settings.starter === 'undefined') site_settings.starter = '';
	if (typeof site_settings.locked_blacklist === 'undefined' || site_settings.locked_blacklist.length == 100) site_settings.locked_blacklist = {};
	if (typeof site_settings.night_mode === 'boolean') {
		site_settings.night_mode = site_settings.night_mode? 1 : 0;
		//save_settings();
	}
	if (typeof site_settings.night_mode === 'undefined') {
		site_settings.night_mode = 0;
	}

	if (typeof site_settings.hot_b === 'undefined') site_settings.hot_b = true;
	if (typeof site_settings.hot_s === 'undefined') site_settings.hot_s = true;
}

function save_settings() {
	//console.log("Called save_settings()");
	for (var key in site_settings) save_setting(key, site_settings[key]);
}

function getTagElmByIndex(taglist, idx) {
	return taglist.getTagElmByValue(taglist.value[idx].value);
}

function show_locked_blacklist() {
	var elm;
	for (var i = 0; i < $tagify_blacklist.value.length; i++) {
		elm = getTagElmByIndex($tagify_blacklist, i);
		elm.style.backgroundColor = site_settings.locked_blacklist[i] == 1? '#66ccff' : '';
		console.log("setting " + site_settings.locked_blacklist[i] == 1? '#66ccff' : '');
	}
}

function load_settings_ui() { // change visual units according to settings
	load_settings();
	$text_name.val(site_settings.name);
	$tagify_interests.addTags(site_settings.interests);
	for (let i = 0; i < site_settings.blacklist.length; i++) {
		$tagify_blacklist.addTags([{'value': site_settings.blacklist[i].value || site_settings.blacklist[i], 'title': site_settings.blacklist[i].title, 'readonly':site_settings.locked_blacklist[site_settings.blacklist[i]]?true:false}]);
	}
	$text_starter.val(site_settings.starter);
	$checkbox_night_mode.prop('checked', site_settings.night_mode);
	$checkbox_cooldown.prop('checked', site_settings.cooldown);
	$checkbox_enforce_interests.prop('checked', site_settings.enforce_interests);
	$checkbox_expose_interests.prop('checked', site_settings.expose_interests);
	$checkbox_interests_timeout.prop('checked', site_settings.interests_timeout);
	$checkbox_sound.prop('checked', site_settings.sound);
	for (let i = 0; i < 3; i++) {
		$("input[name='srpradio']")[i].checked = (site_settings.srp&(2**i))>0;
	}
	$("[name='nightradio']")[site_settings.night_mode].checked = true;
	set_font_size(site_settings.font_size);
	toggle_night(site_settings.night_mode);
}

function save_settings_ui() {
	site_settings.name = $text_name.val();
	site_settings.interests = [];
	for (var i in $tagify_interests.value) site_settings.interests.push($tagify_interests.value[i].value);
	site_settings.blacklist = [];
	for (var i in $tagify_blacklist.value) site_settings.blacklist.push($tagify_blacklist.value[i]);
	//site_settings.night_mode = $checkbox_night_mode.prop('checked');
	site_settings.enforce_interests = $checkbox_enforce_interests.prop('checked');
	site_settings.expose_interests = $checkbox_expose_interests.prop('checked');
	site_settings.cooldown = $checkbox_cooldown.prop('checked') ? 1 : 0;
	site_settings.interests_timeout = $checkbox_interests_timeout.prop('checked');
	site_settings.sound = $checkbox_sound.prop('checked');
	site_settings.starter = $text_starter.val();
	//console.log("Called save_settings_ui()");
	save_settings();
}

function toggle_night(choice) { // 0 - light, 1 - dark, 2 - amoled
	site_settings.night_mode = choice;
	meta.dark = choice;
	if (choice == 2) {
		$("#logo, #logo-mobile").attr("src", "static/media/logo2_inv.png");
		$("body").css({'background': '#000000'});
		$("#home, #chat").css({'border-color': '#000000'});
		$(".well, #top, #top-mobile, .modal-content").css({'background': '#000000', 'color': 'white'});
		$(".message").css({'background': '#0f0f0f', 'color': 'white'});
		//$(".tagify__input").addClass("white_placeholder");
		//$(".tagify__input").removeClass("black_placeholder");
		$("a").css({'color': 'white'});
		//$("#featured_iframe")[0].innerHTML = "<iframe src='featured_dark.html' style='width:100%; height:100%;'></iframe>";
		$('.chat.input.archive').css({'background': '#0f0f0f', 'color': 'white'});
		$('.meta.chrometheme').attr('content', '#0f0f0f');
		$('.close').css('text-shadow', '0 1px 0 #000000');
	} else if(choice == 1) {
		$("#logo, #logo-mobile").attr("src", "static/media/logo2_inv.png");
		$("body").css({'background': '#000000'});
		$("#home, #chat").css({'border-color': '#000000'});
		$(".well, #top, #top-mobile, .modal-content").css({'background': '#1f1f1f', 'color': 'white'});
		$(".message").css({'background': '#1f1f1f', 'color': 'white'});
		//$(".tagify__input").addClass("white_placeholder");
		//$(".tagify__input").removeClass("black_placeholder");
		$("a").css({'color': 'white'});
		//$("#featured_iframe")[0].innerHTML = "<iframe src='featured_dark.html' style='width:100%; height:100%;'></iframe>";
		$('.chat.input.archive').css({'background': '#1f1f1f', 'color': 'white'});
		$('.meta.chrometheme').attr('content', '#1f1f1f');
		$('.close').css('text-shadow', '0 1px 0 #000000');
	} else {
		$("#logo, #logo-mobile").attr("src", "static/media/logo2.png");
 		$("body").css({'background': '#66ccff'});
		$("#home, #chat").css({'border-color': '#66ccff'});
		$(".well, #top, #top-mobile, .modal-content").css({'background': '#ffffff', 'color': 'black'});
		$(".message").css({'background': '#ffffff', 'color': 'black'});
		//$(".tagify__input").addClass("black_placeholder");
		//$(".tagify__input").removeClass("white_placeholder");
		$("a").css({'color': 'black'});
		//$("#featured_iframe")[0].innerHTML = "<iframe src='featured_light.html' style='width:100%; height:100%;'></iframe>";
		$('.chat.input.archive').css({'background': 'white', 'color': 'black'});
		$('.meta.chrometheme').attr('content', '#ffffff');
		$('.close').css('text-shadow', '0 1px 0 #ffffff');
	}
	$('.tagify.character.settings.text').css({'background-color':'white', 'color':'black'});
	save_settings_ui();
}

function move_hat(hat) {
	hat.style.left =  Math.floor(Math.random() * 500) + "px";
}

function download_text(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

function export_profile() {
	download_text("profile_"+site_settings.name+".json", localStorage.getItem("site_settings"));
}

function hide_import_profile() {
	$('#importprofilediv')[0].innerHTML = "<a href='javascript:;' onclick='expose_import_profile();'>Import Profile</a>";
}

function expose_import_profile() {
	$('#importprofilediv')[0].innerHTML = '<a href=\'javascript:;\' onclick=\'hide_import_profile();\'>[X]</a> <input type="file" onchange="import_profile(event)" >';
}

function import_profile(event) {
	function loadAsText(theFile) {
		var reader = new FileReader();
		reader.onload = function(loadedEvent) {
			var json_text = loadedEvent.target.result;
			var settings_test = parsi(json_text);
			if (settings_test == null) return;
			$tagify_blacklist.removeAllTags();
			$tagify_interests.removeAllTags();
			localStorage.setItem("site_settings", json_text);
			load_settings_ui();
			//window.location = '/';
		}
		reader.readAsText(theFile);
	}
	var files = event.target.files;
	if (files.length == 1) loadAsText(files[0]);
	hide_import_profile();
}

function hashcode(str) {
	let hash = 0, i, chr;
	if (str.length === 0) return hash;
	for (i = 0; i < str.length; i++) {
		chr   = str.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}


function name_bad(name) {
	name = name.replace("\\", " ").replace("/", " ").replace("|", " ")
				.replace("(", " ").replace(")", " ").replace(",", " ")
				.replace(".", " ").replace("!", " ").replace("?", " ")
				.toLowerCase().split(" ");
	let bad = [false, false];
	name.forEach(function(part) {
		if (words_srp.includes(hashcode(part))) bad[0] = part;
		if (words_edgy.includes(hashcode(part))) bad[1] = part;
	});
	return bad;
}


function button_connect() {
	if (state == states.connecting || state == states.disconnected) {
		announce_scary("Connecting, please wait...");
		return;
	}
	if (site_settings.srp == 0) {
		announce_scary("To continue, select your desired sections:", 1500);
		return;
	}
	var name = $('.form-control.name').val().trim();
	if (!name.length) {
		button_suggest();
		return;
	}
	let name_bad_status = name_bad(name);
	let and_mask = constants.FLAG_EDGY | (constants.FLAG_SRP*(name_bad_status[1]?0:1)) | (constants.FLAG_CLEAN*(name_bad_status[0]?0:1)); // whats allowed
	let not_mask = ~and_mask;
	if (not_mask & site_settings.srp) {
		name_bad_ui();
		return;
	}
	document.getElementById('home').style.display = 'none';
	for(var i=0; i < document.getElementsByClassName('chat').length; i++) {
		document.getElementsByClassName('chat')[i].style.display = '';
	}
	//$button_connect_desktop.click();
	display_which(1);
	save_settings_ui();
	connect();
}

function go_home() {
	if (meta.archive_saving) {
		show_clock_momentarily()
		return;
	}
	disconnect(dreasons.voluntary);
	document.getElementById('home').style.display = '';
	for(var i=0; i < document.getElementsByClassName('chat').length; i++) {
		document.getElementsByClassName('chat')[i].style.display = 'none';
	}
	meta.home = true;
	meta.archive_success = false;
	meta.archive_cid = undefined;
	meta.archive_room = undefined;
	meta.archive_identifier = undefined;
	display_featured();
	history.pushState(null, null, ' '); //remove hash
}

function button_suggest() {
	var suggestion = suggestion_options[Math.floor(Math.random()*suggestion_options.length)];
	$('.form-control.name').val(suggestion);
}

function connect(name, interests, blacklist, starter, enforce_interests, interests_timeout, expose_interests, cooldown, srp) {
	/*if (new Date().getTime() - meta.last_time < 1000) {
		show_clock_momentarily();
		return;
	}*/
	//meta.home = false;
	meta.archive_submitted = false;
	meta.home = 0;
	name = name || site_settings.name;
	interests = interests || site_settings.interests;
	blacklist = blacklist || site_settings.blacklist;
	enforce_interests = enforce_interests || site_settings.enforce_interests;
	interests_timeout = interests_timeout || site_settings.interests_timeout;
	expose_interests = expose_interests || site_settings.expose_interests;
	cooldown = cooldown || site_settings.cooldown;
	srp = srp || site_settings.srp;
	starter = starter || site_settings.starter;
	$text_message.css('backgroundImage', '');
	if (enforce_interests == 2) enforce_interests = 0;
	for (let i = 0; i < blacklist.length; i++) {
		try {
			if (typeof blacklist[i] === 'object' && typeof blacklist[i].title === 'string') {
				blacklist[i] = blacklist[i].title.toLowerCase();
			} else if (typeof blacklist[i] === 'object' && typeof blacklist[i].value === 'string') {
				blacklist[i] = blacklist[i].value.toLowerCase();
			} else {
				blacklist[i] = blacklist[i].toLowerCase();
			}
		} catch (e) {
			console.log("could not add blacklist item");
			console.log(blacklist[i]);
		}
	}

	state = states.searching;
	$('.chatshill').remove();
	if (!archive_chat_check()) clear_messages();
	display_message_system(events.connecting);
	me.name = name;
	me.starter = starter;
	me.enforce_interests = enforce_interests;
	me.expose_interests = expose_interests;
	me.interests = interests;
	console.log(me.interests);
	me.blacklist = blacklist;
	me.interests_timeout = interests_timeout;
	me.matched = false;
	me.srp = srp;
	reset_parameters();
	socket.emit('joinRoom', {
		name: name,
		interests: interests,
		enforce_interests: enforce_interests,
		expose_interests: expose_interests,
		blacklist: blacklist,
		cooldown: cooldown,
		srp: srp,
		starter: starter
	});
	meta.asked_to_leave = false;
	//$button_connect_desktop.attr('src','/static/media/leave.png');
	display_which(1);
	$button_connect.html('<p class="action-mobile-font">Leave</p>');
	console.log("Sent match request");
}

function old_format_archive(cid) {
	state = states.archive;
	socket.emit('fetch_old_archive', {
		cid: cid
	});
	document.getElementById('home').style.display = 'none';
	document.getElementById('chat').style.display = '';
	display_message_system(events.checkingarchive);
}

function new_format_archive(cid) {
	state = states.archive;
	document.getElementById('home').style.display = 'none';
	document.getElementById('chat').style.display = '';
	clear_messages();
	/*if (Object.keys(site_settings.history2).includes(cid)) {
		console.log("Fetched locally");
		all_messages = site_settings.history2[cid].all_messages;
		display_all_messages();
		var color = site_settings.night_mode ? "#1f1f1f" : "#ffffff";
		$text_message.css('backgroundImage', "repeating-linear-gradient(-45deg,#66ccff,#66ccff 40px,"+color+" 40px,"+color+" 80px)");
	} else {*/
		socket.emit('fetch_new_archive', {
			cid: cid
		});
		display_message_system(events.checkingarchive);
	//}
}

function reset_parameters() {
	me.message_count = 0;
	me.number = 0;
	if (!archive_chat_check()) all_messages = [];
	pending_messages = {};
	last_sender = senders.none;
	me.archive_identifier = undefined;
	me.archived = false;
	me.disconnected = false;
}

function $set_srp(value) {
	let boxes = $("input[name='srpradio']");
	for (let i = 0; i < boxes.length; i++) {
		boxes[i].checked = value & 2**i;
	}
	site_settings.srp = value;
	save_setting("srp", site_settings.srp);
}

function $get_srp() {
	let boxes = $("input[name='srpradio']");
	let srp = 0;
	for (let i = 0; i < boxes.length; i++) {
		srp |= (2**i) * (boxes[i].checked?1:0);
	}
	return srp;
}

function adjust_sections(notify) {
	let notif = "";
	let srp = $get_srp();
	let bad_flags, adjusted = srp, forbidden = 0;


	bad_flags = site_settings.flags;

	if (bad_flags == 7) {
		//announce_scary("You are banned.", -2);
		$set_srp(0);
		return 0;
	}

	forbidden = bad_flags & srp;
	adjusted &= ~forbidden;
	if (forbidden) {
		let sections = [];
		for (let i = 0; i < constants.SECTIONS.length; i++) {
			if (bad_flags & (2**i)) sections.push(constants.SECTIONS[i]);
		}
		if (sections.length == 1) notif += "You are banned from " + sections[0] + ".";
		else if (sections.length == 2) notif += "You are banned from " + sections[0] + " and " + sections[1] + ".";
		else notif += "You are banned from this website";
		if (site_settings.notice.length) {
			notif += "<br>Reason: <i>\""+site_settings.notice+"\"</i>";
			let expiry = utils.time() + site_settings.time_left;
			let expirydate = new Date(expiry);
			notif += "<br>Expiry: <i>"+expirydate.toString()+"</i>";
		}
		if (site_settings.banhash.length) {
			notif += "<br>Ban ID: " + site_settings.banhash;
		}
	}


	let name = $text_name.val();
	let bad = name_bad(name);
	let forbidden_srp = !!bad[1], forbidden_clean = !!bad[0];

	bad_flags = constants.FLAG_EDGY*0 | constants.FLAG_SRP*(forbidden_srp*1) | constants.FLAG_CLEAN*((forbidden_clean||forbidden_srp)*1);
	forbidden = bad_flags & srp;
	adjusted &= ~forbidden;


	if (forbidden) {
		if (notif.length) notif += "<br>";
		if (forbidden_clean) {
			notif += "\"" + bad[0] + "\" is not permitted in " + constants.SECTIONS[0] + ".";
			if (forbidden_srp) notif += "<br>";
		}
		if (forbidden_srp) {
			notif += "\"" + bad[1] + "\" is only permitted in " + constants.SECTIONS[2] + ".";
		}
	}

	$set_srp(adjusted);
	if (notify) announce_scary(notif);

	return 0;
}

function set_font_size(size) {
	$('.list-group-item').css("font-size",size);
	site_settings.font_size = size;
	save_settings();
}

function clear_blacklist() {
	$tagify_blacklist.removeAllTags();
	site_settings.blacklist = [];
	site_settings.locked_blacklist = {};
	save_settings();
}

function tf_unsent_messages() {
	var pending_messages_cache = pending_messages;
	var timestamp = moment.utc(moment().unix()).unix();
	var failed = false;
	for (var message_id in pending_messages_cache) {
		var message = pending_messages_cache[message_id];
		if (message.timestamp < timestamp - 10 && pending_messages.hasProperty(message_id)) {
			disconnect(dreasons.timeout);
			failed = true;
			/*for (var message_id_new in pending_messages) {
				delete_message(message_id_new);
			}*/
		}
	}
}

function tf_interests_timeout() {
	console.log("Interests timed out");
	if (state == states.searching) {
		disconnect(dreasons.reconnect);
	}
}

function tf_typing_check() {
	var new_text = $text_message.val();
	var old_typing = me.is_typing;
	me.is_typing = new_text != old_text;
	old_text = new_text;
	if (me.is_typing != old_typing && state == states.chatting) socket.emit('typing', me.is_typing);
}

function tf_change_looking() {
	console.log("called");
	var looking_suggestions = ["Penguins are flightless birds.","While other birds have wings for flying, penguins have adapted flippers to help them swim in the water.","Most penguins live in the Southern Hemisphere.","The Galapagos Penguin is the only penguin specie that ventures north of the equator in the wild.","Large penguin populations can be found in countries such as New Zealand, Australia, Chile, Argentina and South Africa.","No penguins live at the North Pole.","Penguins eat a range of fish and other sealife that they catch underwater.","Penguins can drink sea water.","Penguins spend around half their time in water and the other half on land.","The Emperor Penguin is the tallest of all penguin species, reaching as tall as 120 cm (47 in) in height.","Emperor Penguins can stay underwater for around 20 minutes at a time.","Emperor Penguins often huddle together to keep warm in the cold temperatures of Antarctica.","King Penguins are the second largest penguin specie. They have four layers of feathers to help keep them warm on the cold subantarctic islands where they breed.","Chinstrap Penguins get their name from the thin black band under their head. At times it looks like they’re wearing a black helmet, which might be useful as they’re considered the most aggressive type of penguin.","Crested penguins have yellow crests, as well as red bills and eyes.","Yellow eyed penguins (or Hoiho) are endangered penguins native to New Zealand. Their population is believed to be around 4000.","Little Blue Penguins are the smallest type of penguin, averaging around 33 cm (13 in) in height.","Penguin’s black and white plumage serves as camouflage while swimming. The black plumage on their back is hard to see from above, while the white plumage on their front looks like the sun reflecting off the surface of the water when seen from below.","Penguins in Antarctica have no land based predators."];
	var selection = looking_suggestions[Math.floor(Math.random()*looking_suggestions.length)];
	$('.chatlooking')[0].innerHTML = "<font color='#777777'><strong><i>Looking for a partner... Did you know- "+selection+"</i></strong></font>";
}

function beacon_toggle(status) {
	meta.beacon_lit = status;
	if (meta.beacon_lit) {
		document.title = state == states.chatting ? "! YOU HAVE NEW MESSAGES !" : "! DISCONNECTED !";
		$("#favicon").attr("href", "static/media/favicon_white.png");
	} else {
		document.title = "Shamchat: Don't be yourself!";
		$("#favicon").attr("href", "static/media/favicon.png");
	}
}

function beacon_interval() {
	beacon_toggle(!meta.beacon_lit);
}

function notify_lazy_user(which) {
	if (meta.focused) return;
	if (site_settings.sound) which.play();
	if (typeof meta.beacon !== 'undefined') clearInterval(meta.beacon);
	meta.beacon = setInterval(beacon_interval, 1000);
}

function should_display_ad() {
	return !archive_chat_check() && (Math.floor(Math.random() * (AD_FREQ + 1)) == 0); // one in 8
}

function display_ad_in_chat() {
	let ad_code = `
	<ins class="adsbygoogle"
		 style="display:block"
		 data-ad-format="fluid"
		 data-ad-layout-key="-fb+5w+4e-db+86"
		 data-ad-client="ca-pub-1112311601343218"
		 data-ad-slot="9194829203"></ins>
	<script>
		 (adsbygoogle = window.adsbygoogle || []).push({});
	</script>`;
	
	let $message = jQuery("<li class=\"list-group-item\"></li>");
	$list_messages.append($message);
	$message.append(`<p>&nbsp;</p><center>${ad_code}</center>`);
	$list_messages.append($message);
}

function popup_change_name() {
	let textid = Math.random().toString().slice(2);
	console.log("Generated " + textid);
	new BstrapModal("Pick a New Name", "What would your new name be?<br><br><input type=\"text\" class=\"form-control chat input namechange id_"+textid+"\" placeholder=\""+suggestion_options[Math.floor(Math.random()*suggestion_options.length)]+"\"></input>", [
	{
		Value: 'Nevermind',
		Css: 'btn-default'
	},
	{
		Value: 'Nice',
		Css: 'btn-primary modal-ok',
		Callback: function(event) {
			let new_name = $(".form-control.chat.input.namechange").val();
			if (typeof new_name === 'string' && new_name.trim().length != 0) change_name(new_name);
			BstrapModal.Close();
		}
	}
	]).Show();

	$('.id_'+textid).on('keyup', function(e) {
		switch(e.which) {
			case 13: //enter
				let new_name = $(".form-control.chat.input.namechange").val();
				if (typeof new_name === 'string' && new_name.trim().length != 0) change_name(new_name);
				BstrapModal.Close();
			default:
				break;
		}
		return 1;
	});
}

function check_announcement() {
	let date_now = new Date(site_settings.announcement_date).getTime();
	let date_last = site_settings.announcement_date? site_settings.date : 0;
	let hash_now = hashcode(announcement_message);
	let hash_last = site_settings.announcement_hash? site_settings.announcement_hash : 0;
	if (/*announcement_message.length==0 || date_now <= date_last || */hash_now == hash_last) return;
	save_setting("announcement_date", date_now);
	save_setting("announcement_hash", hash_now);
	show_generic_modal("Announcement", announcement_message + "<br><br><i><font color='#b1b1b1'>Posted on "+announcement_date+"</font></i>");
}


function initialize_callbacks() {
	state = states.connecting;
	socket.on('welcome' , function(message) {
		me.old_id = me.id;
		me.id = socket.id;
		console.log("Got me flags, " + message.flags);
		site_settings.flags = message.flags;
		site_settings.notice = message.notice;
		site_settings.time_left = message.time_left;
		site_settings.srp &= ~site_settings.flags;
		site_settings.banhash = message.banhash;
		console.log("State is " + state);
		if (state == states.timeout_chatting) {
			//clearTimeout(meta.timeout_chatting_thread);
			console.log("Firing reidentify");
			socket.emit('reidentify', {old_id: me.old_id, number: me.number, room_name: me.room, name: me.name});
		}
		else if (state == states.timeout_searching) connect();
		else if (state != states.archive) state = states.connected;
		console.log("Connected to server");
		$button_connect_home.html("Start a Text Chat");
		adjust_sections(true);
		$('.loader').fadeOut();
		if (message.flags == 7) {
			console.log("fire");
			let text = `
You are banned. As explained in the TOS (which you should have read), you may not continue using the website.<br>
If you believe that you have been banned by mistake, you may appeal your ban on <a href='https://sham.chat/discord'>our Discord</a>.`
			if (site_settings.notice.length) {
				text += "<br><br>The following reason has been specified: <i>\""+site_settings.notice+"\"</i>";
				let expiry = utils.time() + site_settings.time_left;
				let expirydate = new Date(expiry);
				text += "<br>Ban will expire on " + expirydate.toString() + ".";
			}
			if (site_settings.banhash.length) {
				text += "<br><br>Your ban ID, which must be provided in the appeal, is " + site_settings.banhash;
			}
			let bilbil = new BstrapModal("Hol' Up", text, [
				{
					Value: 'Ok',
					Css: 'btn-primary modal-ok',
					Callback: function(event) {
						window.location = '/static/418.shtml';
						BstrapModal.Close();
					}
				}
			]);
			bilbil.Show();
			$('.close.modal-white-close').hide();
			return;
		} else if (site_settings.accepted_tos) {
			$('#all').fadeIn();
			check_announcement();
		}
	});

	socket.on('message', function(message) {
		var message_id = message.id.substring(2);
		var message_sender = message.id[0];
		if (message_sender != me.number) notify_lazy_user(meta.notisound);
		if (parseInt(message_sender) == me.number && pending_messages.hasOwnProperty(message_id)) {
			// TODO roki boom: might wanna take care of re-ordering in the future
			delete pending_messages[message_id];
		} else {
			console.log("Displaying message");
			console.log(message);
			//console.log("Message sender is " + message_sender);
			if (message_sender != me.number) display_message_raw(senders.peer, peer.name, message.text);
		}
		scroll_down();
	});

	socket.on('sysmsg', function(delivery) {
		id = delivery.id;
		message = delivery;
		let dont_sing = false;
		switch (message.type) {
			case events.banned: {
				alert("You were banned due to abuse. Should you have any concerns, please contact admin@sham.chat or message us via Discord.");
				break;
			}
			case events.pervert: {
				meta.got_pervert = true;
				site_settings.pervert = true;
				$('#radio-five')[0].checked = true;
				break;
			}
			case events.matching: {
				//state = states.searching;
				if (state != states.searching) break;
				if (!archive_chat_check()) clear_messages();
				$('.chatlooking').remove();
				display_message_system(events.matching);
				//if (typeof me.interests !== 'string') me.interests = "";
				if (me.interests.length && me.interests_timeout) {
					thread_interests_timeout = setTimeout(tf_interests_timeout, delay_interests_timeout);
				}
				break;
			}
			case events.matched: {
				if (state != states.matching && state != states.searching) {
					// this is a horrible bug that i will sweep under the rug for now and see what happens
					console.log("OH GOD OH FAK");
					let currentdate = new Date();
					console.log(currentdate.getHours() + ":"  + currentdate.getMinutes() + ":" + currentdate.getSeconds());
					console.log(me);
					console.log(state);
					console.log(meta);
					console.log(peer);
					console.log(socket);
					console.log(message);
					console.log("===========================================");
					dont_sing = true;
					break; // :')
				}
				if (!archive_chat_check()) clear_messages();
				state = states.chatting;
				me.matched = true;
				me.mqueue = [];
				
				me.number = message.your_number;
				me.archive_identifier = message.archive_identifier;
				me.id = socket.id;
				me.room = message.room;
				peer.number = message.peer_number;
				peer.name = message.name;
				meta.eternal_name = message.name;
				peer.interests = message.interests;
				peer.interests_total = message.interests_total;
				peer.srp = message.srp;
				peer.starter = message.starter;
				console.log("Received match from " + peer.name + " and srp " + peer.srp);
				var unique_interests = [];
				if (peer.interests.length != peer.interests_total.length) {
					for (var i in peer.interests_total) {
						var interest = peer.interests_total[i];
						if (peer.interests.indexOf(interest) == -1) {
							unique_interests.push(interest);
						}
					}
				}
				peer.interests_unique = unique_interests;
				
				display_message_system(events.matched, {me_name: me.name, peer_name: peer.name, common_interests: peer.interests, unique_interests: peer.interests_unique, starter: peer.starter, me_srp: me.srp, peer_srp: peer.srp});
				//thread_unsent_messages = setInterval(tf_unsent_messages, delay_unsent_messages);
				meta.chatting = true;
				break;
			}
			case events.left: {
				if (state == states.chatting || state == states.timeout_chatting) disconnect(delivery.reason);
				meta.chatting = false;
				break;
			}
			case events.typing: {
				if (message.number == me.number) return;
				var pencil_inv = site_settings.night_mode? '_inv' : '';
				if (delivery.typing) $('.is-typing').html("<font color='#777777'>" + (peer.name.length < 30 ? escape_html(peer.name) : "Your partner") + " is typing...</font>");
				else $('.is-typing').html("");
				break;
			}
			case events.namechange: {
				if (message.number == me.number) return;
				//on_name_change(peer.name, message.new_name);
				display_message_system(events.namechange, {old_name: peer.name, new_name: message.new_name, peer: true});
				peer.name = message.new_name;
				break;
			}
		}
		if (delivery.type != events.typing && delivery.type != events.matching && !dont_sing) {
			if (delivery.type == events.left) {
				if (delivery.reason != dreasons.ptimeout) notify_lazy_user(meta.discosound);
			} else { notify_lazy_user(meta.notisound); }
		}
	});

	socket.on('disconnect', function() {
		disconnect(dreasons.timeout);
		console.log("Connection error");
		$button_connect_home.html("Please wait...");
		meta.chatting = false;
	});

	socket.on('generic', function(bundle) {
		if (!Number.isInteger(bundle.code)) return;
		switch (bundle.code) {
			case 1: {
				display_message_system(events.readstarter);
				break;
			}
			default: {
				return;
			}
		}
	});
	
	socket.on('archive_old_format', function(archive) {
		clear_messages();
		state = states.archive;
		if(archive.success) {
			me.name = archive.chat.name1;
			display_message("This is a conversation between " + archive.chat.name1 +" and " + archive.chat.name2 + ".", true);
			console.log(archive);
		   	for(var i = 0; i < archive.chat.messages.length; i++) {
		   	   // console.log(archive.chat.messages[i].number);
		   	   switch (archive.chat.messages[i].number) {
		   		   case 1:
		   			   display_message("</font>" + archive.chat.messages[i].old_name + "<font color='#777777'> has changed their name to " + archive.chat.messages[i].new_name, true);
		   			   break;
		   		   case 2:
		   			   display_message(archive.chat.messages[i]);
		   			   break;
		   		   case 3:
		   			   display_message(archive.chat.messages[i]);
		   			   break;
		   	   }
		   	}
		}
		else {
			display_message_system(events.failedarchive);
			return;
		}
		//state = states.connected;
	});

	socket.on('archive_new_format', function(result) {
		meta.archive_saving = false;
		if (result.success != 1) {
			display_message_system(events.failedarchive);
			return;
		}
		meta.res = result;
		let content = [];
		let min = 100;
		for (let i = 0; i < result.content.length; i++) {
			let spl = result.content[i].split(",");
			if (spl.length != 2) continue;
			let num = parseInt(spl[0]);
			if (num < min) min = num;
		}
		let add = 0 - min;
		console.log("need to add " + add);
		for (let i = 0; i < result.content.length; i++) content.push("");
		for (let i = 0; i < result.content.length; i++) {
			let spl = result.content[i].split(",");
			if (spl.length != 2) {
				content[i] = spl[0];
			}else {
				if (spl[1].length) content[parseInt(spl[0])+add] = spl[1];
			}
		}
		let inof = content.indexOf("");
		while (inof!=-1) {
			content.splice(inof, 1);
			inof = content.indexOf("");
		}
		meta.cont2 = content;
		try {
		content = utils.hex_decode(content.join(""));
		meta.cont = content;
		archive = JSON.parse(content);
		} catch (e) {
			display_message_raw(senders.system, "", "Chat is corrupted!");
			return;
		}
		meta.arr = archive;
		all_messages = archive;
		display_all_messages();

		display_message_raw(senders.system, "", "<br><center><br><span class='chat section saveimage'><a href='javascript:;' onclick='save_as_image();' style='font-style: normal;'>Save as Image</a></span><br><br>"+(archive_chat_check()?"":"This link can be used to resurrect a chat. Press Escape and continue where you left off! Short archive links are not supported.")+"</center>", "chatshill");
		scroll_down();

		var color = site_settings.night_mode ? "#1f1f1f" : "#ffffff";
		$text_message.css('backgroundImage', "repeating-linear-gradient(-45deg,#66ccff,#66ccff 40px,"+color+" 40px,"+color+" 80px)");
		/*if (window.location.hash) {
			var cid = window.location.hash.substr(1);
			if (!Object.keys(site_settings.history2).includes(cid)) {
				site_settings.history2[cid] = {all_messages:all_messages};
				save_settings();
			}
		}*/
		/*//console.log(archive);
		archive.splice(archive.length-1,1);
		archive.splice(2,1);
		archive.splice(0,1);
		clear_messages();
		console.log(archive);
		for (var i in archive) {
			console.log("Displaying " + archive[i]);
			var message = archive[i];
			display_message_raw(message.sender, message.name, message.content);
		}*/
		meta.archive_success = true;
		if (archive_chat_check()) {
			meta.archive_name = all_messages[0].content.me_name;
			meta.archive_name_peer = all_messages[0].content.peer_name;
			for (let i = 0; i < all_messages.length; i++) {
				let message = all_messages[i];
				if (message.event != events.namechange) continue;
				if (!message.content.peer) meta.archive_name = message.content.new_name;
				else meta.archive_name_peer = message.content.new_name;
			}
			state = states.connected;
			$button_connect.css({'display':'block'});
			$button_send.css({'display':'block'});
			try {
				$('.chat.button.connect.desktop')[1].style.display = 'none';
				$('.chat.button.connect.desktop')[2].style.display = 'none';
			} catch (e) {}
		}
	});

	socket.on('generate_new_archive', function(result) {
		console.log("Got generate");
		meta.archive_saving = false;
		if (result.success != 1) $('.chat.section.archive.status')[0].innerHTML = 'Could not save archive! Use \'Save as Image\'.';
		else $('.chat.section.archive.status').hide();
	});

	socket.on('reidentify', function(result) {
		console.log("Reidentify result " + result.success + " and " + result.archive_identifier);
		switch (result.success) {
			case 0:
			case -2:
				clearTimeout(meta.timeout_chatting_thread);
				disconnect(dreasons.timeout);
				break;
			case -1:
				meta.received_warning = true;
				break;
			case 1:
				me.archive_identifier = result.archive_identifier;
				break;
			case 2:
				clearTimeout(meta.timeout_chatting_thread);
				meta.timeout_chatting_active = false;
				me.room = result.room_name;
				state = states.chatting;
				blast_message_queue();
				break;
		}
	});
}

function generate_new_archive(do_not_save) {
	if (me.archived) return;
	me.archived = true;
	tmp_messages = all_messages;
	if (!archive_chat_check()) {
		socket.emit('generate_new_archive', tmp_messages);
		$('.chat.section.archive')[0].innerHTML = "<strong><i><font color='#777777'>Archived</font></i></strong>";
		let domain = window.location.href.split("/")[2];
		$('.chat.section.link')[0].innerHTML = `<p>&nbsp;</p><strong><i><a href='https://${domain}/#${me.archive_identifier}' target='_blank'>Tap here</a> <font color='#777777'>or use the following link:<div class='input-group' style='width:300px; margin-top:5px; margin-bottom:5px;'><input class='form-control chat input archive' value='https://${domain}/#${me.archive_identifier}' readonly='readonly' onclick='this.select();'></input><br><br>This link can be used to resurrect a chat: <input class='form-control chat input archive' value='https://${domain}/#${me.archive_identifier}_${me.room}' readonly='readonly' onclick='this.select();'></input></div><p class='chat section archive status'>Saving archive to server...</p></font></i></strong>`;
		$('.chat.section.link').css({'display':'block'});
		if (typeof site_settings.history === 'undefined') site_settings.history = [];
	} else {
		socket.emit('generate_new_archive', tmp_messages, meta.archive_cid);
		meta.archive_saving = true;
	}
	if (!do_not_save) {
		//site_settings.history.push({name1: me.name, name2: peer.name, cid: me.archive_identifier});
		//site_settings.history2[me.archive_identifier] = {name1: me.name, name2: peer.name, all_messages: tmp_messages};
	}
	save_settings();
	toggle_night(site_settings.night_mode);
	var color = site_settings.night_mode ? "#1f1f1f" : "#ffffff";
	$text_message.css('backgroundImage', "repeating-linear-gradient(-45deg,#66ccff,#66ccff 40px,"+color+" 40px,"+color+" 80px)");
}

function timeout_chatting(reason) {
	console.log("Called timeout chatting with:");
	console.log("active: " + meta.timeout_chatting_active + ", warned: " + meta.received_warning + ", reason: " + reason);
	if (!meta.timeout_chatting_active) return;
	if (meta.received_warning) {
		disconnect(reason);
		meta.timeout_chatting_active = false;
	} else {
		meta.received_warning = true;
		setTimeout(timeout_chatting, constants.DELAY_TIMEOUT, reason);
	}
}

function timeout_searching() {
	// nothing for now lol
}

function start_timeout_chatting(reason) {
	console.log("Started timeout chatting");
	state = states.timeout_chatting;
	meta.timeout_chatting_active = true;
	meta.received_warning = false;
	meta.timeout_chatting_thread = setTimeout(timeout_chatting, constants.DELAY_TIMEOUT, reason);
}

function start_timeout_searching() {
	state = states.timeout_searching;
}

function disconnect(reason) {
	console.log("Leaving chatroom");
	if ((reason == dreasons.timeout_final || reason == dreasons.voluntary) && state != states.archive) {
		socket.emit('disconnectManual');
		notify_lazy_user(meta.discosound);
	}
	clearTimeout(thread_interests_timeout);
	pending_messages = {};
	if (state == states.connected || state == states.disconnected) return;
	
	$('.is-typing').html("");
	
	if ((reason == dreasons.timeout || reason == dreasons.ptimeout) && !meta.timeout_chatting_active) {
		console.log("Im gonna go wild");
		if (state == states.chatting) start_timeout_chatting(reason);
		else if (state == states.searching) start_timeout_searching();
		else state = states.disconnected;
	} else {
		state = states.connected;
	}
	if (reason == dreasons.reconnect) {
		state = states.searching;
		meta.reconnected = true;
	}

	if (state == states.connected || state == states.disconnected) {
		meta.timeout_chatting_active = false;
		display_message_system(events.left, {reason: reason, me_name: me.name, peer_name: peer.name});
		if (archive_chat_check() && !meta.archive_submitted) {
			meta.archive_submitted = true;
			generate_new_archive();
			display_message_raw(senders.system, "", "<br><center><a href='javascript:;' onclick='save_as_image();' style='font-style: normal;'>Save as Image</a></center>", "chatshill");
			scroll_down();
		}
		display_which(0);
		$button_connect.html('<p class="action-mobile-font">More</p>');
		var color = site_settings.night_mode ? "#1f1f1f" : "#ffffff";
		$text_message.css('backgroundImage', "repeating-linear-gradient(-45deg,#66ccff,#66ccff 40px,"+color+" 40px,"+color+" 80px)");
	} else if (state == states.searching) {
		connect(me.name, me.interests, me.blacklist, me.starter, 2, true, me.expose_interests, me.cooldown, me.srp);
	}
	meta.last_time = new Date().getTime();
}

function show_starter() {
	if (typeof peer.starter !== 'string') return;
	$('.partnerstarter')[0].innerHTML = "<strong><i><font color='#777777'>Starter:</font></i></strong><br>" + build_message_raw(senders.peer, peer.name, peer.starter, "starterclass", true);
	$("a").css({'color': site_settings.night_mode==0?'black':'white'});
	if (state == states.chatting) socket.emit('generic', {code:1});
	meta.starter_shown = true;
	//$('.partnerstarter')[0].style = "";
}

function display_all_messages(todom=undefined, clear=true) {
	var old_all_messages = all_messages;
	all_messages = [];
	if (clear) clear_messages();
	//display_message_raw(senders.system, "", "ARCHIVED CONVERSATION");
	//console.log("Called display_all_messages");

	//console.log("Called display_all_messages");
	//console.log("Old_all_messages:");
	//console.log(old_all_messages);

	for (var i in old_all_messages) {
		var message = old_all_messages[i];
		if (typeof message.event === 'number') display_message_system(message.event, message.content, todom);
		else {
			if (message.sender == senders.system) continue;
			display_message_raw(message.sender, message.name, message.content, undefined, todom);
		}
	}
	scroll_down();
}

function display_featured() {
	//var old_state = state;
	//state = states.archive;
	if (typeof meta.featured === 'undefined') {
		$.get('featured.json', function(data) {
			all_messages=JSON.parse(data);
			meta.featured = all_messages;
			$('#featured_iframe')[0].innerHTML = "";
			var old_state = state;
			state = states.archive;
			display_all_messages($('#featured_iframe'), false);
			state = state==states.archive?old_state:state;
		}, 'text');
	} else {
		all_messages = meta.featured;
		$('#featured_iframe')[0].innerHTML = "";
		var old_state = state;
		state = states.archive;
		display_all_messages($('#featured_iframe'), false);
		state = state==states.archive?old_state:state;
	}
}

function save_as_image() {
	var $dom = $('.chat.list.messages.list-group');
	var original_height = $dom.css("height");
	var original_width = $dom.css("width");
	var original_chat = $dom[0].innerHTML;
	let original_background = $('.message').css("background");
	var original_matched = me.matched;
	var original_state = state;
	me.matched = false;
	state = states.archive;
	display_all_messages();
	$('.exportchat').remove();
	$('.chatdied').remove();
	$('.partnerstarter').remove();

	var cooler = '#ffffff';
	if (site_settings.night_mode == 1) cooler = '#1f1f1f';
	else if (site_settings.night_mode == 2) cooler = '#000000';
	$dom.css({'background':cooler, 'height': 'unset','width':'unset'});
	$dom.append("<p id='removeme'>&nbsp;</p>");
	html2canvas(document.querySelector(".chat.list.messages.list-group")).then(canvas => {
		var dataUrl= canvas.toDataURL("image/png");
		var chatname = utils.escape_html(peer.name) + " vs. " + utils.escape_html(me.name) + ".png";

		var a = $("<a>")
			.attr("href", dataUrl)
			.attr("download", chatname)
			.appendTo("body");

		a[0].click();

		a.remove();
		me.matched = original_matched;
		display_all_messages();
		state = original_state;
		console.log({'height': original_height, 'width': original_width, 'background': original_background});
		$dom.css({'height': '', 'width': ''});
		$('.message').css({'background': original_background});
		$('#removeme').remove();
	});
}

function display_message_system(event, details = undefined, todom=undefined) {
	//console.log("Called display_message_system with event " + event);
	switch (event) {
		case events.connecting: {
			display_message_raw(senders.system, "", "Connecting...", "chatlooking", todom);
			break;
		}
		case events.matching: {
			if (!archive_chat_check()) {
				if (me.interests.length == 0) {
					display_message_raw(senders.system, "", "Looking for a random partner...", "chatlooking", todom);
				} else if (!me.enforce_interests) {
					display_message_raw(senders.system, "", "Looking for a partner (interests not enforced)...", "chatlooking", todom);
				} else {
					display_message_raw(senders.system, "", "Looking for a partner with similar interests (interests enforced)...", "chatlooking", todom);
				}
			} else {
				display_message_raw(senders.system, "", "Waiting for <font color='#66ccff'>" + meta.archive_name_peer + "</font>...", "chatlooking");
			}
			scroll_down();
			break;
		}
		case events.matched: {
			if (typeof details.me_name !== 'string') details.me_name = "";
			if (typeof details.peer_name !== 'string') details.peer_name = "";
			//me.number = details.number;
			peer.name = details.peer_name;
			$('.chatlooking').remove();
			if (!meta.archive_success || state == states.archive) display_message_raw(senders.system, "", "This is a conversation between <font color='#66ccff'>" + escape_html(details.peer_name) + "</font> and yourself, </font><strong>" + escape_html(details.me_name) + "</strong><font color='#777777'>.", undefined, todom);
			else {
				display_message_raw(senders.system, "", "<font color='#66ccff'>"+escape_html(details.peer_name)+"</font> has joined the chat.", undefined, todom);
				display_message_system(events.suggestnamechange);
				console.log("suggest1");
			}
			if (meta.reconnected) {
				display_message_raw(senders.system, "", "We couldn't find a stranger with similar interests, so you were paired with a completely random stranger after 10 seconds. This feature can be turned off in the settings, next to the button that says 'start a chat'.");
				meta.reconnected = false;
			}
			if (typeof details.me_srp === 'number' && typeof details.peer_srp === 'number' && (!todom || todom.attr("id") != "featured_iframe")) {
				let me_srp = details.me_srp;
				let peer_srp = details.peer_srp;
				let common_srp = me_srp&peer_srp;
				let srp_situation = "";
				let options_srp=constants.SECTIONS;
				let enabled_srp=[!!(common_srp&constants.FLAG_CLEAN), !!(common_srp&constants.FLAG_SRP), !!(common_srp&constants.FLAG_EDGY)];

				srp_situation = "The following chat modes are permitted: ";
				for (let i = 0; i < options_srp.length; i++) {
					if (!enabled_srp[i]) continue;
					srp_situation += options_srp[i] + ", ";
				}
				srp_situation = srp_situation.slice(0,-2);
				if (!meta.shown_srp) {
					display_message_raw(senders.system, "", srp_situation, undefined, todom);
					meta.shown_srp = true;
				}
			}
			//if (state != states.archive) display_message_raw(senders.system, "<input class=\"chat txt new_name\" type=\"text\" hint=\"Your next name\"></input><button class=\"chat btn new_name\" onclick=\"change_name($('.chat.txt.new_name').val())\">Change</button>");
			if(typeof details.common_interests !== 'undefined' && details.common_interests.length > 0) {
				var to_display = "";
				if (typeof details.common_interests[0] !== 'string') details.common_interests[0] = '';
				if (details.common_interests.length == 1) to_display = details.common_interests[0];
				else {
					for (var i = 0; i < details.common_interests.length-1; i++) {
						if (typeof details.common_interests[i] !== 'string') details.common_interests[i] = '';
						to_display += details.common_interests[i];
						if (i != details.common_interests.length-2) {
							to_display += ", ";
						} else {
							to_display += " and ";
						}
					}
					to_display += details.common_interests[details.common_interests.length - 1];
				}
				to_display += ".";
				to_display = escape_html(to_display);
				if (!meta.shown_interests) {
					display_message_raw(senders.system, "", "You and your partner are both interested in " + to_display, undefined, todom);
				}
			} // horrible horrible code duplication
			meta.shown_interests = true;
			if (typeof details.unique_interests !== 'undefined' && details.unique_interests.length > 0) {
				var to_display = "";
				if (typeof details.unique_interests[0] !== 'string') details.unique_interests[0] = '';
				if (details.unique_interests.length == 1) to_display = details.unique_interests[0];
				else {
					for (var i = 0; i < details.unique_interests.length-1; i++) {
						if (typeof details.unique_interests[i] !== 'string') {
							 details.unique_interests[i] = '';
						} else {
							to_display += details.unique_interests[i];
							if (i != details.unique_interests.length-2) {
								to_display += ", ";
							} else {
								to_display += " and ";
							}
						}
					}
					to_display += details.unique_interests[details.unique_interests.length - 1];
				}
				to_display += ".";
				to_display = escape_html(to_display);
				display_message_raw(senders.system, "", "Your partner is also interested in " + to_display, undefined, todom);
			}
			if (typeof details.starter === 'string' && details.starter.trim().length > 0) {
				details.starter = details.starter.trim();
				peer.starter = details.starter;
				if (!meta.shown_starter) {
					display_message_raw(senders.system, "", "Your partner has a starter, Tap <a href='javascript:;' name='chat button starter' onclick='show_starter();'>here</a> to show it.", "partnerstarter", todom);
					meta.shown_starter = true;
				}
			}
			if (state != states.archive && !archive_chat_check()) {
				console.log("suggest2");
				display_message_system(events.suggestnamechange);
			}
			break;
		}
		case events.left: {
			var stringified = {};
			stringified[dreasons.voluntary]= "You have left the conversation.";
			stringified[dreasons.reconnect]= "Reconnecting...";
			stringified[dreasons.timeout]= "You have timed out.";
			stringified[dreasons.timeout_final] = "You have timed out.";
			stringified[dreasons.pvoluntary]= escape_html(peer.name) + " has left the conversation.";
			stringified[dreasons.ptimeout]= escape_html(peer.name) + " has timed out.";
			if (typeof details.reason !== 'number' || details.reason > 4) details.reason = dreasons.timeout;
			display_message_raw(senders.system, "", stringified[details.reason], undefined, todom)
			if (me.matched && meta.home == 0) {
				$('.chatnamechange').remove();
				if (!archive_chat_check()) {
					display_message_raw(senders.system, "", "<p>&nbsp</p>", "chatdied", todom);
					display_message_raw(senders.system, "", `
<center><span style='font-style: normal;'>
	<span class='chat section saveimage'><a href='javascript:;' onclick='save_as_image();' style='font-style: normal;'>Save as Image</a></span> |
	<span class='chat section archive'><a class='chat button archive' href='javascript:;' onclick='chat_archive()' style='font-style: normal;'>Archive</a></span> |
	<span class='chat section feature'><a class='chat button feature' href='javascript:;' onclick='chat_feature()' style='font-style: normal;'>Feature</a></span>
	<p></p>
	<span class='chat section report'><a class='chat button report' href='javascript:;' onclick='chat_report()' style='font-style: normal;'>Report</a></span> |
	<span class='chat section blacklist'><a href='javascript:;' onclick='chat_blacklist()' style='font-style: normal;'>Blacklist</a></span>
	<div class='chat section link' style='display:none;'></div>
</span></center>`, "chatdied", todom);
				}
				if (should_display_ad()) display_ad_in_chat();
				toggle_night(site_settings.night_mode);
			}
			scroll_down();
			break;
		}
		case events.namechange: {
			if (typeof details.old_name !== 'string') details.old_name = '';
			if (typeof details.new_name !== 'string') details.new_name = '';
			display_message_raw(senders.system, "", "</font>" + escape_html(details.old_name) + "<font color='#777777'> has changed their name to <font color='#66ccff'>" + escape_html(details.new_name) + "</font>", undefined, todom);
			//peer.name = details.new_name;
			break;
		}
		case events.checkingarchive: {
			display_message_raw(senders.system, "", "Looking through the archive... This might take a while!", undefined, todom);
			break;
		}
		case events.failedarchive: {
			clear_messages();
			display_message_raw(senders.system, "", "Chat not found. Are you sure you have the right link?", undefined, todom);
			break;
		}
		case events.temporarilyunavailable: {
			clear_messages();
			display_message_raw(senders.system, "", "This feature is TEMPORARILY unavailable.", undefined, todom);
			break;
		}
		case events.suggestnamechange: {
			display_message_raw(senders.system, "", "If you would like to change your name, <a class='chat button namechange' href='javascript:;' onclick='popup_change_name()'>tap here.</a>", "chatnamechange", todom);
			toggle_night(site_settings.night_mode);
			scroll_down();
			break;
		}
		case events.readstarter: {
			display_message_raw(senders.system, "", "<font><font color='#66ccff'>" + escape_html(peer.name) + "</font><font color='#777777'> has read your starter.", undefined, todom);
			break;
		}
	}

	if ((event <= 4 && event >= 1) || event == 9) all_messages.push({sender: senders.system, event: event, content: details});
}

function build_message_raw(sender, name, text, specialclass=undefined, dont_add_li=false) {
	var original_text = text;
	if (state != states.chatting && state != states.archive && state != states.timeout_chatting && sender != senders.system && specialclass != "starterclass") return;
	if (specialclass == "starterclass") specialclass = undefined;
	if (sender != senders.system) text = escape_html(text);
	if (sender != senders.system) text = markdown(text);
	//if (sender != senders.system) text = text.trim().replace(/\n+/g, '\n');
	if (text.length == 0) return;
	var message = "";
	if (!dont_add_li) {
		if (typeof specialclass === 'string') message += "<li class='list-group-item " + specialclass + "'>";
		else message += "<li class='list-group-item'>";
	}
	message += "<p>";
	switch (sender) {
		case senders.system:
			message += "<strong><i><font color='#777777'>" + text + "</font></i></strong>";
			break;
		case senders.me:
			if (last_sender != senders.me) message += "<strong>" + escape_html(name) + ":</strong> ";
			else message += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
			message += text;
			break;
		case senders.peer:
			if (last_sender != senders.peer) message += '<strong><font color=\'#66ccff\'>' + escape_html(name) + ':</font></strong> ';
			else message += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
			message += text;
			break;
		default:
			console.log("Breaking because sender " + sender);
			return;
	}
	message += "</p>";
	if (!dont_add_li) message += "</li>";
	return message;
}

function display_message_raw(sender, name, text, specialclass=undefined, todom=$list_messages) {
	//console.log("Callin display");
	var message = build_message_raw(sender, name, text, specialclass);
	if (!message) return;
	//console.log("After raw");
	message = jQuery(message);
	message.find('a').css({ 'color': (site_settings.night_mode? 'white' : 'black') });
	todom.append(jQuery(message));
	if (sender != senders.system) all_messages.push({sender: sender, name: name, content: text});
	last_sender = sender;
	set_font_size(site_settings.font_size);
}


function display_message(message, system = false) {
	if ((state != states.chatting && state != states.archive) && !system) return;
	var is_sender_me;
	switch (typeof message) {
		case 'object':
			is_sender_me = false;
			break;
		case 'string':
			is_sender_me = true;
			break;
		default:
			return;
	}
	var current_sender;
	var from, timestamp, content;
	if (system) {
		current_sender = senders.system;
		is_sender_me = false;
		from = "";
		timestamp = moment.utc(moment.unix(moment().unix()));
		content = message;
	}
	else if (state == states.archive && message.number == 2) {
		current_sender = senders.me;
		from = escape_html(message.name)
		timestamp = moment.utc(moment.unix(moment().unix()));
		content = escape_html(message.text);
	}
	else if (is_sender_me) {
		current_sender = senders.me;
		from = escape_html(me.name);
		timestamp = moment.utc(moment.unix(moment().unix()));
		content = escape_html(message);
	} else {
		current_sender = senders.peer;
		from = '<font color=\'#66ccff\'>' + escape_html(message.name) + '</font>';
		timestamp = moment.utc(moment.unix(message.timestamp));
		content = escape_html(message.text);
	}
	if (content.length == 0) return;
	var l = $('.list-group-item').length;
	if (last_sender == senders.empty || last_sender != current_sender || l == 0) {
		var $message = jQuery('<li class="list-group-item"></li>');
		//timestamp.local().format('h:mma')
		if(system)
			$message.append('<p><strong><i><font color ="#777777">' + content + '</font></i></strong></p>');
		else
			$message.append('<p><strong>' + from + ':</strong> '  + content + '</p>');
		$list_messages.append($message);
	} else {
		if(system)
			$('.list-group-item')[l-1].innerHTML += '<p><strong><i><font color ="#777777">' + content + '</font></i></strong></p>';
		else
			$('.list-group-item')[l-1].innerHTML += '<p>' + content + '</p>';
	}
	if(state != states.archive) {
		all_messages.push( {timestamp: timestamp, system: system, from: from, sender: current_sender, content: content} ); // for later
		scroll_down();
	}
	last_sender = current_sender;
	scroll_down();
}

function scroll_down() { $(".messages").scrollTop($(".messages")[0].scrollHeight); }

function clear_messages() {
	$('.list-group-item').remove();
	meta.shown_starter = false;
	meta.shown_interests = false;
	meta.shown_srp = false;
}

function show_clock_momentarily() {
	$('.messagewrapper').css({'position':'relative'});
	if (!site_settings.night_mode)
		$('#cooldownclock_black').css({'display':'block','position':'absolute','top':'5px','right':'5px', 'opacity':'0.15'});
	else
		$('#cooldownclock_white').css({'display':'block','position':'absolute','top':'5px','right':'5px', 'opacity':'0.15'});
	setTimeout(hide_clock, 1000);
}

function hide_clock() {
	$('#cooldownclock_black').css({'display':'none'});
	$('#cooldownclock_white').css({'display':'none'});
}

function send_message(text) {
	var please_wait =  new Date().getTime() - meta.last_time < 1000;
	if (!text.trim().length || (state != states.chatting && state != states.timeout_chatting) || please_wait) {
		if (please_wait) show_clock_momentarily();
		return;
	}
	meta.last_time = new Date().getTime();
	var message_id = me.message_count;
	me.message_count+=1;
	pending_messages[message_id] = get_timestamp();
	display_message_raw(senders.me, me.name, text);
	console.log("State is " + state);
	if (state == states.timeout_chatting) me.mqueue.push({ text: text, id: message_id });
	else if (state == states.chatting) socket.emit('message', { text: text, id: message_id });
	$text_message.val('');
	scroll_down();
}

function blast_message_queue() {
	me.mqueue.forEach(function blast(message) { socket.emit('message', message); });
	me.mqueue = [];
}

function change_name(new_name) {
	if (!new_name.length || state != states.chatting) return;
	display_message_system(events.namechange, {old_name: me.name, new_name: new_name, peer: false});
	me.name = new_name;
	socket.emit('namechange', new_name);
}

function initialize_elements() {

	// settings
	$text_name					= $('.settings.text.name');
	$text_interests				= $('.settings.text.interests');
	$text_blacklist				= $('.settings.text.blacklist');
	$text_starter = $('.settings.text.starter');
	$checkbox_night_mode		= $('.settings.checkbox.night_mode');
	$checkbox_cooldown 			= $('.settings.checkbox.cooldown');
	$checkbox_enforce_interests = $('.settings.checkbox.strictly_interests');
	$checkbox_expose_interests = $('.settings.checkbox.expose_interests');
	$checkbox_interests_timeout	= $('.settings.checkbox.interests_timeout');
	$checkbox_sound 			= $('.settings.checkbox.sound');
	$button_close_settings		= $('.settings.button.close');
	$button_connect_home = $('.home.button.connect');

	// chat
	$button_connect	= $('.chat.button.connect');
	$button_connect_desktop = $('.chat.button.connect.desktop');
	$button_send 	= $('.chat.button.send');
	$text_message	= $('.chat.text.message');
	$list_messages	= $('.chat.list.messages');

}

function initialize_tagify() {
	function watch_length_case(value) {
			if (value.length > 100) return "";
			console.log(value);
			return value.value.toLowerCase();
	}
	function onTagifyAddBlacklisted(e) {
		console.log("Blacklist " + e.detail.tag.innerHTML)
		/*if (site_settings.blacklist.includes(e.detail.tag.innerText)) return;
		try {
			if (e.detail.tag.innerText.length > 25) e.detail.tag.innerHTML = e.detail.tag.innerHTML.split("</span></div>")[0].substr(0,52+20) + "...</span></div>";
		} catch (e) {
			console.log("Error")
			console.log(e)
		}*/
		meta.elelelele = e;
	}
	function onTagifyAddInterest(e) {
		//if (e.detail.tag.innerText.length > 25) { e.detail.tag.remove(); return; }
	}

	function onTagifyToggleBlacklistLock(e) {
		whee = e;
		meta.whoo = e;
		console.log(e);
		let idx = e.detail.index;
		let name = $tagify_blacklist.getTagElms()[idx].innerText;
		//e.explicitOriginalTarget.style.backgroundColor='#66ccff';
		site_settings.locked_blacklist[name] = !site_settings.locked_blacklist[name];
		site_settings.blacklist[idx] = site_settings.locked_blacklist[name];
		save_settings_ui();
		console.log("new state is " + site_settings.locked_blacklist[name]);
		$tagify_blacklist.removeTag($tagify_blacklist.getTagElms()[idx]);
		$tagify_blacklist.addTags([{'value':name,'readonly':site_settings.locked_blacklist[name]}]);
	}

	$tagify_blacklist = new Tagify($text_blacklist[0], { transformTag: watch_length_case, maxTags: blacklist_limit });
	$tagify_blacklist.on('add', onTagifyAddBlacklisted);
	$tagify_blacklist.on('click', onTagifyToggleBlacklistLock);
	$tagify_interests = new Tagify($text_interests[0], { transformTag: watch_length_case, maxTags: 40 });
	$tagify_interests.on('add', onTagifyAddInterest);
}
var whee = undefined;

function display_which(one) {
	for (var i = 0; i < $button_connect_desktop.length; i++) {
		if (i == one) continue;
		$button_connect_desktop[i].style.display = 'none';
	}
	$button_connect_desktop[one].style.display = 'block';
}

function display_send(one) {
	for (var i = 0; i < $button_send.length; i++) {
		if (i == one) continue;
		$button_send[i].style.display = 'none';
	}
	$button_send[one].style.display = 'block';
}

function initialize_buttons() {
	function leave(event) {
	    save_settings_ui();
		event.preventDefault();
		switch (state) {
			case states.connecting:
			case states.connected:
				if (meta.archive_saving) {
					show_clock_momentarily()
					break;
				}
				if (state == states.searching) {
					console.log("Searching");
					break;
				}
				if ((Date.now() - meta.last_time) < 250) return;
				if (!socket.connected) break;
				meta.asked_to_leave = false;
				//$button_connect_desktop.attr('src','/static/media/leave.png');
				display_which(1);
				$button_connect.html('<p class="action-mobile-font">Leave</p>');
				console.log("bp0");
				if (!archive_chat_check()) connect();
				else connect(meta.archive_name, [meta.archive_room], [], "", true, false, false, false, 7);
				break;
			case states.archive:
				location.reload();
				break;
			case states.searching:
			case states.timeout_chatting:
			case states.timeout_searching:
			case states.chatting:
				if (!meta.asked_to_leave) {
					meta.asked_to_leave = true;
					//$button_connect_desktop.attr('src','/static/media/sure.png');
					display_which(2);
					$button_connect.html('<p class="action-mobile-font">Sure?</p>');
				} else {
					meta.asked_to_leave = false;
					//$button_connect_desktop.attr('src','/static/media/more.png');
					display_which(0);
					disconnect(dreasons.voluntary);
				}
				break;
			default: {
				alert("Golly gee! This is a bug. Now that you have seen it, please report it. State is " + state);
				break;
			}
		}
	}
	function send(event) {
	    event.preventDefault();
		if ($text_message.val().trim().length == 0) return;
		send_message($text_message.val());
	}
	
	$button_connect.on('click', leave);
	$button_send.on('click', send);
	$button_close_settings.on('click', function(event) {
		save_settings_ui();
	});
	$('.message').on('keypress',function(e) {
	    // HERE WE RESET THE LEAVE BUTTON
		if (typeof meta.beacon !== 'undefined') clearInterval(meta.beacon);
		if(e.which == 13 && !e.shiftKey) { // Enter
			send(e);
		} else if (e.which != 27) {
			meta.asked_to_leave = false;
			//$button_connect_desktop.attr('src','/static/media/leave.png');
			display_which(1);
			$button_connect.html('<p class="action-mobile-font">Leave</p>');
			//console.log("bp1");
		}
	});
    document.addEventListener("keydown", keyDownTextField, false);
    function keyDownTextField(e) {
	    if(e.which == 27 && $('#chat').is(':visible')) { // Escape (not in home page)
	        leave(e);
	    }
	}
}

function get_timestamp() { return moment.unix(); }

function escape_html(text) {
  var map = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function markdown(text) {
	if (text[0] == "\\") {
		text = text.substr(1);
		return text;
	}
	function greenify(text) {
		if (text.replace("&gt;", ">")[0] == '>') return '<span style="color: #b5bd68">' + text + '</span>';
		return text;
	}

	function urlify(text) {
		var urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.replace(urlRegex, function(url) {
			return '<a href="' + url + '" target="_blank">' + url + '</a>';
		})
	    // or alternatively
	    // return text.replace(urlRegex, '<a href="$1">$1</a>')
	}
	function prettify(text) {
		var italic_bold = /\*\*\*((.*?)?)\*\*\*/gm;
		var html = text.replace(bold, '<b><i>$1</i></b>');
		var bold = /\*\*((.*?)?)\*\*/gm;
		html = html.replace(bold, '<b>$1</b>');
		var italic = /\*((.*?)?)\*/gm;
		html = html.replace(italic, '<i>$1</i>');
		return html;
	}
	text = urlify(text);
	text = greenify(text);
	text = prettify(text);
	text = text.replace(/\\n/g, "<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
	text = text.replace(/\n/g, "<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
	return text;
}

function complain_raw(text) {
	socket.emit("complaint", {
		text: text
	});
}

var BstrapModal = function (title, body, buttons) {
	var title = title || "DEFAULT_TITLE", body = body || "This is an empty modal, aka a bug! Report if spotted in the wild.", buttons = buttons || [{ Value: "Close", Css: "btn-primary modal-ok" }];
	for (var i = 0; i < buttons.length; i++) {
		if (!buttons[i].Callback) {
			buttons[i].Callback = function (event) { BstrapModal.Close(); }
		}
	}
	var GetModalStructure = function () {
		var that = this;
		that.Id = BstrapModal.Id = Math.random();
		var buttonshtml = "";
		for (var i = 0; i < buttons.length; i++) {
			buttonshtml += "<button type='button' class='btn " + (buttons[i].Css||"") + "' name='btn" + that.Id + "'>" + (buttons[i].Value||"CLOSE") + "</button>";
		}
		return "<div class='modal fade' name='dynamiccustommodal' id='" + that.Id + "' tabindex='-1' role='dialog' data-backdrop='static' data-keyboard='false' aria-labelledby='" + that.Id + "Label'><div class='modal-dialog'><div class='modal-content "+((site_settings.night_mode == 1)? "dark":((site_settings.night_mode==2)?"amoled":""))+"'><div class='modal-header'><button type='button' class='close modal-white-close' onclick='BstrapModal.Close()'><span aria-hidden='true'>&times;</span></button><h4 class='modal-title'>" + title + "</h4></div><div class='modal-body'><div class='row'><div class='col-xs-12 col-md-12 col-sm-12 col-lg-12'>" + body + "</div></div></div><div class='modal-footer bg-default'><div class='col-xs-12 col-sm-12 col-lg-12'>" + buttonshtml + "</div></div></div></div></div>";
	}();
	BstrapModal.Delete = function () {
		var modals = document.getElementsByName("dynamiccustommodal");
		if (modals.length > 0) document.body.removeChild(modals[0]);
	};
	BstrapModal.Close = function () {
		$(document.getElementById(BstrapModal.Id)).modal('hide');
		BstrapModal.Delete();
	};	
	this.Show = function () {
		BstrapModal.Delete();
		document.body.appendChild($(GetModalStructure)[0]);
		var btns = document.querySelectorAll("button[name='btn" + BstrapModal.Id + "']");
		for (var i = 0; i < btns.length; i++) {
			btns[i].addEventListener("click", buttons[i].Callback || BstrapModal.Close);
		}
		$(document.getElementById(BstrapModal.Id)).modal('show');
	};
};

function complain(text) {
	if (text.trim().length < 5 || text.trim().split(" ").length < 2) {
		$('.form-control.text.complaint').addClass('form-control-error');
		$('.form-control.text.complaint').click(function() { $('.form-control.text.complaint').removeClass('form-control-error'); });
		return;
	}
	complain_raw(text);
	$(".complaintfield")[0].innerHTML = "<center>Thanks!</center>";
}

function show_generic_modal(title, content) {
	new BstrapModal(title, content, [{Value: 'Close', Css: 'btn-default'}]).Show();
}

function chat_report() {
	new BstrapModal("Confirmation", "Check an appropriate box:<br><br><input type=\"radio\" name=\"reportradio\" value=\"1\"><label style=\"margin-left:5px;\"> Denial of Service (e.g. bot)</label><br><input type=\"radio\" name=\"reportradio\" value=\"2\"><label style=\"margin-left:5px;\"> Phishing or hacking attempt</label><br><input type=\"radio\" name=\"reportradio\" value=\"3\"><label style=\"margin-left:5px;\"> Illegal content</label><br><input type=\"radio\" name=\"reportradio\" value=\"4\"><label style=\"margin-left:5px;\"> Content inappropriate for section</label><br><input type=\"radio\" name=\"reportradio\" value=\"5\"><label style=\"margin-left:5px;\"> Actual minor (NON RP!)</label>", [
	{
		Value: 'Cancel',
		Css: 'btn-default'
	},
	{
		Value: 'Report',
		Css: 'btn-primary modal-ok',
		Callback: function(event) {
			let selected = $("[name=\"reportradio\"]:checked").val();
			console.log("Selected value is " + selected);
			if (!selected) return;
			generate_new_archive(true);
			complain_raw("SYSREPORT:"+me.archive_identifier+",REASON:"+selected);
			$('.chat.section.report')[0].innerHTML = "<strong><i><font color='#777777'>Reported</font></i></strong>";
			BstrapModal.Close();
		}
	}
	]).Show();
}

function show_content_guidelines() {
	let text = `<p style=\"text-align:left; overflow-y: scroll;\">
We have defined 3 types of content:<br>
<br>
<b>- CLEAN CONTENT:</b><br>
...is neither offensive, nor sexual.<br>
Permitted in all sections.<br>
<br>
<b>- NSFW CONTENT:</b><br>
...is not offensive, but is potentially or inherently sexual.<br>
- Permitted in sections: NSFW, Edgy.<br>
<br>
<b>- EDGY CONTENT:</b><br>
...is anything that wouldn't be considered "CLEAN" or "NSFW" as defined.<br>
Including, but not limited to: underaged roleplay characters, fetishism, etc<br>
Must append (RP) to name if roleplaying.<br>
Permitted in section: Edgy.<br>
<br>
As per TOS, you must be of age in your country of residence, and 18 at least.<br>
</p>`;
	show_generic_modal("Content Guidelines", text); 
}

function show_tos(ask_to_accept) {
	let text = `<p style=\"text-align:left; overflow-y: scroll;\" class=\"modal-tos-p\">
By using Sham.chat (\"the website\", \"site\", \"we\", \"us\", \"staff\"), you acknowledge that you have read, FULLY UNDERSTOOD and AGREE to the terms detailed in this page.<br>
<br>
- <b>Age Restriction:</b><br>
You must be over 18 years of age in order to use the website. Otherwise, leave immediately.<br>
- <b>No illegal content:</b><br>
Do not send any content that might be illegal in your country, in the USA or in Israel.<br>
- <b>Links:</b><br>
Do not send any images/videos that are sexually explicit and/or depicting minors, real or imaginary, or links to such.<br>
- <b>Freedom of speech:</b><br>
All messages, names, or other user-produced content exchanged on the website shall be regarded as works of fiction.<br>
- <b>Responsibilities:</b><br>The website is not responsible for, nor does it endorse any of the actions of its users or their implications. Rather, every user is responsible for their own actions and conduct on the website. The use of the website is solely at your own risk and responsibility.<br>
- <b>Damages:</b><br>
We are not liable in any way for any kind of damages in any way related to the use of the website.<br>
- <b>We can use your data:</b><br>
By exchanging data (including chat messages and usernames) on the website, you allow us to make unrestricted usage of the data.<br>
- <b>No automation:</b><br>
Automation of site functions is prohibited.<br>
- <b>Advertisements:</b><br>
We serve advertisements via Google Adsense.<br>
- <b>Cookies:</b><br>
By using the website, you agree to the usage of cookies.<br>
- <b>No warranty:</b><br>
The website is provided \"as is\", and without warranty of any kind.<br>
- <b>Bans:</b><br>
Site staff may ban or limit users from accessing the website or parts of it for any reason.<br>
It is forbidden to bypass, or attempt to bypass, a restriction or a ban set by staff.<br>
- <b>TOS may be changed at any time:</b><br>
Site staff may change or alter the terms of service at any time and without notifying you. It is your responsibility to make sure that you are up to date with the terms of service.<br>
</p>`;
	let buttons = [];
	if (!ask_to_accept) {
		buttons.push({Value: 'Close', Css: 'btn-default'});
	} else {
		buttons.push({
			Value: 'Reject',
			Css: 'btn-default modal-no',
			Callback: function(event) {
				window.location = '/static/418.shtml';
			}
		});
		buttons.push({
			Value: 'I understand and agree',
			Css: 'btn-primary modal-ok',
			Callback: function(event) {
				$('#all').fadeIn();
				site_settings.accepted_tos = true;
				save_settings();
				BstrapModal.Close();
				check_announcement();
			}
		});
	}
	new BstrapModal("Terms of Service", text, buttons).Show();
	if (ask_to_accept) $('.close.modal-white-close').hide();
}

function chat_feature() {
	var answer = window.confirm("Are you sure you want to submit this chat?");
	if (!answer) return;
	generate_new_archive();
	complain_raw("SYSFEATURE:"+me.archive_identifier);
	$('.chat.section.feature')[0].innerHTML = "<strong><i><font color='#777777'>Submitted. Thank you!</font></i></strong>";
}

function get_blacklist_object(name) {
	return {'value':name.replace(/\,/g,' '),'title':name, 'readonly':false};
}

function chat_feature() {
	new BstrapModal("Confirmation", "Are you sure you want to submit this chat?", [
	{
		Value: 'No',
		Css: 'btn-default'
	},
	{
		Value: 'Yes',
		Css: 'btn-primary modal-ok',
		Callback: function(event) {
			generate_new_archive();
			complain_raw("SYSFEATURE:"+me.archive_identifier);
			$('.chat.section.feature')[0].innerHTML = "<strong><i><font color='#777777'>Submitted</font></i></strong>";
			BstrapModal.Close();
		}
	}
	]).Show();
}

function chat_archive() {
	new BstrapModal("Confirmation", "Are you sure you want to archive this chat?", [
	{
		Value: 'No',
		Css: 'btn-default'
	},
	{
		Value: 'Yes',
		Css: 'btn-primary modal-ok',
		Callback: function(event) {
			generate_new_archive();
			BstrapModal.Close();
		}
	}
	]).Show();
}

function chat_blacklist() {
	if (typeof peer.name !== 'string') return;
	load_settings(); // tab concurrency
	if (site_settings.blacklist.length >= blacklist_limit) {
		let blacklisted = $tagify_blacklist.getTagElms();
		let i = 0;
		for (i = 0; i < blacklisted.length && site_settings.locked_blacklist[blacklisted[i].innerText]; i++);
		if (i == blacklisted.length) {
			$('.chat.section.blacklist')[0].innerHTML = "<strong><i><font color='#777777'>Blacklist Full</font></i></strong>";
			return;
		}
		$tagify_blacklist.removeTag(blacklisted[i]);
	}
	
	//let blobject = {'value':peer.name.replace(/\,/g,' '), 'readonly':false}
	let blobject = get_blacklist_object(meta.eternal_name);
	site_settings.blacklist.push(blobject);
	$tagify_blacklist.addTags([blobject]);
	$('.chat.section.blacklist')[0].innerHTML = "<strong><i><font color='#777777'>Blacklisted</font></i></strong>";
	save_settings();
}

function announce_scary(text, timeout) {
	if (meta.announcement_time < 0) return;
	if (!timeout) timeout = 3000;
	let time = (new Date()).getTime();
	$('.r18name')[0].innerHTML = '<center>'+text+'</center>';
	$('.r18name').css({'display':''});
	meta.announcement_time = timeout != -2? time : -2;;
	if (timeout >= 0) setTimeout(function() {
		if (meta.announcement_time != time) return;
		$('.r18name').css({'display':'none'});
	}, timeout);
}

function name_bad_ui() {
	let bad = name_bad($text_name.val());
	let allowed_clean = !bad[0] && !bad[1];
	let allowed_srp = !bad[1];

	if (!allowed_clean) {
		site_settings.srp &= constants.FLAG_SRP + constants.FLAG_EDGY;
		$("input[name='srpradio']")[0].checked = false;
	}
	if (!allowed_srp) {
		site_settings.srp &= constants.FLAG_EDGY;
		$("input[name='srpradio']")[1].checked = false;
	}

	if (allowed_clean && allowed_srp) return;
	let s = "";
	if (!!bad[0] && site_settings.srp&constants.FLAG_CLEAN) s += "\""+bad[0]+"\" is forbidden in Clean";
	if (!!bad[1] && site_settings.srp&(constants.FLAG_SRP|constants.FLAG_CLEAN)) {
		if (s.length) s += "<br>";
		s += "\""+bad[1]+"\" is only permitted in Edgy";
	}
	announce_scary(s, 4000);
}

function setupSysDarkMode() {
	function setLight() {
		meta.sys_dark_mode = false;
	}

	function setDark() {
		meta.sys_dark_mode = true;
	}


	const matcher = window.matchMedia('(prefers-color-scheme:dark)');
	function onUpdate() {
		if (matcher.matches) {
			setDark();
		} else {
			setLight();
		}
	}
	matcher.addListener(onUpdate);
	onUpdate();
}


function archive_chat_check() {
	let parts = window.location.hash.substr(1).split("_");
	if (parts.length != 2) return false;
	meta.archive_cid = parts[0];
	meta.archive_room = parts[1];
	return true;
}

$(document).ready(function() {
	console.log("Document loaded");
	socket = io({transports: ['websocket'], upgrade: false});
	console.log("Created socket");
	meta.home = true;
	initialize_elements();
	initialize_tagify();
	initialize_callbacks();
	try {
		load_settings_ui();
	} catch (e) {
		console.log("Resetting settings to avoid fatal injuries");
		localStorage.setItem('site_settings', {});
		load_settings_ui();
	}
	initialize_buttons();

	if (!site_settings.accepted_tos) show_tos(true);

	thread_typing_check = setInterval(tf_typing_check, delay_typing_check);
	if (window.location.hash) {
		cid = window.location.hash.substr(1);
		if(cid.length == 10) old_format_archive(cid);
		else {
			if (cid.split("_").length == 2) cid = cid.split("_")[0];
			new_format_archive(cid);
			archive_chat_check();
		}
	}

	$text_name.on('change keydown paste input', function(){
		name_bad_ui();
	});

	window.onfocus = function () {
		if (typeof meta.beacon !== 'undefined') clearInterval(meta.beacon);
		beacon_toggle(false);
		meta.focused = true;
	};
	$(window).bind('hashchange', function() {
		location.reload();
		console.log("Hash changed");
	});
	window.onblur = function () { meta.focused = false; };
	meta.notisound = new Audio('/static/media/notification.mp3');
	meta.discosound = new Audio('/static/media/disconnect.mp3');
	var hats = $('.hat');
	for (var i = 0; i < hats.length; i++) {
		move_hat(hats[i]);
	}
	$(window).bind('beforeunload', function(){
		if (state != states.chatting && state != states.matching) return;
		if (meta.archive_saving) return 'Are you sure you want to leave?';
	});
	display_featured();
	//$('.tagify.character.settings.text.blacklist').css({'overflow':'auto', 'flex-wrap':'unset'})
	setupSysDarkMode();

	$(document).keydown(function(e) {
		if (document.activeElement.type !== 'textarea' && document.activeElement.type !== 'text') {
			switch(e.keyCode) {
				case 83: { //s
					if (!site_settings.hot_s) break;
					show_starter();
					break;
				}
				case 66: { //b
					if (!site_settings.hot_b) break;
					if (state == states.connected) chat_blacklist();
					break;
				}
				default:
					break;
			}
		}
	});

	(adsbygoogle = window.adsbygoogle || []).push({});
});
