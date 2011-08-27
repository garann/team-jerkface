var aws = {
	this.state = 0;
	this.userInfo = {};
	this.currentRound = {};
	this.roomInfo = {};

	this.render = {
		
		this.init = function() {
			
		};

		this.enableResponse = function() {
			
		};

		this.enableVote = function() {
			
		};

		this.responseTimer = function() {
			
		};

		this.voteTimer = function() {
			
		};

	};

	this.sio = io.connect();
	this.events = {
		
		sio.on("gameStarted", function(d) {
			
		});

		sio.on("rosterUpdated", function(d) {
			
		});

		sio.on("roundStarted", function(d) {
			
		});

		sio.on("responseSubmitted", function(d) {
			
		});

		sio.on("responseError", function(d) {
			
		});

		sio.on("roundEnded", function(d) {
			
		});

		sio.on("votingStart", function(d) {
			
		});

		sio.on("voteSubmitted", function(d) {
			
		});

		sio.on("votingEnd", function(d) {
			
		});

		sio.on("roundSummary", function(d) {
			
		});

		sio.on("gameEnded", function(d) {
			
		});

		sio.on("serverError", function(d) {
			
		});

	};
};