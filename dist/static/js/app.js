(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WORKER_FILEREADER = "static/js/FileReaderSync_worker.js";

function eventContainsFiles(event) {
	if (event.dataTransfer.types) {
		for (var i = 0; i < event.dataTransfer.types.length; i++) {
			if (event.dataTransfer.types[i] === "Files") {
				return true;
			}
		}
	}
	return false;
}

var placeholderLi = document.createElement("li");
placeholderLi.className = "placeholder";

var WebPlaylist = function (_React$Component) {
	_inherits(WebPlaylist, _React$Component);

	function WebPlaylist() {
		_classCallCheck(this, WebPlaylist);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WebPlaylist).call(this));

		_this.bubbleEvent = function (event) {
			if (eventContainsFiles(event)) {
				return _this.cancelEvent(event);
			} else {
				return event;
			}
		};

		_this.dragStart = function (event) {
			_this.dragged = event.currentTarget;
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/html", event.currentTarget);
		};

		_this.dragEnd = function (event) {
			_this.dragged.style.display = "flex";
			_this.dragged.parentNode.removeChild(placeholderLi);

			var files = _this.state.files;
			var from = Number(_this.dragged.dataset.id);
			var to = Number(_this.over.dataset.id);
			if (from < to) to--;
			files.splice(to, 0, files.splice(from, 1)[0]);

			files.forEach(function (file, index) {
				file.index = index;
			});

			_this.setState({ files: files });
		};

		_this.dragOver = function (event) {
			if (eventContainsFiles(event)) {
				return _this.cancelEvent(event);;
			}
			event.preventDefault();
			_this.dragged.style.display = "none";
			if (event.target.className == "placeholder") return;
			_this.over = event.target;

			var relY = event.clientY - _this.over.offsetTop;
			var height = _this.over.offsetHeight / 2;
			var parent = event.target.parentNode;

			if (parent === _this.refs.tracklist) {
				if (relY > height) {
					_this.nodePlacement = "after";
					parent.insertBefore(placeholderLi, event.target.nextElementSibling);
				} else if (relY < height) {
					_this.nodePlacement = "before";
					parent.insertBefore(placeholderLi, event.target);
				}
				parent.insertBefore(placeholderLi, event.target);
			}
		};

		_this.dragEnter = function (event) {
			return _this.bubbleEvent(event);
		};

		_this.dragLeave = function (event) {
			return _this.bubbleEvent(event);
		};

		_this.addFile = function (fileData) {
			if (!fileData.type.startsWith("audio/")) {
				return;
			}
			var parentPlaylist = _this;
			var file = {
				data: fileData,
				audio: new function () {
					this.element = null;
					this.playing = false;
					var self = this;
					function secondsToPaddedMinutes(number) {
						var minutes = Math.floor(number / 60);
						var seconds = ("0" + Math.round(number - minutes * 60)).slice(-2);
						return minutes + ":" + seconds;
					}
					var onTimeUpdate = function () {
						parentPlaylist.refs.timepos.textContent = secondsToPaddedMinutes(this.element.currentTime);
						parentPlaylist.refs.seekBar.value = this.element.currentTime / this.element.duration;
					}.bind(this);
					var onSeekBarClick = function onSeekBarClick(event) {
						var percentage = event.offsetX / this.offsetWidth;
						self.element.currentTime = percentage * self.element.duration;
						parentPlaylist.refs.seekBar.value = percentage / 100;
					};
					this.stop = function () {
						if (this.element !== null) {
							this.element.pause();
							this.element.currentTime = 0;
							this.playing = false;
							parentPlaylist.refs.timepos.textContent = "";

							this.element.removeEventListener("timeupdate", onTimeUpdate);
							parentPlaylist.refs.seekBar.removeEventListener("click", onSeekBarClick);
						}
					};
					this.play = function () {
						if (this.element !== null) {
							this.element.play();
							this.playing = true;
							this.paused = false;

							this.element.addEventListener("timeupdate", onTimeUpdate);
							parentPlaylist.refs.seekBar.addEventListener("click", onSeekBarClick);
						}
					};
					this.pause = function () {
						if (this.element !== null) {
							this.element.pause();
							this.paused = true;
						}
					};
				}(),
				buffer: null,
				index: parentPlaylist.state.files.length,
				createAudio: function createAudio(playWhenReady) {
					var _this2 = this;

					if (this.buffer !== null) {
						var blob = new Blob([this.buffer], { type: this.data.type });
						this.audio.element = new Audio([URL.createObjectURL(blob)]);
						this.audio.element.volume = parentPlaylist.state.volume;
						this.audio.element.addEventListener("ended", function () {
							this.playing = false;
							parentPlaylist.playNextTrack(this);
							parentPlaylist.refs.seekBar.value = 0;
						}.bind(this));

						if (playWhenReady) {
							(function () {
								var onCanPlay = function (event) {
									parentPlaylist.playFile(this);
									this.audio.element.removeEventListener(event.type, onCanPlay);
								}.bind(_this2);
								_this2.audio.element.addEventListener("canplay", onCanPlay);
							})();
						}
					}
				},
				read: function read(playWhenReady) {
					var worker = new Worker(WORKER_FILEREADER);
					worker.onmessage = function (message) {
						this.buffer = message.data;
						this.createAudio(playWhenReady);
						worker.terminate();
					}.bind(this);
					worker.postMessage(this.data);
				}

			};
			_this.setState({ files: _this.state.files.concat([file]) });
		};

		_this.addMultipleFiles = function (files) {
			for (var i = 0, fileData; fileData = files[i]; i++) {
				_this.addFile(fileData);
			}
		};

		_this.drop = function (event) {
			if (!eventContainsFiles(event)) {
				return _this.cancelEvent(event);
			}
			event = _this.cancelEvent(event);
			event.dataTransfer.dropEffect = "copy";
			_this.addMultipleFiles(event.dataTransfer.files);
		};

		_this.keyDown = function (event) {
			if (event.keyCode === 32) {
				//spacebar
				_this.cancelEvent(event);
				return false;
			}
		};

		_this.keyUp = function (event) {
			if (event.keyCode === 32) {
				//spacebar
				if (!_this.state.files.length) return event;
				_this.cancelEvent(event);
				_this.playPause();
				return false;
			}
		};

		_this.componentDidMount = function () {
			var dropzone = _this.props.dropzone;
			if (dropzone) {
				dropzone.addEventListener("dragenter", _this.dragEnter, false);
				dropzone.addEventListener("dragover", _this.dragOver, false);
				dropzone.addEventListener("dragleave", _this.dragLeave, false);
				dropzone.addEventListener("drop", _this.drop, false);
				dropzone.addEventListener("keydown", _this.keyDown, false);
				dropzone.addEventListener("keyup", _this.keyUp, false);
			}
		};

		_this.componentWillUnmount = function () {
			var dropzone = _this.props.dropzone;
			if (dropzone) {
				dropzone.removeEventListener("dragenter", _this.dragEnter, false);
				dropzone.removeEventListener("dragover", _this.dragOver, false);
				dropzone.removeEventListener("dragleave", _this.dragLeave, false);
				dropzone.removeEventListener("drop", _this.drop, false);
				dropzone.removeEventListener("keydown", _this.keyDown, false);
				dropzone.removeEventListener("keyup", _this.keyDown, false);
			}
		};

		_this.playPause = function () {
			if (_this.state.currentTrack === null) {
				_this.playNextTrack();
			} else {
				if (_this.state.currentTrack.audio.paused) {
					_this.playFile(_this.state.currentTrack);
				} else {
					_this.pauseCurrent();
				}
			}
		};

		_this.playNextTrack = function (current) {
			var files = _this.state.files;

			if (_this.state.shuffle) {
				//consider adding a play queue, so we can generate a shuffled playlist (Fisher-Yates shuffle). This will let back/next step through the shuffled list
				return _this.playFile(files[Math.floor(Math.random() * files.length)]);
			}

			if (!current) {
				if (files.length) {
					return _this.playFile(files[0]);
				}
			}

			if (_this.state.repeatCurrent) {
				return _this.playFile(current);
			}

			var next = files[current.index + 1];
			if (next) {
				return _this.playFile(next);
			} else {
				if (_this.state.repeatAll && files.length) {
					return _this.playFile(files[0]);
				}
			}
		};

		_this.playPrevTrack = function (current) {
			var files = _this.state.files;
			if (!current) {
				if (files.length) {
					return _this.playFile(files[0]);
				}
			}
			var prev = current.index === 0 ? files[files.length - 1] : files[current.index - 1];
			if (prev) {
				return _this.playFile(prev);
			} else {
				if (files.length) {
					return _this.playFile(files[0]);
				}
			}
		};

		_this.playFile = function (fileToPlay) {
			if (!fileToPlay) return;
			if (fileToPlay === _this.state.currentTrack && fileToPlay.audio.playing && fileToPlay.audio.paused) {
				fileToPlay.audio.play();
				_this.forceUpdate();
			} else {
				if (_this.state.currentTrack !== null) {
					_this.state.currentTrack.audio.stop();
					_this.setState({ currentTrack: null });
				}
				if (fileToPlay.audio.element !== null) {
					fileToPlay.audio.play();
					_this.setState({ currentTrack: fileToPlay });
				} else {
					fileToPlay.read(true);
				}
			}
		};

		_this.pauseCurrent = function () {
			if (_this.state.currentTrack !== null) {
				_this.state.currentTrack.audio.pause();
				_this.forceUpdate();
			}
		};

		_this.removeFile = function (fileToRemove) {
			var files = _this.state.files;

			files.splice(fileToRemove.index, 1);
			fileToRemove.audio.stop();
			fileToRemove.audio.element = null;
			fileToRemove.buffer = null;

			files.forEach(function (file, index) {
				file.index = index;
			});

			_this.setState({ files: files });
		};

		_this.toggleRepeat = function () {
			if (_this.state.repeatAll) {
				_this.setState({
					repeatAll: false,
					repeatCurrent: true
				});
			} else if (_this.state.repeatCurrent) {
				_this.setState({
					repeatAll: false,
					repeatCurrent: false
				});
			} else if (!_this.state.repeatAll && !_this.state.repeatCurrent) {
				_this.setState({
					repeatAll: true,
					repeatCurrent: false
				});
			}
		};

		_this.setVolume = function (volume) {
			_this.refs.volumeBar.value = volume;
			_this.state.files.forEach(function (file) {
				if (file.audio.element !== null) {
					file.audio.element.volume = volume;
				}
			});
			_this.setState({ volume: volume });
		};

		_this.toggleMute = function () {
			if (_this.state.volume > 0) {
				_this.setState({
					mutedVolume: _this.state.volume
				});
				_this.setVolume(0);
			} else {
				_this.setVolume(_this.state.mutedVolume);
			}
		};

		_this.addFilesFromInput = function () {
			_this.addMultipleFiles(_this.refs.fileInput.files);
		};

		_this.render = function () {

			if (!_this.state.files.length) {
				return React.createElement(
					"div",
					{ className: "filedrop-prompt" },
					React.createElement("i", { className: "mdi mdi-file-music" }),
					React.createElement(
						"span",
						null,
						"Add or drag & drop some music!"
					),
					React.createElement("input", { ref: "fileInput", onChange: _this.addFilesFromInput, type: "file", multiple: true })
				);
			}

			var parentPlaylist = _this;

			var tracks = _this.state.files.map(function (file, index) {
				return React.createElement(
					"li",
					{
						className: file.audio.playing ? "playing" : "",
						key: "file-key-" + index,
						"data-id": index,
						draggable: "true",
						onDragEnd: parentPlaylist.dragEnd,
						onDragStart: parentPlaylist.dragStart
					},
					React.createElement(
						"div",
						{ className: "track-wrap", onClick: function onClick() {
								parentPlaylist.playFile(file);
							} },
						React.createElement(
							"span",
							null,
							file.data.name
						)
					),
					React.createElement("i", { alt: "remove from playlist", title: "remove from playlist", onClick: function onClick() {
							parentPlaylist.removeFile(file);
						}, className: "mdi mdi-playlist-remove remove-from-playlist-button" })
				);
			});

			function getPlayPauseIcon() {
				if (parentPlaylist.state.currentTrack === null || parentPlaylist.state.currentTrack && parentPlaylist.state.currentTrack.audio.paused) {
					return "mdi mdi-play-circle playpause";
				}
				return "mdi mdi-pause-circle playpause";
			}

			function getSpeakerIcon() {
				if (parentPlaylist.state.volume > 0.5) {
					return "mdi-volume-high";
				}
				if (parentPlaylist.state.volume > 0.25) {
					return "mdi-volume-medium";
				}
				if (parentPlaylist.state.volume > 0) {
					return "mdi-volume-low";
				}
				return "mdi-volume-off";
			}

			var repeatButtonProps = function getRepeatButtonProps() {
				if (parentPlaylist.state.repeatAll) return { alt: "repeat is on", icon: "mdi mdi-repeat" };else if (parentPlaylist.state.repeatCurrent) return { alt: "repeating current", icon: "mdi mdi-repeat-once" };
				return { alt: "repeat is off", icon: "mdi mdi-repeat inactive" };
			}();

			return React.createElement(
				"div",
				{ className: "web-playlist" },
				React.createElement(
					"div",
					{ className: "tracklist-wrap" },
					React.createElement(
						"ul",
						{ className: "tracklist", ref: "tracklist" },
						tracks
					)
				),
				React.createElement(
					"div",
					{ className: "seekbar-wrap" },
					React.createElement("progress", { className: "seekbar", ref: "seekBar", value: "0", max: "1" })
				),
				React.createElement(
					"div",
					{ className: "controls" },
					React.createElement(
						"div",
						{ className: "timepos-wrap" },
						React.createElement(
							"span",
							{ className: "timepos", ref: "timepos" },
							"0:00"
						)
					),
					React.createElement(
						"div",
						{ className: "controls-playback" },
						React.createElement(
							"button",
							{ onClick: parentPlaylist.toggleRepeat, className: "repeat-button", alt: repeatButtonProps.alt, title: repeatButtonProps.alt },
							React.createElement("i", { className: repeatButtonProps.icon })
						),
						React.createElement(
							"button",
							{ onClick: function onClick() {
									parentPlaylist.playPrevTrack(parentPlaylist.state.currentTrack);
								} },
							React.createElement("i", { className: "mdi mdi-skip-previous" })
						),
						React.createElement(
							"button",
							{ onClick: parentPlaylist.playPause },
							React.createElement("i", { className: getPlayPauseIcon() })
						),
						React.createElement(
							"button",
							{ onClick: function onClick() {
									parentPlaylist.playNextTrack(parentPlaylist.state.currentTrack);
								} },
							React.createElement("i", { className: "mdi mdi-skip-next" })
						),
						React.createElement(
							"button",
							{
								onClick: function onClick() {
									parentPlaylist.setState({ shuffle: !parentPlaylist.state.shuffle });
								},
								alt: "toggle shuffle",
								title: "toggle shuffle",
								className: "shuffle-button"
							},
							React.createElement("i", { className: "mdi mdi-shuffle" + (parentPlaylist.state.shuffle ? "" : " inactive") })
						)
					),
					React.createElement(
						"div",
						{ className: "controls-volume" },
						React.createElement(
							"div",
							{ className: "volumebar-wrap", onClick: function onClick(event) {
									parentPlaylist.setVolume((event.pageX - event.target.offsetLeft) / event.target.offsetWidth);
								} },
							React.createElement(
								"div",
								{ className: "volumebar-height-wrap" },
								React.createElement("progress", { className: "volumebar", ref: "volumeBar", value: parentPlaylist.state.volume, max: "1" })
							)
						),
						React.createElement(
							"button",
							{ alt: "toggle mute", title: "toggle mute", className: "toggle-mute-button", onClick: parentPlaylist.toggleMute },
							React.createElement("i", { className: "mdi " + getSpeakerIcon() })
						)
					)
				)
			);
		};

		_this.state = {
			files: [],
			repeatAll: true,
			repeatCurrent: false,
			currentTrack: null,
			volume: 1,
			mutedVolume: 1, //sound-level to return to after unmuting. The volume was at this level when the player was muted.
			shuffle: false
		};
		return _this;
	}

	_createClass(WebPlaylist, [{
		key: "cancelEvent",
		value: function cancelEvent(event) {
			event.stopPropagation();
			event.preventDefault();
			return event;
		}
	}]);

	return WebPlaylist;
}(React.Component);

ReactDOM.render(React.createElement(WebPlaylist, { dropzone: window }), document.getElementById("web-playlist-wrap"));

},{}]},{},[1]);
