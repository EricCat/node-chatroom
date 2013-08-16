/*
 */
 var chat = function(socket){
     this.socket = socket;
 };

 //send chat messages
 chat.prototype.sendMessage = function(room, text){
     var message = {
         room: room,
         text: text
     };
     this.socket.emit('message', message);
 };

 //change rooms
 chat.prototype.changeRoom = function(room){
     this.socket.emit('join', {
         newRoom: room
     });
 };

 //Processing chat commands
 chat.prototype.processCommand = function(command){
     var word = command.split(' ');
     command = word[0].substring(1, word[0].length).toLowerCase();
     var message = false;
     switch(command){
         case 'join':
             word.shift();
             var room = word.join(' ');
             this.changeRoom(room);
             break;
         case 'nick':
             word.shift();
             var name = word.join(' ');
             this.socket.emit('nameAttempt', name);
             break;
         default :
             message = 'Unrecognized command.';
             break;
     }
     return message;
 };