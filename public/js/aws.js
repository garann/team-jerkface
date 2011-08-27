var aws = {
	var that = this,
		$body = $("body"),
		$roster = $("#players"),
		$game = $("#gameStage"),
		$resp = $("#responseStage");

	this.state = 0;
	this.userInfo = {};
	this.currentRound = {
		letters: null,
		started: null,
		length: null // get this from config
	};
	this.roomInfo = {
		users: [],
		round: 0
	};

	this.render = {
		var rend = this;
		
		this.init = function() {
			
		};

		this.enableResponse = function() {
			
		};

		this.enableVote = function() {
			
		};

		this.responseTimer = function(startTime, length) {
			
		};

		this.voteTimer = function() {
			
		};

		this.clear = function() {
			$game.html("");
			$resp.html("");
			$body.removeClass("playing").removeClass("voting");
		};

		$.subscribe("rosterUpdated",function() {
			$roster.html($.tmpl("rosterTmpl",that.roomInfo.users));
		});

		$.subscribe("roundStarted",function() {
			$game.html($.tmpl("lettersTmpl",that.currentRound.letters;
			$resp.html($.tmpl("responseTmpl",null));
			rend.enableResponse();
			rend.responseTimer(that.currentRound.started, that.currentRound.length);
			$body.addClass("playing");
		});

	};

	this.sio = io.connect();
	this.events = {
		
		sio.on("gameStarted", function(d) {
			// change state
		});

		sio.on("rosterUpdated", function(d) {
			// re-render roster
			that.roomInfo.users = d.users;
			$.publish("rosterUpdated");
		});

		sio.on("roundStarted", function(d) {
			// render letters
			that.currentRound.letters = d.letters;
			that.currentRound.started = Date.now();
			// render response stage 
			$.publish("roundStarted");
		});

		//sio.on("responseSubmitted", function(d) {
			
		//});

		sio.on("responseError", function(d) {
			// render error message
		});

		sio.on("roundEnded", function(d) {
			that.render.clear();
		});

		sio.on("votingStart", function(d) {
			// render response list
			// wire-up voting controls
		});

		//sio.on("voteSubmitted", function(d) {
			
		//});

		sio.on("votingEnd", function(d) {
			that.render.clear();
		});

		sio.on("roundSummary", function(d) {
			// render responses
		});

		sio.on("gameEnded", function(d) {
			// render scores
		});

		sio.on("serverError", function(d) {
			// render error message
		});

	};
};