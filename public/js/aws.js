var aws = {
	var that = this,
		$body = $("body"),
		$roster = $("#players"),
		$game = $("#gameStage"),
		$resp = $("#responseStage"),
		$vote = $("#vote");

	this.state = 0;
	this.userInfo = {};
	this.currentRound = {
		responses: null,
		letters: null,
		started: null,
		length: null // get this from config
	};
	this.roomInfo = {
		users: [],
		round: 0,
		scores: []
	};

	this.render = {
		var rend = this;
		
		this.init = function() {
			loadTmpl("templates/rosterTmpl","rosterTmpl");
			loadTmpl("templates/lettersTmpl","lettersTmpl");
			loadTmpl("templates/responseTmpl","responseTmpl");
			loadTmpl("templates/voteTmpl","voteTmpl");
			loadTmpl("templates/summaryTmpl","summaryTmpl");
			loadTmpl("templates/scoresTmpl","scoresTmpl");
		};

		this.enableResponse = function() {
			
		};

		this.enableVote = function() {
			
		};

		this.responseTimer = function(startTime) {
			
		};

		this.voteTimer = function(startTime) {
			
		};

		this.clear = function() {
			$game.html("");
			$resp.html("");
			$body.removeClass("playing").removeClass("voting");
		};

		$.subscribe("rosterUpdated",function() {
			$roster.html($.tmpl("rosterTmpl",{players: that.roomInfo.users}));
		});

		$.subscribe("roundStarted",function() {
			$game.html($.tmpl("lettersTmpl",{letters: that.currentRound.letters}));
			$resp.html($.tmpl("responseTmpl",null));
			rend.enableResponse();
			rend.responseTimer(that.currentRound.started);
			$body.addClass("playing");
		});

		$.subscribe("votingStarted",function() {
			$vote.html($.tmpl("voteTmpl",{responses: that.currentRound.responses}));
			rend.enableVote();
			rend.voteTimer(Date.now());
			$body.addClass("voting");
		});

		$.subscribe("roundSummary", function() {
			$vote.html($.tmpl("summaryTmpl",{responses: that.currentRound.responses}));
		});

		$.subscribe("gameEnded", function() {
			$vote.html($.tmpl("scoresTmpl",{scores: that.roomInfo.scores}));
			$body.addClass("voting");
		});

		function loadTmpl(path, name) {
			$.get(path,function(r) {
				$.template(name, r);
			}, "html");
		}

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
			that.roomInfo.round++;
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
			that.currentRound.responses = d.responses;
			$.publish("votingStarted");
		});

		//sio.on("voteSubmitted", function(d) {
			
		//});

		sio.on("votingEnd", function(d) {
			that.render.clear();
		});

		sio.on("roundSummary", function(d) {
			// render responses
			that.currentRound.responses = d.responses;
			$.publish("roundSummary");
		});

		sio.on("gameEnded", function(d) {
			that.roomInfo.scores = d.scores;
			$.publish("gameEnded");
		});

		sio.on("serverError", function(d) {
			// render error message
		});

	};
};