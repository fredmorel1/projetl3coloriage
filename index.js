const express = require('express');
const socketio = require('socket.io');

const mime = require('mime');
mime.define({'application/javascript': ['js']}, {force: true});
console.log(mime.getType('js')); // application/javascript

const path = require('path');
const app = express();
const server = app.listen(8080, function() {
  console.log("C'est parti ! En attente de connexion sur le port 8080...");
});


const { Server } = require("socket.io");
const io = new Server(server);

app.use('/bootstrap/css', express.static(path.join(__dirname,'node_modules/bootstrap/dist/css')));
app.use(express.static('public'));
// set up to 
app.get('/', function(req, res) {  
    res.sendFile(__dirname + '/public/html/jeucoloriage.html');
});

const player1 = {
  attaquant: false,
  ready: false,
  host: true,
  playedCell: "",
  username: "",
  turn: false,
  win: false
};

const player2 = {
  attaquant: false,
  ready: false,
  host: false,
  playedCell: "",
  username: "",
  turn: false,
  win: false
};

let players = [];

io.on('connection', function (socket) {
  console.log('Nouvel utilisateur connecté !');

  /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
  socket.on("login", function(id) {
    if (players.length == 1) {
      if (id == players[0].username){
        console.log("Erreur, le pseudo "+id+" est déjà pris");
        socket.emit("erreur-connexion","Le pseudo est déjà pris");
        return;
      }
    }
    if(players.length == 2){
      console.log("salut");
      players = [];
    }
    currentID = id;
    if (players.length == 1) {
      player2.username = currentID; 
      players.push(player2);
      console.log(players[0]);
    }else{
      player1.username = currentID;
      players.push(player1);
    }

    console.log("Nouveau joueur : " + currentID);
    
    if (players.length >= 2) {
      console.log('Deux joueurs connectés !');
      io.emit("full", players);
      socket.to(players[0]).emit("formGameMaster");
      socket.to(players[1]).emit("formGuest");
      return;
    }
  });

  socket.on("startGame", function(data) {
    console.log(data);
    console.log(players);
    if(data[0] == 0){
      players[1].ready = true;
      if(data[1] == "Attaquant"){
        players[1].attaquant = true;
      }
      console.log("L'invité a choisi le rôle : " + data[1]);
    }else{
      players[0].ready = true;
      if(data[1] == "Attaquant"){
        players[0].attaquant = true;
      }
      console.log("L'hôte a choisi le rôle : " + data[1]);
      console.log("\t\tLe nombre de noeuds : " + data[2]);
      console.log("\t\tLe nombre de couleurs : " + data[0]);
    }
    if(players[0].ready == true && players[1].ready == true){
      console.log("hello1");
      io.emit("goJeuCouleurs", data);
    }
    if(players[0].ready == false){
      console.log("hello");
      socket.broadcast.emit("waitingPlayer",players[1]);
    }
    if(players[1].ready == false){
      console.log("hello2");
      socket.broadcast.emit("waitingPlayer",players[0]);
    }
  });

  socket.on("cliqueSommet", function(data) {
    console.log("Un joueur a colorié un sommet", data[1]);
    io.emit("reponseSommet", data);
  });

  /*socket.on('mise à jour sommet', (data) => {
    // Mettez à jour l'interface utilisateur en fonction des données reçues
  });
  
  // Envoyer une demande de coloriage au serveur
  socket.emit('colorie sommet', data);*/
  
  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté !');
    socket.broadcast.emit("out");
    players = players.filter((p) => p !== socket);
  });

  socket.on('logout', () => {
    console.log('Joueur déconnecté !');
    players = players.filter((p) => p !== socket);
    socket.emit("out");
  });

});
