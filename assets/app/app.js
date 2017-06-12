// Store the objects for each of the two players
var player1 = null;
var player2 = null;

// Store the player names
var player1Name = "";
var player2Name = "";

var yourPlayerName = "";

var player1Choice = "";
var player2Choice = "";

var turn = 1;

// Initialize Firebase
var config = {
    apiKey: "AIzaSyA5jG2tZ1GhJh2caNwWRHWpbZjIsWOO5Ao",
    authDomain: "rps-multiplayer-2a4cd.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-2a4cd.firebaseio.com",
    projectId: "rps-multiplayer-2a4cd",
    storageBucket: "rps-multiplayer-2a4cd.appspot.com",
    messagingSenderId: "852298879774"
};
firebase.initializeApp(config);

var database = firebase.database();

database.ref("/players/").on("value", function(snapshot) {
	if (snapshot.child("player1").exists()) {
		console.log("Player 1 exists");

		player1 = snapshot.val().player1;
		player1Name = player1.name;

		$("#playerOneName").text(player1Name);
		$("#player1Stats").html("Win: " + player1.win + ", Loss: " + player1.loss + ", Tie: " + player1.tie);
	} else {
		console.log("Player 1 does NOT exist");

		player1 = null;
		player1Name = "";

		$("#playerOneName").text("Waiting for Player 1...");
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("/outcome/").remove();
		$("#roundOutcome").html("<img src='assets/images/background.png' height='150' width='150'>");
		$("#waitingNotice").html("");
		$("#player1Stats").html("Win: 0, Loss: 0, Tie: 0");
	}

	if (snapshot.child("player2").exists()) {
		console.log("Player 2 exists");

		player2 = snapshot.val().player2;
		player2Name = player2.name;

		$("#playerTwoName").text(player2Name);
		$("#player2Stats").html("Win: " + player2.win + ", Loss: " + player2.loss + ", Tie: " + player2.tie);
	} else {
		console.log("Player 2 does NOT exist");

		player2 = null;
		player2Name = "";

		$("#playerTwoName").text("Waiting for Player 2...");
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("/outcome/").remove();
		$("#roundOutcome").html("<img src='assets/images/background.png' height='150' width='150'>");
		$("#waitingNotice").html("");
		$("#player2Stats").html("Win: 0, Loss: 0, Tie: 0");
	}

	if (player1 && player2) {
		$("#playerPanel1").addClass("playerPanelTurn");

		$("#waitingNotice").html("Waiting on " + player1Name + " to choose...");
	}

	if (!player1 && !player2) {
		database.ref("/chat/").remove();
		database.ref("/turn/").remove();
		database.ref("/outcome/").remove();

		$("#chatDisplay").empty();
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		$("#roundOutcome").html("<img src='assets/images/background.png' height='150' width='150'>");
		$("#waitingNotice").html("");
	}
});

database.ref("/players/").on("child_removed", function(snapshot) {
	var msg = snapshot.val().name + " has disconnected!";

	var chatKey = database.ref().child("/chat/").push().key;

	database.ref("/chat/" + chatKey).set(msg);
});

database.ref("/chat/").on("child_added", function(snapshot) {
	var chatMsg = snapshot.val();
	var chatEntry = $("<div>").html(chatMsg);

	if (chatMsg.includes("disconnected")) {
		chatEntry.addClass("chatColorDisconnected");
	} else if (chatMsg.includes("joined")) {
		chatEntry.addClass("chatColorJoined");
	} else if (chatMsg.startsWith(yourPlayerName)) {
		chatEntry.addClass("chatColor1");
	} else {
		chatEntry.addClass("chatColor2");
	}

	$("#chatDisplay").append(chatEntry);
	$("#chatDisplay").scrollTop($("#chatDisplay")[0].scrollHeight);
});

database.ref("/turn/").on("value", function(snapshot) {
	if (snapshot.val() === 1) {
		console.log("TURN 1");
		turn = 1;

		if (player1 && player2) {
			$("#playerPanel1").addClass("playerPanelTurn");
			$("#playerPanel2").removeClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + player1Name + " to choose...");
		}
	} else if (snapshot.val() === 2) {
		console.log("TURN 2");
		turn = 2;

		if (player1 && player2) {
			$("#playerPanel1").removeClass("playerPanelTurn");
			$("#playerPanel2").addClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + player2Name + " to choose...");
		}
	}
});

database.ref("/outcome/").on("value", function(snapshot) {
	$("#roundOutcome").html(snapshot.val());
});


$("#add-name").on("click", function(event) {
	event.preventDefault();

	if ( ($("#name-input").val().trim() !== "") && !(player1 && player2) ) {
		if (player1 === null) {
			console.log("Adding Player 1");

			yourPlayerName = $("#name-input").val().trim();
			player1 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};

			database.ref().child("/players/player1").set(player1);

			database.ref().child("/turn").set(1);

			database.ref("/players/player1").onDisconnect().remove();
		} else if( (player1 !== null) && (player2 === null) ) {
			console.log("Adding Player 2");

			yourPlayerName = $("#name-input").val().trim();
			player2 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};

			database.ref().child("/players/player2").set(player2);

			database.ref("/players/player2").onDisconnect().remove();
		}

		var msg = yourPlayerName + " has joined!";
		console.log(msg);

		var chatKey = database.ref().child("/chat/").push().key;

		database.ref("/chat/" + chatKey).set(msg);

		$("#name-input").val("");	
	}
});

$("#chat-send").on("click", function(event) {
	event.preventDefault();

	if ( (yourPlayerName !== "") && ($("#chat-input").val().trim() !== "") ) {
		var msg = yourPlayerName + ": " + $("#chat-input").val().trim();
		$("#chat-input").val("");

		var chatKey = database.ref().child("/chat/").push().key;

		database.ref("/chat/" + chatKey).set(msg);
	}
});

$("#playerPanel1").on("click", ".panelOption", function(event) {
	event.preventDefault();

	if (player1 && player2 && (yourPlayerName === player1.name) && (turn === 1) ) {
		var choice = $(this).text().trim();

		player1Choice = choice;
		database.ref().child("/players/player1/choice").set(choice);

		turn = 2;
		database.ref().child("/turn").set(2);
	}
});

$("#playerPanel2").on("click", ".panelOption", function(event) {
	event.preventDefault();

	if (player1 && player2 && (yourPlayerName === player2.name) && (turn === 2) ) {
		var choice = $(this).text().trim();

		player2Choice = choice;
		database.ref().child("/players/player2/choice").set(choice);

		rpsCompare();
	}
});

function rpsCompare() {
	if (player1.choice === "Rock") {
		if (player2.choice === "Rock") {
			console.log("tie");

			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/player1/tie").set(player1.tie + 1);
			database.ref().child("/players/player2/tie").set(player2.tie + 1);
		} else if (player2.choice === "Paper") {
			console.log("paper wins");

			database.ref().child("/outcome/").set("Paper wins!");
			database.ref().child("/players/player1/loss").set(player1.loss + 1);
			database.ref().child("/players/player2/win").set(player2.win + 1);
		} else { 
			console.log("rock wins");

			database.ref().child("/outcome/").set("Rock wins!");
			database.ref().child("/players/player1/win").set(player1.win + 1);
			database.ref().child("/players/player2/loss").set(player2.loss + 1);
		}

	} else if (player1.choice === "Paper") {
		if (player2.choice === "Rock") {
			console.log("paper wins");

			database.ref().child("/outcome/").set("Paper wins!");
			database.ref().child("/players/player1/win").set(player1.win + 1);
			database.ref().child("/players/player2/loss").set(player2.loss + 1);
		} else if (player2.choice === "Paper") {
			console.log("tie");

			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/player1/tie").set(player1.tie + 1);
			database.ref().child("/players/player2/tie").set(player2.tie + 1);
		} else { 
			console.log("scissors win");

			database.ref().child("/outcome/").set("Scissors win!");
			database.ref().child("/players/player1/loss").set(player1.loss + 1);
			database.ref().child("/players/player2/win").set(player2.win + 1);
		}

	} else if (player1.choice === "Scissors") {
		if (player2.choice === "Rock") {
			console.log("rock wins");

			database.ref().child("/outcome/").set("Rock wins!");
			database.ref().child("/players/player1/loss").set(player1.loss + 1);
			database.ref().child("/players/player2/win").set(player2.win + 1);
		} else if (player2.choice === "Paper") {
			console.log("scissors win");

			database.ref().child("/outcome/").set("Scissors win!");
			database.ref().child("/players/player1/win").set(player1.win + 1);
			database.ref().child("/players/player2/loss").set(player2.loss + 1);
		} else {
			console.log("tie");

			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/player1/tie").set(player1.tie + 1);
			database.ref().child("/players/player2/tie").set(player2.tie + 1);
		}

	}

	turn = 1;
	database.ref().child("/turn").set(1);
}