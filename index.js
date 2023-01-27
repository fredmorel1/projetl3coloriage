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
  turn: true,
  win: false
};

const player2 = {
  attaquant: false,
  ready: false,
  host: false,
  playedCell: "",
  username: "",
  turn: true,
  win: false
};

let players = [];

io.on('connection', function (socket) {
  console.log('Nouvel utilisateur connecté !');
  var currentID = null;
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
        console.log("NON");
        players[1].attaquant = true;
        players[1].turn = false;
      }
      console.log("L'invité a choisi le rôle : " + data[1]);
    }else{
      players[0].ready = true;
      if(data[1] == "Attaquant"){
        players[0].attaquant = true;
        players[0].turn = false;
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
    console.log(data);
    console.log(data[2]);
    if(data[2] == player1.username && player1.turn == false){
      socket.emit("notYourTurn");
      return;
    }
    if(data[2] == player2.username && player2.turn == false){
      socket.emit("notYourTurn");
      return;
    }
    console.log("Le joueur "+data[2]+" a colorié le sommet "+data[0]+" avec la couleur "+ data[1]);
    if(data[2] == player1.username){
      console.log("salut");
      player1.turn = false;
      player2.turn = true;
    }else{
      console.log("yo");
      player1.turn = true;
      player2.turn = false;
    }
    io.emit("reponseSommet", data);
  });

  
  socket.on('disconnect', function(reason) {
    if(currentID){
      console.log("Joueur ("+currentID+") déconnecté !");
      socket.broadcast.emit("out");
      if(currentID == player1.username){
        console.log("salut");
        players.splice(0,1);
      }else{
        players = players.splice(1,1);
      }
      if(players.length == 1){
        players.splice(0,1);
        player1.ready = false;
        player2.ready = false;
        player1.attaquant = false;
        player2.attaquant = false;
        console.log(players);
        io.emit("loadingScreen");
      }
    }else{
      console.log("Un utilisateur anonyme s'est déconnecté !");
    }
  });

});
