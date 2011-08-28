var aws = (function($){
	var that = this,
		$body = $("body"),
		$roster = $("#players"),
		$game = $("#gameStage"),
		$resp = $("#responseStage"),
		$vote = $("#vote"),
		$time = $("#timer"),
		$chat = $("#chat");

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
			loadTmpl("/templates/chatTmpl.html","chatTmpl");

			$("body.playing #txtResponse").live("keypress", function(e) {
				if (e.keyCode == 13) {
					e.preventDefault();
					that.events.submitResponse($("#txtResponse").val());
					$("#txtResponse").addClass("submitted");
				}
			});

			$("body.playing #btnRespond").live("click", function(e) {
				e.preventDefault();
				that.events.submitResponse($("#txtResponse").val());
				$("#txtResponse").addClass("submitted");
			});

			$("body.voting input.btnVote").live("click", function(e) {
				e.preventDefault();
				that.events.submitVote($(this).data("id"));
			});

			$("#txtChat").live("keypress", function(e) {
				if (e.keyCode == 13) {
					e.preventDefault();
					that.events.sendChat($(this).val());
					$(this).val("");
				}
			});
		};

		this.clear = function() {
			$game.html("");
			$resp.html("");
			$body
				.removeClass("playing")
				.removeClass("voting");
		};

		this.timer = function(t) {
			var timerT = setInterval(function() {
					t--;
					if (t > 9)
						$time.text("0:" + t);
					else if (t > -1) {
						$time.addClass("out");
						$time.text("0:0" + t);
					} else {						
						clearInterval(timerT);
						$time.text("-:--").removeClass("out");
					}
				}, 1000);
		};

		$.subscribe("rosterUpdated",function() {
			$roster.html($.tmpl("rosterTmpl",{players: that.roomInfo.users, me: that.userInfo.username}));
		});

		$.subscribe("roundStarted",function() {
			rend.timer((that.config.response_time-1000)/1000);
			$game.html($.tmpl("lettersTmpl",{letters: that.currentRound.letters}));
			$resp.html($.tmpl("responseTmpl",null));
			$body.addClass("playing");
		});

		$.subscribe("votingStarted",function() {
			rend.timer((that.config.vote_time-1000)/1000);
			$vote.html($.tmpl("voteTmpl",{responses: that.currentRound.responses}));
			$body.addClass("voting");
		});

		$.subscribe("roundSummary", function() {
			$vote.html($.tmpl("summaryTmpl",{responses: that.currentRound.responses, me: that.userInfo.username}));
		});

		$.subscribe("gameEnded", function() {
			$vote.html($.tmpl("scoresTmpl",{scores: that.roomInfo.scores, me: that.userInfo.username}));
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
			console.log("game started");
		});

		sio.on("rosterUpdated", function(d) {
			// re-render roster
			that.roomInfo.users = d.users;
			$.publish("rosterUpdated");
			console.log("roster updated");
		});

		sio.on("roundStarted", function(d) {
			that.render.clear();
			// render letters
			that.roomInfo.round++;
			that.currentRound.letters = d.letters;
			// render response stage 
			$.publish("roundStarted");
			console.log("round started");
		});

		sio.on("responseError", function(d) {
			// render error message
			// data is in errorMessage
		});

		sio.on("roundEnded", function(d) {
			that.render.clear();
			console.log("round ended");
		});

		sio.on("votingStarted", function(d) {
			// render response list
			that.currentRound.responses = d.responses;
			$.publish("votingStarted");
			console.log("voting started");
		});

		sio.on("votingEnded", function(d) {
			that.render.clear();
			that.currentRound.responses = d.responses;
			$.publish("roundSummary");
			console.log("voting ended");
		});

		sio.on("gameEnded", function(d) {
			that.roomInfo.scores = d.scores;
			$.publish("gameEnded");
			console.log("game ended");
		});

		sio.on("serverError", function(d) {
			// render error message
		});

		sio.on("msg", function(d) {
			$chat.append($.tmpl("chatTmpl",{username: d.uid, text: d.msg}));
		});

		this.submitResponse = function(response) {
			sio.emit("responseSubmitted", {response: response});
		};

		this.submitVote = function(responseID) {
			sio.emit("voteSubmitted", {responseID: responseID});
		};

		this.sendChat = function(text) {
			sio.emit("msg", {msg: text});	
		};

		return this;

	})();

	this.render.init();
	return this;
})(jQuery);