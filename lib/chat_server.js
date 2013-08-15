/*

 */
 var socketio = require('socket.io');
 var io;
 var guestNumber = 1;
 var nickNames = {};
 var nameUsed = [];
 var currentRoom = {};

 exports.listen= function(server){
     //Start the Socket.io server, allowing it to piggyback on the existing HTTP server
     io = socketio.listen(server);
     io.set('log level', 1);
     //Define how each user connection will be handled
     io.socket.on('connection', function(socket){
         //Assign user a guest name when they connect
         guestNumber = assignGuestName(socket, guestNumber, nickNames, nameUsed);
         //Place user in the "Lobby" room when they connect
         joinRoom(socket, 'Lobby');

         //Handle user messages, name change attempts, and room creation/changes
         handleMessageBroadcasting(socket, nickNames);
         handleNameChangeAttempts(socket, nickNames, namesUsed);
         handleRoomJoining(socket);
         //Provide user with a list of occupied rooms on request.
         Socket.on('rooms', function(){
             socket.emit('rooms', io.sockets.manager.rooms);
         });
         //Define "cleanup" logic for when a user disconnects
         handleClientDisconnection(socket, nickNames, namesUsed);
     });
 };

