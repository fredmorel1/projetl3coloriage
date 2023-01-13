"use strict";


// <input type="radio" name="gameScreen" id="radio6" class="jscolor" id="colorPicker" value="ff0000" data-jscolor='{ "closable":["ff0000", "00ff00", "0000ff"], "readonlyInput": true}'>    
//<script type="application/javascript" src="./../../jscolor.js"></script>
document.addEventListener("DOMContentLoaded", function(_e) {
    var socket = io.connect();
    var currentUser = null;
    var n = 0;
    var network = null;
    var joueurs = [];
    const turnMsg = document.getElementById('turn-message');

    function sendData(){
      // recupération du pseudo
      var user = document.getElementById("pseudo").value.trim();
      if (! user) return;
      currentUser = user; 
      // ouverture de la connexion
      socket.emit("login", user);
      document.getElementById("btnConnecter").value = "En attente...";
      document.getElementById("btnConnecter").disabled = true;
      document.getElementById("radio1").checked = false;
      document.getElementById("radio3").checked = false;
      document.getElementById("radio2").checked = true;
    }

    document.getElementById("pseudo").onkeypress = function(e){
      if (event.which == 13) {
        sendData(); 
      }
    }
    document.getElementById("btnConnecter").addEventListener("click", () => {
        sendData();
      });

      socket.on("full", function(players) {
        joueurs.push(players[0]);
        joueurs.push(players[1]);
        document.getElementById("radio2").checked = false;
        document.getElementById("radio3").checked = true;
        document.getElementById("radio4").checked = false;
        document.getElementById("playerMatch").innerHTML += "<h4>Partie de "+players[0].username+"</h4><p> "+players[0].username+" VS "+players[1].username+"</p>";
        if(currentUser == players[0].username){
          document.getElementById("playerMatch").innerHTML += "<p>En tant que : Hôte</p>"
          document.getElementById("formGameMaster").classList.remove('d-none');
        }else{
          document.getElementById("playerMatch").innerHTML += "<p>En tant que : Invité</p>"
          document.getElementById("formGuest").classList.remove('d-none');
        }
      });

      socket.on("waitingPlayer", function(player){
        console.log("salut");
        var optionToRemove;
        if(player.host != true){
          let sel = document.getElementById("selRoleGameMaster");
          if(player.attaquant){
            document.getElementById("playerMatch").innerHTML += "<p>L'invité a choisi le rôle : Attaquant</p>"
            optionToRemove = sel.options[0];
            sel.remove(optionToRemove);
          }else{
            document.getElementById("playerMatch").innerHTML += "<p>L'invité a choisi le rôle : Défenseur</p>"
            optionToRemove = sel.options[1];
            sel.remove(optionToRemove);
          }
        }else{
          let sel2 = document.getElementById("selRoleGuest");
          if(player.attaquant){
            document.getElementById("playerMatch").innerHTML += "<p>L'hôte a choisi le rôle : Attaquant</p>"
            console.log("here");
            optionToRemove = sel2.options[0];
            sel2.remove(optionToRemove);
          }else{
            document.getElementById("playerMatch").innerHTML += "<p>L'hôte a choisi le rôle : Défenseur</p>"
            optionToRemove = sel2.options[1];
            sel2.remove(optionToRemove);
          }
        }
      });

      document.getElementById("btnLancer").addEventListener("click", () => {
        let nbrCouleurs = 0
        let nbrNoeuds = 0
        let role = ""
        if(currentUser == joueurs[0].username){
          nbrCouleurs = document.getElementById("selCouleurs").value;
          nbrNoeuds = document.getElementById("selNoeuds").value;
          role = document.getElementById("selRoleGameMaster").value;
        }else{
          role = document.getElementById("selRoleGuest").value;
        }
        let values = [nbrCouleurs,role,nbrNoeuds];
        document.getElementById("radio3").checked = false;
        document.getElementById("radio4").checked = true;
        socket.emit("startGame",values);
      });

      socket.on("goJeuCouleurs", function(player){
        document.getElementById("radio4").checked = false;
        document.getElementById("radio5").checked = true;
        //document.getElementById("radio6").checked = true;
        var data = {
          nodes: [
            { id: 1 },
            { id: 2 },
            { id: 3 },
            { id: 4 },
            { id: 5 },
            { id: 6 },
            { id: 7 },
            { id: 8 },
            { id: 9 },
            { id: 10 }
          ],
          edges: [
            { from: 1, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 4 },
            { from: 4, to: 5 },
            { from: 2, to: 5 },
            { from: 1, to: 6 },
            { from: 6, to: 7 },
            { from: 4, to: 7 },
            { from: 5, to: 8 },
            { from: 8, to: 9 },
            { from: 10, to: 9 }
          ]
        };
        var options = {
          nodes: {
            shape: "circle",
          },
          edges: {
            color: {color:'black'},
            smooth: {
              type: "discrete",
              roundness: 0
            },
            arrows: {
              to: false,
              from: false
            }
          },
          layout: {
            improvedLayout : true
          },
          physics: {
            barnesHut: {
              gravitationalConstant: -80000
            }
          }
        };
        // Créez une instance de Network vis.js en utilisant les données et les options de mise en couleur que vous avez définies
        network = new vis.Network(document.getElementById("mynetwork"), data, options);
        network.on("click", function(event) {
          // Vérifiez si l'événement est déclenché par un sommet
          if (event.nodes.length > 0) {
            if(n==0){
              console.log("azerazr");
              if(currentUser.attaquant == true){
                console.log("oui");
                return;
              }
            }
            // Obtenez le sommet ciblé par l'événement
            var nodeId = event.nodes[0];
            // Récupère le noeud avec l'identifiant
            var node = network.body.nodes[nodeId]
            // update la propriété color de l'objet node
            var v = [nodeId,'yellow'];
            socket.emit("cliqueSommet", v);
            //network.body.data.nodes.update({id: nodeId, color: color})
            // Obtenez les voisins du sommet
            /*var neighbors = network.getConnectedNodes(nodeId);
            console.log("Voisins du sommet :", neighbors);*/
            n = n+1;
          }
        });
      });
      socket.on("reponseSommet", function(data) {
        console.log(data[1]);
        network.body.data.nodes.update({id: data[0], color: data[1]});
      });
      socket.on("erreur-connexion", function(msg) {
        alert(msg);
        document.getElementById("radio1").checked = true;
        document.getElementById("radio3").checked = false;
        document.getElementById("radio2").checked = false;   
        document.getElementById("btnConnecter").value = "Se connecter";
        document.getElementById("btnConnecter").disabled = false;
    });
});