var aws = (function($){
	var that = this,
		$body = $("body"),
		$roster = $("#players"),
		$game = $("#gameStage"),
		$resp = $("#responseStage"),
		$vote = $("#vote"),
		$time = $("#timer");

	this.config;
	this.state = 0;
	this.userInfo = {};
	this.currentRound = {
		responses: null,
		letters: null
	};
	this.roomInfo = {
		users: [],
		round: 0,
		scores: []
	};

	this.render = (function() {
		var rend = this;
		
		this.init = function() {
			$.get("js/rules.json", function(r) {
				config = r;
			},"json");

			loadTmpl("/templates/rosterTmpl.html","rosterTmpl");
			loadTmpl("/templates/lettersTmpl.html","lettersTmpl");
			loadTmpl("/templates/responseTmpl.html","responseTmpl");
			loadTmpl("/templates/voteTmpl.html","voteTmpl");
			loadTmpl("/templates/summaryTmpl.html","summaryTmpl");
			loadTmpl("/templates/scoresTmpl.html","scoresTmpl");

			$("body.playing #btnRespond").live("click", function(e) {
				e.preventDefault();
				that.events.submitResponse($("#txtResponse").val());
			});

			$("body.voting input.btnVote").live("click", function(e) {
				e.preventDefault();
				that.events.submitVote($(this).data("id"));
			});
		};

		this.clear = function() {
			$game.html("");
			$resp.html("");
			$body
				.removeClass("playing")
				.removeClass("voting");
			that.clearTimer;
		};

		this.timer = function(t) {
			$time.removeClass("out");
			that.timerT = setInterval(function() {
					t -= 1000;
					if (t > 9000)
						$time.text("0:" + new Date(t).getSeconds());
					else if (t > -1) {
						$time.addClass("out");
						$time.text("0:0" + new Date(t).getSeconds());
					} else
						clearInterval(that.timerT);
				}, 1000);
		};

		this.clearTimer = function() {
			clearInterval(that.timerT);
			$time.text("-:--").removeClass("out");
		};

		$.subscribe("rosterUpdated",function() {
			$roster.html($.tmpl("rosterTmpl",{players: that.roomInfo.users, me: that.userInfo.username}));
		});

		$.subscribe("roundStarted",function() {
			$game.html($.tmpl("lettersTmpl",{letters: that.currentRound.letters}));
			$resp.html($.tmpl("responseTmpl",null));
			rend.timer(that.config.response_time-1000);
			$body.addClass("playing");
		});

		$.subscribe("votingStarted",function() {
			$vote.html($.tmpl("voteTmpl",{responses: that.currentRound.responses}));
			rend.timer(that.config.vote_time-1000);
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

		return this;
	})();

	this.sio = io.connect();
	this.events = (function() {
		
		sio.on("gameStarted", function(d) {
			// change state
		});

		sio.on("rosterUpdated", function(d) {
			// re-render roster
			that.roomInfo.users = d.users;
			$.publish("rosterUpdated");
		});

		sio.on("roundStarted", function(d) {
			that.render.clear();
			// render letters
			that.roomInfo.round++;
			that.currentRound.letters = d.letters;
			// render response stage 
			$.publish("roundStarted");
		});

		sio.on("responseError", function(d) {
			// render error message
			// data is in errorMessage
		});

		sio.on("roundEnded", function(d) {
			that.render.clear();
		});

		sio.on("votingStarted", function(d) {
			// render response list
			that.currentRound.responses = d.responses;
			$.publish("votingStarted");
		});

		sio.on("votingEnded", function(d) {
			that.render.clear();
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

		this.submitResponse = function(response) {
			sio.emit("responseSubmitted", {response: response});
		};

		this.submitVote = function(responseID) {
			sio.emit("voteSubmitted", {responseID: responseID});
		};

		return this;

	})();

	this.render.init();
	return this;
})(jQuery);