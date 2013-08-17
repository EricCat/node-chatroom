/*

 */
 var socketio = require('socket.io');
 var io;
 var guestNumber = 1;
 var nickNames = {};
 var nameUsed = [];
 var currentRoom = {};

 exports.listen = function(server){
     //Start the Socket.io server, allowing it to piggyback on the existing HTTP server
     io = socketio.listen(server);
     io.set('log level', 1);
     //Define how each user connection will be handled
     io.sockets.on('connection', function(socket){
         //Assign user a guest name when they connect
         guestNumber = assignGuestName(socket, guestNumber, nickNames, nameUsed);
         //Place user in the "Lobby" room when they connect
         joinRoom(socket, 'Lobby');

         //Handle user messages, name change attempts, and room creation/changes
         handleMessageBroadcasting(socket, nickNames);
         handleNameChangeAttempts(socket, nickNames, namesUsed);
         handleRoomJoining(socket);
         //Provide user with a list of occupied rooms on request.
         socket.on('rooms', function(){
             socket.emit('rooms', io.sockets.manager.rooms);
         });
         //Define "cleanup" logic for when a user disconnects
         handleClientDisconnection(socket, nickNames, namesUsed);
     });
 };

 //Assigning a guest name
 function assignGuestName(socket, guestNumber, nickNames, nameUsed){
     var name = 'Guest' + guestNumber;
     nickNames[socket.id] = name;
     //Let user know their guest name
     socket.emit('nameResult', {
         success: true,
         name: name
     });
     //Note that guest name is now used
     nameUsed.push(name);
     return guestNumber + 1;
 }

 //JOINING ROOMS
 function joinRoom(socket, room){
     //Make user join room
     socket.join(room);
     //Note that user is now in this room
     currentRoom[socket.id] = room;
     //Let user know they're now in a new room
     socket.emit('joinResult', {room: room});
     //Let other users in room know that a user has joined
     socket.broadcast.to(room).emit('message', {
         text: nickNames[socket.id] + 'has joined' + room +'.'});
     //Determine what other users are in the same room as the user
     var usersInRoom = io.sockets.clients(room);
     //If other users exist, summarize who they are
     if(usersInRoom.length > 1){
         var usersInRoomSummary = 'Users currently in ' + room + ':';
         for (var index in usersInRoom){
             var userSocketId = usersInRoom[index].id;
             if(userSocketId != socket.id){
                 if(index > 0){
                     usersInRoomSummary += ',';
                 }
                 usersInRoomSummary += nickNames[userSocketId];
             }
             usersInRoomSummary += '.';
             //Send the summary of other users in the room to the user
             socket.emit('message', {text: usersInRoomSummary});
         }
     }
 }

 //HANDLING NAME CHANGE REQUESTS
 function handleNameChangeAttempts(socket, nickNames, namesUsed){
     //Added listener for nameAttempt events
     socket.on('nameAttempt', function(name){
           //Don't allow nicknames to begin with "Guest"
           if(name.indexOf('Guest') == 0) {
               socket.emit('nameResult', {
                   success: false,
                   message: 'Names cannot begin with "Guest".'
               });
           } else {
               //If the name isn't already registered, register it
               if(namesUsed.indexOf(name) == -1) {
                   var prevName = nickNames[socket.id];
                   var prevNameIndex = namesUsed.indexOf(prevName);
                   namesUsed.push(name);
                   nickNames[socket.id] = name;
                   //Remove previous name to make available to other clients.
                   delete namesUsed[prevNameIndex];
                   socket.emit('nameResult', {
                       success: true,
                       name: name
                   });
               } else {
                   //Send an error to the client if the name's already registered
                   socket.emit('nameResult', {
                       success: false,
                       message: 'That name is already in use.'
                   });
               }
           }
     });
 }

 //SENDING CHAT MESSAGES
 function handleMessageBroadcasting(socket, nickNames){
     socket.on('message', function(message){
         socket.broadcast.to(message.room).emit('message', {
             text: nickNames[socket.id] + ': ' + message.text
         });
     });
 }

 //CREATING ROOMS
 function handleRoomJoining(socket){
     socket.on('join', function(room){
         socket.leave(currentRoom[socket.id]);
         joinRoom(socket, room.newroom);
     });
 }

 //HANDLING USER DISCONNECTIONS
 function handleClientDisconnection(socket, nickNames, nameUsed){
     socket.on('disconnect', function(){
         var nameIndex = nameUsed.indexOf(nickNames[socket.id]);
         delete nameUsed[nameIndex];
         delete nickNames[socket.id];
     });
 }