const prefix = "!"; // This is how you want your commands prefixed.

const botToken = '' // Place your bot's API key in here
const googleApiKey = '' // Place your google API key in here

//Initialise and reference the requirements
var Discordie = require("discordie");
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var ytdl = require('ytdl-core');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

//Create constants and global variables.
const Events = Discordie.Events;
const client = new Discordie();
var songREQUEST = {};
var currentPlaying;
var helpEnabled = true;
var ytdlInProgress = false;
var isPlaying = false;

//Connect this client to the bot.
function connect(){
	client.connect({
		token: botToken
	});
}
connect();

console.log('Last update on Wednesday 26th October 2016');
console.log('Music bot by HitCoder for Hybrid/Kirbo.');

//Tell the host that the bot is up and running.
client.Dispatcher.on(Events.GATEWAY_READY, e => {
	console.log('Connected as: '+client.User.username);
	console.log('*** BOT IS READY ***');
});

//If the bot loses connection then retry.
client.Dispatcher.on(Discordie.Events.DISCONNECTED, (e) => {
	const delay = 5000;
	const sdelay = Math.floor(delay/100)/10;

	if (e.error.message.indexOf("gateway") >= 0) {
		console.log("Disconnected from gateway, resuming in " + sdelay + " seconds");
	} else {
		console.log("Failed to log in or get gateway, reconnecting in " + sdelay + " seconds");
	}
	setTimeout(connect, delay);
});

//initialise playing variable to check if music is running.
var playing = false;

//For each message created check its contents;
client.Dispatcher.on(Discordie.Events.MESSAGE_CREATE, (e) => {
	//small var for the contents of messages.
	var msg = e.message.content;
	//variable to reference when the command starts.
	var cmdpos = prefix.length;
	
	//Check the prefix has been used, if so check for commands.
	if (msg.indexOf(prefix) == 0){
		//command is everything entered after the prefix, so alias it with a variable
		var command = msg.substring(cmdpos,msg.length);
		//Tell the host what command has been executed.
		console.log(command+" executed");
		
		//Command to summon the bot.
		if (command == "summon"){
			var guild = e.message.guild;
			if (guild) {
				var vc = e.message.author.getVoiceChannel(guild);
				if (vc)
					return vc.join(false, false);

				return console.log("Channel not found");
			}
		console.log("Guild not found");
		}

		//Check what song is playing and whom requested it.
		if (command=="playing"){
			if((playing) && (currentPlaying)) {
				e.message.channel.sendMessage('```Currently playing... "'+currentPlaying[0]+'" - Requested by '+currentPlaying[1]+'```\n'+currentPlaying[2]);
			}else{
				e.message.channel.sendMessage("/shrug Apparently the queue is empty.")
			}
			return;
		}
		
		//Command to start playing music.
		if (command.indexOf("play")==0){
			if (command.length > 5){
				getVideo(command.substring(5,command.length),e);
				if(!client.VoiceConnections.length) {
					return e.message.reply("Not connected to any channel");
				}
				if (isPlaying == false){
					start();
					e.message.channel.sendMessage("The song will play as soon as the download is complete.");
					playing = true;
				}
			}else{
				if(!client.VoiceConnections.length) {
					return e.message.reply("Not connected to any channel");
				}
				start();
				playing = true;
			}
			
			return;
		}

		//Command to stop the currently playing song.
		if (command=="stop"){
			stop();
			playing = false;
			return;
		}

		//Tell the bot to leave the voice channel.
		if (command=="leave"){
			client.User.getVoiceChannel(e.message.guild).leave();
			return;
		}

		//Request the next song to be added to the playlist.
		if (command.indexOf("request")==0){
			getVideo(command.substring(8,command.length),e);
			return;
		}

		//check the queue
		if (command=="queue"){
			var keys = Object.keys(songREQUEST);
			if (keys.length<=0){ e.message.channel.sendMessage("The queue is empty."); return;}
			var qList = "```";
			for (i = 0; i < keys.length; i++){
				var qIndex = [songREQUEST[keys[i]]['title'],songREQUEST[keys[i]]['user']];
				qList = qList+'"'+qIndex[0]+'" - Requested by '+qIndex[1]+"\n\n";
			}
			qList = qList+"```";
			e.message.channel.sendMessage(qList);
			return;
		}

		//Skip the song that's currently playing/
		if (command=="skip"){
			if(playing) {
				stop();
				playing = false;
				
				setTimeout(function() {
					var delKeys = Object.keys(songREQUEST);
					fs.unlink(songREQUEST[delKeys[0]]['filename'],function(err) {
						if(err) {
							return console.log(err);
						}
					});
					var title = songREQUEST[delKeys[0]]['title'];
					delete songREQUEST[delKeys[0]];
					e.message.channel.sendMessage('```Skipped "'+title+'"```');
					
					start();
					playing = true;
				},1000);
			}
		}

		if (command == "commands" || command == "help"){
			e.message.channel.sendMessage("All commands are prefixed with `"+prefix+"`\nCommands are:");
			e.message.channel.sendMessage(
				'```'+
				'"help"/"commands" - show this message.\n\n'+
				'"summon" - Summon me to the voice channel you are currently connected to.\n\n'+
				'"play" - Play the first song in the queue, or add a song to the queue.\n\n'+
				'"request" - An alternative command to request a song to be added to the queue.\n\n'+
				'"skip" - Skip the song that is currently playing.\n\n'+
				'"leave" - Kick me from the voice channel I am in.\n\n'+
				'"playing" - Check what song is currently playing, who requested it, and the song\'s source location.\n\n'+
				'"queue" - Check what songs are currently in the queue.\n\n'+
				'"stop" - Stop the currently playing song.'+
				'```'
			);
		}

		//Commands for Hybrid only;
		if(e.message.author.id == '95661451213025280') {
			if (command=="nowplaying"){
				client.User.setGame(command.substring(11,command.length));
			}
			if (command=="setname"){
				client.User.setUserName(command.substring(8,command.length));
			}
		}
		
	}
});

function getVideo(url,e){
	//Request a new song to be played
	if(url.indexOf('http://') == 0 || url.indexOf('https://') == 0) {
		//Get the Youtube videoID
		var videoID = youtube_parser(url);
		if(videoID) {
			//Get data from the YouTube API!
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = handleStateChange;
			xhr.open('GET','https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet&id='+videoID+'&key='+googleApiKey,true); //Use your API Key!
			xhr.send();
				
			function handleStateChange() {
				if(this.readyState == 4) {
					//Get the data
					var resp = JSON.parse(this.responseText);
								
					if(resp['items'] != '') {
						var title = resp['items'][0]['snippet']['title'];
						
						//Valid videoID, add it to the queue
						addSONG(e.message.author.id,e.message.author.username,url,title,videoID);
						e.message.reply('```"'+title+'" has been added to the Queue```');
					}
				}
			}
		} else {
			e.message.reply('`No videoID found in the link`');
		}
	} else {
		if(url.indexOf('www.')==0){
			getVideo("http://"+url);
		}else{
			e.message.channel.sendMessage("erroneous web adress. Try again?");
		}
	}
}

//Add song to Queue
function addSONG(userID,user,url,title,videoID) {
	//Download the audio from the youtube URL
	//filter is set to AUDIO ONLY, as the audio is the only thing that will be used,
	//and this will also save internet bandwidth as well as storage space.
	ytdlInProgress = true;
	ytdl(url,{format:'mp3',filter:'audioonly'})
	.pipe(fs.createWriteStream(videoID+'.mp3'))
	.on('finish', function(){
		//Add to the Queue with relevant information
		songREQUEST[videoID] = {
			'filename': videoID+'.mp3',
			'title': title,
			'user': user,
			'userID': userID,
			'URL': url
		};
		console.log(songREQUEST[videoID]);
		ytdlInProgress = false;
	});
	
}

//YouTube videoID REGEX
function youtube_parser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}
//Credits to 'Lasnv' on StackOverflow (http://stackoverflow.com/users/1064371/lasnv) for the code above

var ffmpeg = null;
function stop() {
	stopPlaying = true;
	if (!ffmpeg) return;
	ffmpeg.stop();
	ffmpeg = null;
}

var stopPlaying = false;
function start(vCI){
	stopPlaying = false;

	// Check there is something in the queue.
	var keys = Object.keys(songREQUEST);
	if (keys.length > 0){
		var file = songREQUEST[keys[0]]['filename'];
		currentPlaying = [songREQUEST[keys[0]]['title'],songREQUEST[keys[0]]['user'],songREQUEST[keys[0]]['URL']];
		var stats = fs.statSync(file)
 		var fileSizeInBytes = stats["size"]
 		if (fileSizeInBytes<=1000){
 			setTimeout(function(){start(vCI);},3000)
 			return;
 		}
 		if (!client.VoiceConnections.length) {
			return console.log("Voice not connected");
		}
		if (!vCI) vCI = client.VoiceConnections[0];
		ffmpeg = vCI.voiceConnection.createExternalEncoder({
			type: "ffmpeg",
			source: file
		});
		if (!ffmpeg) return console.log("Voice connection is no longer valid");
		ffmpeg.once("end", () => {
			if (stopPlaying) return;
			fs.unlink(songREQUEST[keys[0]]['filename'],function(err) {
				if(err) {
					return console.log(err);
				}
			});
			delete songREQUEST[keys[0]];
			isPlaying = false;
			setTimeout(start, 100, vCI);
		});
		var encoderStream = ffmpeg.play();
		isPlaying = true;
		encoderStream.resetTimestamp();
		encoderStream.removeAllListeners("timestamp");
		//encoderStream.on("timestamp", time => console.log("Time " + time));
	}else if (ytdlInProgress = true){
		setTimeout(function(){
			start(vCI);
		},1000);
	}
}
