/*
 */
 //display untrusted content created by other users rather than the system.
 function divEscapedContentElement (message){
     return $('<div></div>').text(message);
 }

 //display trusted content created by the system rather than other users.
 function divSystemContentElement(message){
     return $('<div></div>').html('<i>' + message + '</i>');
 }

 //processing raw user input
 function processUserInput(chatApp, socket) {
     var message = $('#send-message').val();
     var systemMessage;
     //If user input begins with a slash, treat it as a command
     if (message.charAt(0) == '/') {
         systemMessage = chatApp.processCommand(message);
         if (systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
         }
     } else {
         //Broadcast non-command input to other users
         chatApp.sendMessage($('#room').text(), message);
         $('#messages').append(divEscapedContentElement(message));
         $('#messages').scrollTop($('#messages').prop('scrollHeight'));
     }
     $('#send-message').val('');
}