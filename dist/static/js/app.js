(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

var WebPlaylist = (function (_React$Component) {
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

		_this.drop = function (event) {
			if (!eventContainsFiles(event)) {
				return _this.cancelEvent(event);
			}
			event = _this.cancelEvent(event);
			event.dataTransfer.dropEffect = "copy";

			var parentPlaylist = _this;

			for (var i = 0, fileData; fileData = event.dataTransfer.files[i]; i++) {
				if (fileData.type.startsWith("audio/")) {
					var _file = {
						data: fileData,
						audio: new (function () {
							this.element = null;
							this.playing = false;
							var self = this;
							function secondsToPaddedMinutes(number) {
								var minutes = Math.floor(number / 60);
								var seconds = ("0" + Math.round(number - minutes * 60)).slice(-2);
								return minutes + ":" + seconds;
							}
							var onTimeUpdate = (function () {
								parentPlaylist.refs.timepos.textContent = secondsToPaddedMinutes(this.element.currentTime);
								parentPlaylist.refs.seekBar.value = this.element.currentTime / this.element.duration;
							}).bind(this);
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
						})(),
						buffer: null,
						index: parentPlaylist.state.files.length,
						createAudio: function createAudio(playWhenReady) {
							var _this2 = this;

							if (this.buffer !== null) {
								var blob = new Blob([this.buffer], { type: this.data.type });
								this.audio.element = new Audio([URL.createObjectURL(blob)]);
								this.audio.element.volume = parentPlaylist.state.volume;
								this.audio.element.addEventListener("ended", (function () {
									this.playing = false;
									parentPlaylist.playNextTrack(this);
									parentPlaylist.refs.seekBar.value = 0;
								}).bind(this));

								if (playWhenReady) {
									(function () {
										var onCanPlay = (function (event) {
											parentPlaylist.playFile(this);
											this.audio.element.removeEventListener(event.type, onCanPlay);
										}).bind(_this2);
										_this2.audio.element.addEventListener("canplay", onCanPlay);
									})();
								}
							}
						},
						read: function read(playWhenReady) {
							var worker = new Worker(WORKER_FILEREADER);
							worker.onmessage = (function (message) {
								this.buffer = message.data;
								this.createAudio(playWhenReady);
								worker.terminate();
							}).bind(this);
							worker.postMessage(this.data);
						}

					};
					_this.setState({ files: _this.state.files.concat([_file]) });
				}
			}
		};

		_this.keyDown = function (event) {
			if (event.keyCode === 32) {
				//keyCode for keydown, charCode for keypress
				_this.cancelEvent(event);
				return false;
			}
		};

		_this.keyUp = function (event) {
			if (event.keyCode === 32) {
				if (!_this.state.files.length) return event;
				_this.cancelEvent(event);
				if (_this.state.currentTrack === null) {
					_this.playNextTrack();
				} else {
					if (_this.state.currentTrack.audio.paused) {
						_this.playFile(_this.state.currentTrack);
					} else {
						_this.pauseCurrent();
					}
				}
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
				dropzone.removeEventListener("keyup", _this.keyUp, false);
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
				/*for (let file of this.state.files) {
    	file.audio.stop();
    }*/

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

		_this.render = function () {

			if (!_this.state.files.length) {
				return React.createElement(
					"div",
					{ className: "filedrop-prompt" },
					React.createElement("i", { className: "mdi mdi-file-music" }),
					React.createElement(
						"span",
						null,
						"Drag & Drop a bunch of mp3s here!"
					)
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

			var playpauseButton = null;
			if (_this.state.currentTrack === null) {
				playpauseButton = React.createElement(
					"button",
					{ onClick: function onClick() {
							parentPlaylist.playNextTrack();
						} },
					React.createElement("i", { className: "mdi mdi-play-circle playpause" })
				);
			} else {
				if (_this.state.currentTrack.audio.paused) {
					playpauseButton = React.createElement(
						"button",
						{ onClick: function onClick() {
								parentPlaylist.playFile(parentPlaylist.state.currentTrack);
							} },
						React.createElement("i", { className: "mdi mdi-play-circle playpause" })
					);
				} else {
					playpauseButton = React.createElement(
						"button",
						{ onClick: parentPlaylist.pauseCurrent },
						React.createElement("i", { className: "mdi mdi-pause-circle playpause" })
					);
				}
			}

			var repeatButton = React.createElement(
				"button",
				{ alt: "repeat is off", title: "repeat is off", className: "repeat-button", onClick: parentPlaylist.toggleRepeat },
				React.createElement("i", { className: "mdi mdi-repeat inactive" })
			);
			if (_this.state.repeatAll) {
				repeatButton = React.createElement(
					"button",
					{ alt: "repeat is on", title: "repeat is on", className: "repeat-button", onClick: parentPlaylist.toggleRepeat },
					React.createElement("i", { className: "mdi mdi-repeat" })
				);
			} else if (_this.state.repeatCurrent) {
				repeatButton = React.createElement(
					"button",
					{ alt: "repeating current", title: "repeating current", className: "repeat-button", onClick: parentPlaylist.toggleRepeat },
					React.createElement("i", { className: "mdi mdi-repeat-once" })
				);
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
						repeatButton,
						React.createElement(
							"button",
							{ onClick: function onClick() {
									parentPlaylist.playPrevTrack(parentPlaylist.state.currentTrack);
								} },
							React.createElement("i", { className: "mdi mdi-skip-previous" })
						),
						playpauseButton,
						React.createElement(
							"button",
							{ onClick: function onClick() {
									parentPlaylist.playNextTrack(parentPlaylist.state.currentTrack);
								} },
							React.createElement("i", { className: "mdi mdi-skip-next" })
						),
						React.createElement(
							"button",
							{ alt: "toggle shuffle", title: "toggle shuffle", className: "shuffle-button", onClick: function onClick() {
									parentPlaylist.setState({ shuffle: !parentPlaylist.state.shuffle });
								} },
							" ",
							React.createElement("i", { className: "mdi mdi-shuffle" + (parentPlaylist.state.shuffle ? "" : " inactive") }),
							" "
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
})(React.Component);

ReactDOM.render(React.createElement(WebPlaylist, { dropzone: window }), document.getElementById("web-playlist-wrap"));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsb0NBQW9DLENBQUM7O0FBRS9ELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQW1CaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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QUs7QUFDcEIsZUFBWSxFQUFFLElBQUk7QUFDbEIsU0FBTSxFQUFFLENBQUM7QUFDVCxjQUFXLEVBQUUsQ0FBQztBQUNkLFVBQU8sRUFBRSxLQUFLO0dBQ2QsQ0FBQTs7RUFDRDs7Y0FiSSxXQUFXOzs4QkFjSixLQUFLLEVBQUU7QUFDbEIsUUFBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3hCLFFBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN2QixVQUFPLEtBQUssQ0FBQztHQUNiOzs7UUFsQkksV0FBVztHQUFTLEtBQUssQ0FBQyxTQUFTOztBQXdjekMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxXQUFXLElBQUMsUUFBUSxFQUFFLE1BQU0sQUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgV09SS0VSX0ZJTEVSRUFERVIgPSBcInN0YXRpYy9qcy9GaWxlUmVhZGVyU3luY193b3JrZXIuanNcIjtcclxuXHJcbmZ1bmN0aW9uIGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkge1xyXG5cdGlmIChldmVudC5kYXRhVHJhbnNmZXIudHlwZXMpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzW2ldID09PSBcIkZpbGVzXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cdH1cclxuICAgIHJldHVybiBmYWxzZTtcdFx0XHRcclxufVxyXG5cclxubGV0IHBsYWNlaG9sZGVyTGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbnBsYWNlaG9sZGVyTGkuY2xhc3NOYW1lID0gXCJwbGFjZWhvbGRlclwiO1xyXG5cclxuY2xhc3MgV2ViUGxheWxpc3QgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHJcblx0XHR0aGlzLnN0YXRlID0ge1xyXG5cdFx0XHRmaWxlczogW10sXHJcblx0XHRcdHJlcGVhdEFsbDogdHJ1ZSxcclxuXHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHRcdGN1cnJlbnRUcmFjazogbnVsbCxcclxuXHRcdFx0dm9sdW1lOiAxLFxyXG5cdFx0XHRtdXRlZFZvbHVtZTogMSwgLy9zb3VuZC1sZXZlbCB0byByZXR1cm4gdG8gYWZ0ZXIgdW5tdXRpbmcuIFRoZSB2b2x1bWUgd2FzIGF0IHRoaXMgbGV2ZWwgd2hlbiB0aGUgcGxheWVyIHdhcyBtdXRlZC5cclxuXHRcdFx0c2h1ZmZsZTogZmFsc2UsXHJcblx0XHR9XHJcblx0fVxyXG5cdGNhbmNlbEV2ZW50KGV2ZW50KSB7XHJcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0fVxyXG5cdGJ1YmJsZUV2ZW50ID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGV2ZW50O1xyXG5cdFx0fVxyXG5cdH1cclxuXHRkcmFnU3RhcnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwibW92ZVwiO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0L2h0bWxcIiwgZXZlbnQuY3VycmVudFRhcmdldCk7XHJcblx0fVxyXG5cdGRyYWdFbmQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XHJcblx0XHR0aGlzLmRyYWdnZWQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwbGFjZWhvbGRlckxpKTtcclxuXHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0bGV0IGZyb20gPSBOdW1iZXIodGhpcy5kcmFnZ2VkLmRhdGFzZXQuaWQpO1xyXG5cdFx0bGV0IHRvID0gTnVtYmVyKHRoaXMub3Zlci5kYXRhc2V0LmlkKTtcclxuXHRcdGlmIChmcm9tIDwgdG8pIHRvLS07XHJcblx0XHRmaWxlcy5zcGxpY2UodG8sIDAsIGZpbGVzLnNwbGljZShmcm9tLCAxKVswXSk7XHJcblxyXG5cdFx0ZmlsZXMuZm9yRWFjaCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZmlsZS5pbmRleCA9IGluZGV4O1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IGZpbGVzfSk7XHJcblx0fVxyXG5cdGRyYWdPdmVyID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7O1xyXG5cdFx0fVxyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblx0XHRpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTmFtZSA9PSBcInBsYWNlaG9sZGVyXCIpIHJldHVybjtcclxuXHRcdHRoaXMub3ZlciA9IGV2ZW50LnRhcmdldDtcclxuXHJcblx0XHRsZXQgcmVsWSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLm92ZXIub2Zmc2V0VG9wO1xyXG5cdFx0bGV0IGhlaWdodCA9IHRoaXMub3Zlci5vZmZzZXRIZWlnaHQgLyAyO1xyXG5cdFx0bGV0IHBhcmVudCA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuXHRcdGlmIChwYXJlbnQgPT09IHRoaXMucmVmcy50cmFja2xpc3QpIHtcclxuXHRcdFx0aWYgKHJlbFkgPiBoZWlnaHQpIHtcclxuXHRcdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImFmdGVyXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQubmV4dEVsZW1lbnRTaWJsaW5nKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChyZWxZIDwgaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJiZWZvcmVcIjtcclxuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldCk7XHJcblx0XHRcdH1cclxuXHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0ZHJhZ0VudGVyID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcmFnTGVhdmUgPSAoZXZlbnQpID0+IHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdGRyb3AgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmICghZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHRcdFx0XHJcblx0XHR9XHJcblx0XHRldmVudCA9IHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcImNvcHlcIjtcclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwLCBmaWxlRGF0YTsgZmlsZURhdGEgPSBldmVudC5kYXRhVHJhbnNmZXIuZmlsZXNbaV07IGkrKykge1xyXG5cdFx0XHRpZiAoZmlsZURhdGEudHlwZS5zdGFydHNXaXRoKFwiYXVkaW8vXCIpKSB7XHJcblx0XHRcdFx0bGV0IF9maWxlID0ge1xyXG5cdFx0XHRcdFx0ZGF0YTogZmlsZURhdGEsXHJcblx0XHRcdFx0XHRhdWRpbzogbmV3IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQgPSBudWxsO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0bGV0IHNlbGYgPSB0aGlzO1xyXG5cdFx0XHRcdFx0XHRmdW5jdGlvbiBzZWNvbmRzVG9QYWRkZWRNaW51dGVzKG51bWJlcikge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBtaW51dGVzID0gTWF0aC5mbG9vcihudW1iZXIgLyA2MCk7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHNlY29uZHMgPSAoXCIwXCIgKyBNYXRoLnJvdW5kKG51bWJlciAtIG1pbnV0ZXMqNjApKS5zbGljZSgtMik7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGAke21pbnV0ZXN9OiR7c2Vjb25kc31gO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGxldCBvblRpbWVVcGRhdGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnRpbWVwb3MudGV4dENvbnRlbnQgPSBzZWNvbmRzVG9QYWRkZWRNaW51dGVzKHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSk7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrQmFyLnZhbHVlID0gdGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lIC8gdGhpcy5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdGxldCBvblNlZWtCYXJDbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHBlcmNlbnRhZ2UgPSBldmVudC5vZmZzZXRYIC8gdGhpcy5vZmZzZXRXaWR0aDtcclxuXHRcdFx0XHRcdFx0XHRzZWxmLmVsZW1lbnQuY3VycmVudFRpbWUgPSBwZXJjZW50YWdlICogc2VsZi5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci52YWx1ZSA9IHBlcmNlbnRhZ2UgLyAxMDA7XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lID0gMDtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy50aW1lcG9zLnRleHRDb250ZW50ID0gXCJcIjtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgb25UaW1lVXBkYXRlKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25TZWVrQmFyQ2xpY2spO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBsYXkoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBhdXNlZCA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCBvblRpbWVVcGRhdGUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrQmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvblNlZWtCYXJDbGljayk7XHJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGF1c2UoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGF1c2VkID0gdHJ1ZTtcclxuXHRcdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRidWZmZXI6IG51bGwsXHJcblx0XHRcdFx0XHRpbmRleDogcGFyZW50UGxheWxpc3Quc3RhdGUuZmlsZXMubGVuZ3RoLFxyXG5cdFx0XHRcdFx0Y3JlYXRlQXVkaW86IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYnVmZmVyICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IGJsb2IgPSBuZXcgQmxvYihbdGhpcy5idWZmZXJdLCB7dHlwZTogdGhpcy5kYXRhLnR5cGV9KTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQgPSBuZXcgQXVkaW8oW1VSTC5jcmVhdGVPYmplY3RVUkwoYmxvYildKTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQudm9sdW1lID0gcGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2sodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIudmFsdWUgPSAwO1xyXG5cdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmIChwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRsZXQgb25DYW5QbGF5ID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LnR5cGUsIG9uQ2FuUGxheSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNhbnBsYXlcIiwgb25DYW5QbGF5KTtcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdHJlYWQ6IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHdvcmtlciA9IG5ldyBXb3JrZXIoV09SS0VSX0ZJTEVSRUFERVIpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYnVmZmVyID0gbWVzc2FnZS5kYXRhO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY3JlYXRlQXVkaW8ocGxheVdoZW5SZWFkeSk7XHJcblx0XHRcdFx0XHRcdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5wb3N0TWVzc2FnZSh0aGlzLmRhdGEpO1xyXG5cdFx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB0aGlzLnN0YXRlLmZpbGVzLmNvbmNhdChbX2ZpbGVdKX0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGtleURvd24gPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmIChldmVudC5rZXlDb2RlID09PSAzMikgeyAvL2tleUNvZGUgZm9yIGtleWRvd24sIGNoYXJDb2RlIGZvciBrZXlwcmVzc1xyXG5cdFx0XHR0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRrZXlVcCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50LmtleUNvZGUgPT09IDMyKSB7XHJcblx0XHRcdGlmICghdGhpcy5zdGF0ZS5maWxlcy5sZW5ndGgpIHJldHVybiBldmVudDtcclxuXHRcdFx0dGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHRcdGlmICh0aGlzLnN0YXRlLmN1cnJlbnRUcmFjayA9PT0gbnVsbCkge1xyXG5cdFx0XHRcdHRoaXMucGxheU5leHRUcmFjaygpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGlmICh0aGlzLnN0YXRlLmN1cnJlbnRUcmFjay5hdWRpby5wYXVzZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMucGxheUZpbGUodGhpcy5zdGF0ZS5jdXJyZW50VHJhY2spO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdHRoaXMucGF1c2VDdXJyZW50KCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5rZXlEb3duLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCB0aGlzLmtleVVwLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMua2V5RG93biwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5rZXlVcCwgZmFsc2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRwbGF5TmV4dFRyYWNrID0gKGN1cnJlbnQpID0+IHtcclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblxyXG5cdFx0aWYgKHRoaXMuc3RhdGUuc2h1ZmZsZSkge1xyXG5cdFx0XHQvL2NvbnNpZGVyIGFkZGluZyBhIHBsYXkgcXVldWUsIHNvIHdlIGNhbiBnZW5lcmF0ZSBhIHNodWZmbGVkIHBsYXlsaXN0IChGaXNoZXItWWF0ZXMgc2h1ZmZsZSkuIFRoaXMgd2lsbCBsZXQgYmFjay9uZXh0IHN0ZXAgdGhyb3VnaCB0aGUgc2h1ZmZsZWQgbGlzdFxyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBmaWxlcy5sZW5ndGgpXSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWN1cnJlbnQpIHtcclxuXHRcdFx0aWYgKGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoY3VycmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IG5leHQgPSBmaWxlc1tjdXJyZW50LmluZGV4KzFdO1xyXG5cdFx0aWYgKG5leHQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUobmV4dCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0QWxsICYmIGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRwbGF5UHJldlRyYWNrID0gKGN1cnJlbnQpID0+IHtcclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblx0XHRpZiAoIWN1cnJlbnQpIHtcclxuXHRcdFx0aWYgKGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0bGV0IHByZXYgPSBjdXJyZW50LmluZGV4ID09PSAwID8gZmlsZXNbZmlsZXMubGVuZ3RoLTFdIDogZmlsZXNbY3VycmVudC5pbmRleC0xXTtcclxuXHRcdGlmIChwcmV2KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKHByZXYpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cGxheUZpbGUgPSAoZmlsZVRvUGxheSkgPT4ge1xyXG5cdFx0aWYgKCFmaWxlVG9QbGF5KSByZXR1cm47XHJcblx0XHRpZiAoZmlsZVRvUGxheSA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50VHJhY2sgJiYgZmlsZVRvUGxheS5hdWRpby5wbGF5aW5nICYmIGZpbGVUb1BsYXkuYXVkaW8ucGF1c2VkKSB7XHJcblx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aWYgKHRoaXMuc3RhdGUuY3VycmVudFRyYWNrICE9PSBudWxsKSB7XHJcblx0XHRcdFx0dGhpcy5zdGF0ZS5jdXJyZW50VHJhY2suYXVkaW8uc3RvcCgpO1xyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2N1cnJlbnRUcmFjazogbnVsbH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8qZm9yIChsZXQgZmlsZSBvZiB0aGlzLnN0YXRlLmZpbGVzKSB7XHJcblx0XHRcdFx0ZmlsZS5hdWRpby5zdG9wKCk7XHJcblx0XHRcdH0qL1xyXG5cdFx0XHRcclxuXHJcblx0XHRcdGlmIChmaWxlVG9QbGF5LmF1ZGlvLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRmaWxlVG9QbGF5LmF1ZGlvLnBsYXkoKTtcclxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtjdXJyZW50VHJhY2s6IGZpbGVUb1BsYXl9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRmaWxlVG9QbGF5LnJlYWQodHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cGF1c2VDdXJyZW50ID0gKCkgPT4ge1xyXG5cdFx0aWYgKHRoaXMuc3RhdGUuY3VycmVudFRyYWNrICE9PSBudWxsKSB7XHJcblx0XHRcdHRoaXMuc3RhdGUuY3VycmVudFRyYWNrLmF1ZGlvLnBhdXNlKCk7XHJcblx0XHRcdHRoaXMuZm9yY2VVcGRhdGUoKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmVtb3ZlRmlsZSA9IChmaWxlVG9SZW1vdmUpID0+IHtcclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblxyXG5cdFx0ZmlsZXMuc3BsaWNlKGZpbGVUb1JlbW92ZS5pbmRleCwgMSk7XHJcblx0XHRmaWxlVG9SZW1vdmUuYXVkaW8uc3RvcCgpO1xyXG5cdFx0ZmlsZVRvUmVtb3ZlLmF1ZGlvLmVsZW1lbnQgPSBudWxsO1xyXG5cdFx0ZmlsZVRvUmVtb3ZlLmJ1ZmZlciA9IG51bGw7XHJcblxyXG5cdFx0ZmlsZXMuZm9yRWFjaCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZmlsZS5pbmRleCA9IGluZGV4O1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IGZpbGVzfSk7XHJcblx0fVxyXG5cdHRvZ2dsZVJlcGVhdCA9ICgpID0+IHtcclxuXHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEFsbCkge1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcclxuXHRcdFx0XHRyZXBlYXRBbGw6IGZhbHNlLFxyXG5cdFx0XHRcdHJlcGVhdEN1cnJlbnQ6IHRydWUsXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0cmVwZWF0QWxsOiBmYWxzZSxcclxuXHRcdFx0XHRyZXBlYXRDdXJyZW50OiBmYWxzZSxcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKCF0aGlzLnN0YXRlLnJlcGVhdEFsbCAmJiAhdGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xyXG5cdFx0XHRcdHJlcGVhdEFsbDogdHJ1ZSxcclxuXHRcdFx0XHRyZXBlYXRDdXJyZW50OiBmYWxzZSxcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblx0c2V0Vm9sdW1lID0gKHZvbHVtZSkgPT4ge1xyXG5cdFx0dGhpcy5yZWZzLnZvbHVtZUJhci52YWx1ZSA9IHZvbHVtZTtcclxuXHRcdHRoaXMuc3RhdGUuZmlsZXMuZm9yRWFjaChmaWxlID0+IHtcclxuXHRcdFx0aWYgKGZpbGUuYXVkaW8uZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdGZpbGUuYXVkaW8uZWxlbWVudC52b2x1bWUgPSB2b2x1bWU7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7dm9sdW1lOiB2b2x1bWV9KTtcclxuXHR9XHJcblx0dG9nZ2xlTXV0ZSA9ICgpID0+IHtcclxuXHRcdGlmICh0aGlzLnN0YXRlLnZvbHVtZSA+IDApIHtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0bXV0ZWRWb2x1bWU6IHRoaXMuc3RhdGUudm9sdW1lLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0dGhpcy5zZXRWb2x1bWUoMCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy5zZXRWb2x1bWUodGhpcy5zdGF0ZS5tdXRlZFZvbHVtZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHJlbmRlciA9ICgpID0+IHtcclxuXHJcblx0XHRpZiAoIXRoaXMuc3RhdGUuZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdHJldHVybiAoXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWxlZHJvcC1wcm9tcHRcIj5cclxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cIm1kaSBtZGktZmlsZS1tdXNpY1wiPjwvaT5cclxuXHRcdFx0XHRcdDxzcGFuPkRyYWcgJiBEcm9wIGEgYnVuY2ggb2YgbXAzcyBoZXJlITwvc3Bhbj5cclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGxldCB0cmFja3MgPSB0aGlzLnN0YXRlLmZpbGVzLm1hcCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0cmV0dXJuIDxsaSBcclxuXHRcdFx0XHRjbGFzc05hbWU9e2ZpbGUuYXVkaW8ucGxheWluZyA/IFwicGxheWluZ1wiIDogXCJcIn1cclxuXHRcdFx0XHRrZXk9e1wiZmlsZS1rZXktXCIraW5kZXh9XHJcblx0XHRcdFx0ZGF0YS1pZD17aW5kZXh9XHJcblx0XHRcdFx0ZHJhZ2dhYmxlPVwidHJ1ZVwiXHJcblx0XHRcdFx0b25EcmFnRW5kPXtwYXJlbnRQbGF5bGlzdC5kcmFnRW5kfVxyXG5cdFx0XHRcdG9uRHJhZ1N0YXJ0PXtwYXJlbnRQbGF5bGlzdC5kcmFnU3RhcnR9XHJcblx0XHRcdD5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRyYWNrLXdyYXBcIiBvbkNsaWNrPXtmdW5jdGlvbigpIHtwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZShmaWxlKTt9fT5cclxuXHRcdFx0XHRcdDxzcGFuPntmaWxlLmRhdGEubmFtZX08L3NwYW4+XHJcblx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0PGkgYWx0PVwicmVtb3ZlIGZyb20gcGxheWxpc3RcIiB0aXRsZT1cInJlbW92ZSBmcm9tIHBsYXlsaXN0XCIgb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5yZW1vdmVGaWxlKGZpbGUpO319IGNsYXNzTmFtZT1cIm1kaSBtZGktcGxheWxpc3QtcmVtb3ZlIHJlbW92ZS1mcm9tLXBsYXlsaXN0LWJ1dHRvblwiPjwvaT5cclxuXHRcdFx0PC9saT5cclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBwbGF5cGF1c2VCdXR0b24gPSBudWxsO1xyXG5cdFx0aWYgKHRoaXMuc3RhdGUuY3VycmVudFRyYWNrID09PSBudWxsKSB7XHJcblx0XHRcdHBsYXlwYXVzZUJ1dHRvbiA9IDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKSB7cGFyZW50UGxheWxpc3QucGxheU5leHRUcmFjaygpO319PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcGxheS1jaXJjbGUgcGxheXBhdXNlXCI+PC9pPjwvYnV0dG9uPlxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmICh0aGlzLnN0YXRlLmN1cnJlbnRUcmFjay5hdWRpby5wYXVzZWQpIHtcclxuXHRcdFx0XHRwbGF5cGF1c2VCdXR0b24gPSA8YnV0dG9uIG9uQ2xpY2s9e2Z1bmN0aW9uKCkge3BhcmVudFBsYXlsaXN0LnBsYXlGaWxlKHBhcmVudFBsYXlsaXN0LnN0YXRlLmN1cnJlbnRUcmFjayk7fX0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1wbGF5LWNpcmNsZSBwbGF5cGF1c2VcIj48L2k+PC9idXR0b24+O1x0XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0cGxheXBhdXNlQnV0dG9uID0gPGJ1dHRvbiBvbkNsaWNrPXtwYXJlbnRQbGF5bGlzdC5wYXVzZUN1cnJlbnR9PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcGF1c2UtY2lyY2xlIHBsYXlwYXVzZVwiPjwvaT48L2J1dHRvbj47XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcmVwZWF0QnV0dG9uID0gPGJ1dHRvbiBhbHQ9XCJyZXBlYXQgaXMgb2ZmXCIgdGl0bGU9XCJyZXBlYXQgaXMgb2ZmXCIgY2xhc3NOYW1lPVwicmVwZWF0LWJ1dHRvblwiIG9uQ2xpY2s9e3BhcmVudFBsYXlsaXN0LnRvZ2dsZVJlcGVhdH0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1yZXBlYXQgaW5hY3RpdmVcIj48L2k+PC9idXR0b24+O1xyXG5cdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0QWxsKSB7XHJcblx0XHRcdHJlcGVhdEJ1dHRvbiA9IDxidXR0b24gYWx0PVwicmVwZWF0IGlzIG9uXCIgdGl0bGU9XCJyZXBlYXQgaXMgb25cIiBjbGFzc05hbWU9XCJyZXBlYXQtYnV0dG9uXCIgb25DbGljaz17cGFyZW50UGxheWxpc3QudG9nZ2xlUmVwZWF0fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXJlcGVhdFwiPjwvaT48L2J1dHRvbj47XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0cmVwZWF0QnV0dG9uID0gPGJ1dHRvbiBhbHQ9XCJyZXBlYXRpbmcgY3VycmVudFwiIHRpdGxlPVwicmVwZWF0aW5nIGN1cnJlbnRcIiBjbGFzc05hbWU9XCJyZXBlYXQtYnV0dG9uXCIgb25DbGljaz17cGFyZW50UGxheWxpc3QudG9nZ2xlUmVwZWF0fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXJlcGVhdC1vbmNlXCI+PC9pPjwvYnV0dG9uPjtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBnZXRTcGVha2VySWNvbigpIHtcclxuXHRcdFx0aWYgKHBhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZSA+IDAuNSkge1xyXG5cdFx0XHRcdHJldHVybiBcIm1kaS12b2x1bWUtaGlnaFwiO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChwYXJlbnRQbGF5bGlzdC5zdGF0ZS52b2x1bWUgPiAwLjI1KSB7XHJcblx0XHRcdFx0cmV0dXJuIFwibWRpLXZvbHVtZS1tZWRpdW1cIjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lID4gMCkge1xyXG5cdFx0XHRcdHJldHVybiBcIm1kaS12b2x1bWUtbG93XCI7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIFwibWRpLXZvbHVtZS1vZmZcIjtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4oXHJcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwid2ViLXBsYXlsaXN0XCI+XHJcblxyXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidHJhY2tsaXN0LXdyYXBcIj5cclxuXHRcdFx0XHRcdDx1bCBjbGFzc05hbWU9XCJ0cmFja2xpc3RcIiByZWY9XCJ0cmFja2xpc3RcIj5cclxuXHRcdFx0XHRcdFx0e3RyYWNrc31cclxuXHRcdFx0XHRcdDwvdWw+XHJcblx0XHRcdFx0PC9kaXY+XHJcblxyXG5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlZWtiYXItd3JhcFwiPlxyXG5cdFx0XHRcdFx0PHByb2dyZXNzIGNsYXNzTmFtZT1cInNlZWtiYXJcIiByZWY9XCJzZWVrQmFyXCIgdmFsdWU9XCIwXCIgbWF4PVwiMVwiPjwvcHJvZ3Jlc3M+IFxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbnRyb2xzXCI+XHJcblxyXG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ0aW1lcG9zLXdyYXBcIj5cclxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwidGltZXBvc1wiIHJlZj1cInRpbWVwb3NcIj4wOjAwPC9zcGFuPlxyXG5cdFx0XHRcdFx0PC9kaXY+XHJcblxyXG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9scy1wbGF5YmFja1wiPlxyXG5cdFx0XHRcdFx0XHR7cmVwZWF0QnV0dG9ufVxyXG5cdFx0XHRcdFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e2Z1bmN0aW9uKCl7cGFyZW50UGxheWxpc3QucGxheVByZXZUcmFjayhwYXJlbnRQbGF5bGlzdC5zdGF0ZS5jdXJyZW50VHJhY2spfX0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1za2lwLXByZXZpb3VzXCI+PC9pPjwvYnV0dG9uPlxyXG5cdFx0XHRcdFx0XHR7cGxheXBhdXNlQnV0dG9ufVxyXG5cdFx0XHRcdFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e2Z1bmN0aW9uKCl7cGFyZW50UGxheWxpc3QucGxheU5leHRUcmFjayhwYXJlbnRQbGF5bGlzdC5zdGF0ZS5jdXJyZW50VHJhY2spfX0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1za2lwLW5leHRcIj48L2k+PC9idXR0b24+XHJcblx0XHRcdFx0XHRcdDxidXR0b24gYWx0PVwidG9nZ2xlIHNodWZmbGVcIiB0aXRsZT1cInRvZ2dsZSBzaHVmZmxlXCIgY2xhc3NOYW1lPVwic2h1ZmZsZS1idXR0b25cIiBvbkNsaWNrPXtmdW5jdGlvbigpIHtwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7c2h1ZmZsZTogIXBhcmVudFBsYXlsaXN0LnN0YXRlLnNodWZmbGV9KTt9fT4gPGkgY2xhc3NOYW1lPXtcIm1kaSBtZGktc2h1ZmZsZVwiKygocGFyZW50UGxheWxpc3Quc3RhdGUuc2h1ZmZsZSkgPyBcIlwiIDogXCIgaW5hY3RpdmVcIil9PjwvaT4gPC9idXR0b24+XHJcblx0XHRcdFx0XHQ8L2Rpdj5cclxuXHJcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbnRyb2xzLXZvbHVtZVwiPlxyXG5cdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInZvbHVtZWJhci13cmFwXCIgb25DbGljaz17ZnVuY3Rpb24oZXZlbnQpIHtwYXJlbnRQbGF5bGlzdC5zZXRWb2x1bWUoKGV2ZW50LnBhZ2VYIC0gZXZlbnQudGFyZ2V0Lm9mZnNldExlZnQpIC8gZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoKTt9fT5cclxuXHRcdFx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInZvbHVtZWJhci1oZWlnaHQtd3JhcFwiPlxyXG5cdFx0XHRcdFx0XHRcdFx0PHByb2dyZXNzIGNsYXNzTmFtZT1cInZvbHVtZWJhclwiIHJlZj1cInZvbHVtZUJhclwiIHZhbHVlPXtwYXJlbnRQbGF5bGlzdC5zdGF0ZS52b2x1bWV9IG1heD1cIjFcIj48L3Byb2dyZXNzPlxyXG5cdFx0XHRcdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBhbHQ9XCJ0b2dnbGUgbXV0ZVwiIHRpdGxlPVwidG9nZ2xlIG11dGVcIiBjbGFzc05hbWU9XCJ0b2dnbGUtbXV0ZS1idXR0b25cIiBvbkNsaWNrPXtwYXJlbnRQbGF5bGlzdC50b2dnbGVNdXRlfT48aSBjbGFzc05hbWU9e1wibWRpIFwiK2dldFNwZWFrZXJJY29uKCl9PjwvaT48L2J1dHRvbj5cclxuXHRcdFx0XHRcdDwvZGl2Plx0XHRcclxuXHJcblxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0PC9kaXY+XHJcblx0XHQpO1xyXG5cclxuXHR9XHJcbn1cclxuUmVhY3RET00ucmVuZGVyKDxXZWJQbGF5bGlzdCBkcm9wem9uZT17d2luZG93fSAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWItcGxheWxpc3Qtd3JhcFwiKSk7Il19
