// Google translate Discord bot by HitCoder. Feel free to add to your own bot anything from here.
const prefix = "!"; // This is how you want your commands prefixed.
const botToken = '' // Place your bot's token in here.

var translate = require('node-google-translate-skidz'); // npm install node-google-translate-skidz
var Discordie = require("discordie");
const Events = Discordie.Events;
const client = new Discordie();

client.connect({
	token: botToken
});

client.Dispatcher.on(Events.GATEWAY_READY, e => {
	console.log('connected as: '+client.User.username);
	console.log('*** BOT IS READY ***');
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
	var msg = e.message.content; // shortcut to the message content
	var cmdpos = prefix.length; // something I use in all scripts with commands to get the position after the prefix.
	var command = msg.substring(cmdpos,msg.length);
	var args = command.split(" "); // split each word in the message into arguments.
	if (msg.indexOf(prefix)==0){
		console.log(args[0]);
		if (args[0]=="translate" || args[0]=="trans"){
			var fromlang = args[1];
			var tolang = args[2];
			var original = command.replace(args[0]+" "+fromlang+" "+tolang+" ","");
			translate({
				text: original,
				source: fromlang,
				target: tolang
			}, function(result){
				e.message.channel.sendMessage(result);
			});
		}
	}
});
