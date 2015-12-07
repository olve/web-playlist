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
									parentPlaylist.setState({ pausedTrack: null });

									this.element.addEventListener("timeupdate", onTimeUpdate);
									parentPlaylist.refs.seekBar.addEventListener("click", onSeekBarClick);
								}
							};
							this.pause = function () {
								if (this.element !== null) {
									this.element.pause();
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

		_this.componentDidMount = function () {
			var dropzone = _this.props.dropzone;
			if (dropzone) {
				dropzone.addEventListener("dragenter", _this.dragEnter, false);
				dropzone.addEventListener("dragover", _this.dragOver, false);
				dropzone.addEventListener("dragleave", _this.dragLeave, false);
				dropzone.addEventListener("drop", _this.drop, false);
			}
		};

		_this.componentWillUnmount = function () {
			var dropzone = _this.props.dropzone;
			if (dropzone) {
				dropzone.removeEventListener("dragenter", _this.dragEnter, false);
				dropzone.removeEventListener("dragover", _this.dragOver, false);
				dropzone.removeEventListener("dragleave", _this.dragLeave, false);
				dropzone.removeEventListener("drop", _this.drop, false);
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
			if (_this.state.pausedTrack === fileToPlay) {
				fileToPlay.audio.play();
				_this.setState({ pausedTrack: null });
			} else {
				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;

				try {
					for (var _iterator = _this.state.files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						var file = _step.value;

						file.audio.stop();
					}
				} catch (err) {
					_didIteratorError = true;
					_iteratorError = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion && _iterator.return) {
							_iterator.return();
						}
					} finally {
						if (_didIteratorError) {
							throw _iteratorError;
						}
					}
				}

				if (fileToPlay.audio.element !== null) {
					fileToPlay.audio.play();
				} else {
					fileToPlay.read(true);
				}
			}
			_this.forceUpdate();
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
					"Drag & Drop some music here!"
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
					React.createElement("i", { onClick: function onClick() {
							parentPlaylist.removeFile(file);
						}, className: "mdi mdi-playlist-remove" })
				);
			});

			var activeTracks = _this.state.files.map(function (file) {
				if (file.audio.playing) {
					return file;
				}
			}).filter(function (listItem) {
				return listItem;
			}); //if !file.audio.playing, listItem will be undefined and must be filtered out.

			var currentTrack = activeTracks.length ? activeTracks[0] : null;

			function pauseAll() {
				if (activeTracks.length) {
					activeTracks.forEach(function (file) {
						return file.audio.pause();
					});
					parentPlaylist.setState({ pausedTrack: activeTracks[0] });
				}
			}

			var playpauseButton = null;
			if (!activeTracks.length && _this.state.pausedTrack === null) {
				playpauseButton = React.createElement(
					"button",
					{ onClick: function onClick() {
							parentPlaylist.playNextTrack();
						} },
					React.createElement("i", { className: "mdi mdi-play" })
				);
			} else {
				playpauseButton = _this.state.pausedTrack !== null ? React.createElement(
					"button",
					{ onClick: function onClick() {
							parentPlaylist.playFile(parentPlaylist.state.pausedTrack);
						} },
					React.createElement("i", { className: "mdi mdi-play" })
				) : React.createElement(
					"button",
					{ onClick: pauseAll },
					React.createElement("i", { className: "mdi mdi-pause" })
				);
			}

			var repeatButtonIcon = React.createElement("i", { className: "mdi mdi-repeat inactive" });
			if (_this.state.repeatAll) {
				repeatButtonIcon = React.createElement("i", { className: "mdi mdi-repeat" });
			} else if (_this.state.repeatCurrent) {
				repeatButtonIcon = React.createElement("i", { className: "mdi mdi-repeat-once" });
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
					"ul",
					{ className: "tracklist", ref: "tracklist" },
					tracks
				),
				React.createElement(
					"div",
					{ className: "controls" },
					React.createElement(
						"div",
						{ className: "controls-playback" },
						React.createElement(
							"button",
							{ onClick: function onClick() {
									parentPlaylist.playPrevTrack(currentTrack);
								} },
							React.createElement("i", { className: "mdi mdi-skip-previous" })
						),
						playpauseButton,
						React.createElement(
							"button",
							{ onClick: function onClick() {
									parentPlaylist.playNextTrack(currentTrack);
								} },
							React.createElement("i", { className: "mdi mdi-skip-next" })
						)
					),
					React.createElement(
						"div",
						{ className: "controls-secondary" },
						React.createElement("progress", { className: "seekbar", ref: "seekBar", value: "0", max: "1" }),
						React.createElement(
							"span",
							{ className: "timepos", ref: "timepos" },
							"0:00"
						),
						React.createElement(
							"button",
							{ className: "repeat-button", onClick: parentPlaylist.toggleRepeat },
							repeatButtonIcon
						),
						React.createElement(
							"button",
							{ className: "shuffle-button", onClick: function onClick() {
									parentPlaylist.setState({ shuffle: !parentPlaylist.state.shuffle });
								} },
							" ",
							React.createElement("i", { className: "mdi mdi-shuffle" + (parentPlaylist.state.shuffle ? "" : " inactive") }),
							" "
						),
						React.createElement(
							"div",
							{ className: "controls-volume" },
							React.createElement("progress", { className: "volumebar", onClick: function onClick(event) {
									parentPlaylist.setVolume((event.pageX - event.target.offsetLeft) / event.target.offsetWidth);
								}, ref: "volumeBar", value: parentPlaylist.state.volume, max: "1" }),
							React.createElement(
								"button",
								{ className: "toggle-mute-button", onClick: parentPlaylist.toggleMute },
								React.createElement("i", { className: "mdi " + getSpeakerIcon() })
							)
						)
					)
				)
			);
		};

		_this.state = {
			files: [],
			repeatAll: true,
			repeatCurrent: false,
			pausedTrack: null,
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsb0NBQW9DLENBQUM7O0FBRS9ELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQW1CaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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YyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBXT1JLRVJfRklMRVJFQURFUiA9IFwic3RhdGljL2pzL0ZpbGVSZWFkZXJTeW5jX3dvcmtlci5qc1wiO1xyXG5cclxuZnVuY3Rpb24gZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSB7XHJcblx0aWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcykge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIudHlwZXNbaV0gPT09IFwiRmlsZXNcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblx0fVxyXG4gICAgcmV0dXJuIGZhbHNlO1x0XHRcdFxyXG59XHJcblxyXG5sZXQgcGxhY2Vob2xkZXJMaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxucGxhY2Vob2xkZXJMaS5jbGFzc05hbWUgPSBcInBsYWNlaG9sZGVyXCI7XHJcblxyXG5jbGFzcyBXZWJQbGF5bGlzdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cclxuXHRcdHRoaXMuc3RhdGUgPSB7XHJcblx0XHRcdGZpbGVzOiBbXSxcclxuXHRcdFx0cmVwZWF0QWxsOiB0cnVlLFxyXG5cdFx0XHRyZXBlYXRDdXJyZW50OiBmYWxzZSxcclxuXHRcdFx0cGF1c2VkVHJhY2s6IG51bGwsXHJcblx0XHRcdHZvbHVtZTogMSxcclxuXHRcdFx0bXV0ZWRWb2x1bWU6IDEsIC8vc291bmQtbGV2ZWwgdG8gcmV0dXJuIHRvIGFmdGVyIHVubXV0aW5nLiBUaGUgdm9sdW1lIHdhcyBhdCB0aGlzIGxldmVsIHdoZW4gdGhlIHBsYXllciB3YXMgbXV0ZWQuXHJcblx0XHRcdHNodWZmbGU6IGZhbHNlLFxyXG5cdFx0fVxyXG5cdH1cclxuXHRjYW5jZWxFdmVudChldmVudCkge1xyXG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0cmV0dXJuIGV2ZW50O1xyXG5cdH1cclxuXHRidWJibGVFdmVudCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJldHVybiBldmVudDtcclxuXHRcdH1cclxuXHR9XHJcblx0ZHJhZ1N0YXJ0ID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIjtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9odG1sXCIsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xyXG5cdH1cclxuXHRkcmFnRW5kID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXJMaSk7XHJcblxyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGxldCBmcm9tID0gTnVtYmVyKHRoaXMuZHJhZ2dlZC5kYXRhc2V0LmlkKTtcclxuXHRcdGxldCB0byA9IE51bWJlcih0aGlzLm92ZXIuZGF0YXNldC5pZCk7XHJcblx0XHRpZiAoZnJvbSA8IHRvKSB0by0tO1xyXG5cdFx0ZmlsZXMuc3BsaWNlKHRvLCAwLCBmaWxlcy5zcGxpY2UoZnJvbSwgMSlbMF0pO1xyXG5cclxuXHRcdGZpbGVzLmZvckVhY2goKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZpbGUuaW5kZXggPSBpbmRleDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiBmaWxlc30pO1xyXG5cdH1cclxuXHRkcmFnT3ZlciA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpOztcclxuXHRcdH1cclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdFx0aWYgKGV2ZW50LnRhcmdldC5jbGFzc05hbWUgPT0gXCJwbGFjZWhvbGRlclwiKSByZXR1cm47XHJcblx0XHR0aGlzLm92ZXIgPSBldmVudC50YXJnZXQ7XHJcblxyXG5cdFx0bGV0IHJlbFkgPSBldmVudC5jbGllbnRZIC0gdGhpcy5vdmVyLm9mZnNldFRvcDtcclxuXHRcdGxldCBoZWlnaHQgPSB0aGlzLm92ZXIub2Zmc2V0SGVpZ2h0IC8gMjtcclxuXHRcdGxldCBwYXJlbnQgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcblx0XHRpZiAocGFyZW50ID09PSB0aGlzLnJlZnMudHJhY2tsaXN0KSB7XHJcblx0XHRcdGlmIChyZWxZID4gaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJhZnRlclwiO1xyXG5cdFx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0Lm5leHRFbGVtZW50U2libGluZyk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAocmVsWSA8IGhlaWdodCkge1xyXG5cdFx0XHRcdHRoaXMubm9kZVBsYWNlbWVudCA9IFwiYmVmb3JlXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cdGRyYWdFbnRlciA9IChldmVudCkgPT4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0ZHJhZ0xlYXZlID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcm9wID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoIWV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1x0XHRcdFxyXG5cdFx0fVxyXG5cdFx0ZXZlbnQgPSB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gXCJjb3B5XCI7XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRmb3IgKGxldCBpID0gMCwgZmlsZURhdGE7IGZpbGVEYXRhID0gZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGZpbGVEYXRhLnR5cGUuc3RhcnRzV2l0aChcImF1ZGlvL1wiKSkge1xyXG5cdFx0XHRcdGxldCBfZmlsZSA9IHtcclxuXHRcdFx0XHRcdGRhdGE6IGZpbGVEYXRhLFxyXG5cdFx0XHRcdFx0YXVkaW86IG5ldyBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50ID0gbnVsbDtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdGxldCBzZWxmID0gdGhpcztcclxuXHRcdFx0XHRcdFx0ZnVuY3Rpb24gc2Vjb25kc1RvUGFkZGVkTWludXRlcyhudW1iZXIpIHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgbWludXRlcyA9IE1hdGguZmxvb3IobnVtYmVyIC8gNjApO1xyXG5cdFx0XHRcdFx0XHRcdGxldCBzZWNvbmRzID0gKFwiMFwiICsgTWF0aC5yb3VuZChudW1iZXIgLSBtaW51dGVzKjYwKSkuc2xpY2UoLTIpO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBgJHttaW51dGVzfToke3NlY29uZHN9YDtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRsZXQgb25UaW1lVXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy50aW1lcG9zLnRleHRDb250ZW50ID0gc2Vjb25kc1RvUGFkZGVkTWludXRlcyh0aGlzLmVsZW1lbnQuY3VycmVudFRpbWUpO1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci52YWx1ZSA9IHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSAvIHRoaXMuZWxlbWVudC5kdXJhdGlvbjtcclxuXHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRsZXQgb25TZWVrQmFyQ2xpY2sgPSBmdW5jdGlvbihldmVudCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBwZXJjZW50YWdlID0gZXZlbnQub2Zmc2V0WCAvIHRoaXMub2Zmc2V0V2lkdGg7XHJcblx0XHRcdFx0XHRcdFx0c2VsZi5lbGVtZW50LmN1cnJlbnRUaW1lID0gcGVyY2VudGFnZSAqIHNlbGYuZWxlbWVudC5kdXJhdGlvbjtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIudmFsdWUgPSBwZXJjZW50YWdlIC8gMTAwO1xyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGF1c2UoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSA9IDA7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMudGltZXBvcy50ZXh0Q29udGVudCA9IFwiXCI7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsIG9uVGltZVVwZGF0ZSk7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uU2Vla0JhckNsaWNrKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMucGxheSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wbGF5KCk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3BhdXNlZFRyYWNrOiBudWxsfSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsIG9uVGltZVVwZGF0ZSk7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uU2Vla0JhckNsaWNrKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGF1c2UoKTtcclxuXHRcdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRidWZmZXI6IG51bGwsXHJcblx0XHRcdFx0XHRpbmRleDogcGFyZW50UGxheWxpc3Quc3RhdGUuZmlsZXMubGVuZ3RoLFxyXG5cdFx0XHRcdFx0Y3JlYXRlQXVkaW86IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYnVmZmVyICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IGJsb2IgPSBuZXcgQmxvYihbdGhpcy5idWZmZXJdLCB7dHlwZTogdGhpcy5kYXRhLnR5cGV9KTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQgPSBuZXcgQXVkaW8oW1VSTC5jcmVhdGVPYmplY3RVUkwoYmxvYildKTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQudm9sdW1lID0gcGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2sodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIudmFsdWUgPSAwO1xyXG5cdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmIChwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRsZXQgb25DYW5QbGF5ID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LnR5cGUsIG9uQ2FuUGxheSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNhbnBsYXlcIiwgb25DYW5QbGF5KTtcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdHJlYWQ6IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHdvcmtlciA9IG5ldyBXb3JrZXIoV09SS0VSX0ZJTEVSRUFERVIpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYnVmZmVyID0gbWVzc2FnZS5kYXRhO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY3JlYXRlQXVkaW8ocGxheVdoZW5SZWFkeSk7XHJcblx0XHRcdFx0XHRcdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5wb3N0TWVzc2FnZSh0aGlzLmRhdGEpO1xyXG5cdFx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB0aGlzLnN0YXRlLmZpbGVzLmNvbmNhdChbX2ZpbGVdKX0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudERpZE1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlOZXh0VHJhY2sgPSAoY3VycmVudCkgPT4ge1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHJcblx0XHRpZiAodGhpcy5zdGF0ZS5zaHVmZmxlKSB7XHJcblx0XHRcdC8vY29uc2lkZXIgYWRkaW5nIGEgcGxheSBxdWV1ZSwgc28gd2UgY2FuIGdlbmVyYXRlIGEgc2h1ZmZsZWQgcGxheWxpc3QgKEZpc2hlci1ZYXRlcyBzaHVmZmxlKS4gVGhpcyB3aWxsIGxldCBiYWNrL25leHQgc3RlcCB0aHJvdWdoIHRoZSBzaHVmZmxlZCBsaXN0XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGZpbGVzLmxlbmd0aCldKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICghY3VycmVudCkge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShjdXJyZW50KTtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgbmV4dCA9IGZpbGVzW2N1cnJlbnQuaW5kZXgrMV07XHJcblx0XHRpZiAobmV4dCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShuZXh0KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRBbGwgJiYgZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlQcmV2VHJhY2sgPSAoY3VycmVudCkgPT4ge1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGlmICghY3VycmVudCkge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRsZXQgcHJldiA9IGN1cnJlbnQuaW5kZXggPT09IDAgPyBmaWxlc1tmaWxlcy5sZW5ndGgtMV0gOiBmaWxlc1tjdXJyZW50LmluZGV4LTFdO1xyXG5cdFx0aWYgKHByZXYpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUocHJldik7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aWYgKGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRwbGF5RmlsZSA9IChmaWxlVG9QbGF5KSA9PiB7XHJcblx0XHRpZiAoIWZpbGVUb1BsYXkpIHJldHVybjtcclxuXHRcdGlmICh0aGlzLnN0YXRlLnBhdXNlZFRyYWNrID09PSBmaWxlVG9QbGF5KSB7XHJcblx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtwYXVzZWRUcmFjazogbnVsbH0pO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGZvciAobGV0IGZpbGUgb2YgdGhpcy5zdGF0ZS5maWxlcykge1xyXG5cdFx0XHRcdGZpbGUuYXVkaW8uc3RvcCgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChmaWxlVG9QbGF5LmF1ZGlvLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRmaWxlVG9QbGF5LmF1ZGlvLnBsYXkoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRmaWxlVG9QbGF5LnJlYWQodHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHRoaXMuZm9yY2VVcGRhdGUoKTtcclxuXHR9XHJcblx0cmVtb3ZlRmlsZSA9IChmaWxlVG9SZW1vdmUpID0+IHtcclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblxyXG5cdFx0ZmlsZXMuc3BsaWNlKGZpbGVUb1JlbW92ZS5pbmRleCwgMSk7XHJcblx0XHRmaWxlVG9SZW1vdmUuYXVkaW8uc3RvcCgpO1xyXG5cdFx0ZmlsZVRvUmVtb3ZlLmF1ZGlvLmVsZW1lbnQgPSBudWxsO1xyXG5cdFx0ZmlsZVRvUmVtb3ZlLmJ1ZmZlciA9IG51bGw7XHJcblxyXG5cdFx0ZmlsZXMuZm9yRWFjaCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZmlsZS5pbmRleCA9IGluZGV4O1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IGZpbGVzfSk7XHJcblx0fVxyXG5cdHRvZ2dsZVJlcGVhdCA9ICgpID0+IHtcclxuXHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEFsbCkge1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcclxuXHRcdFx0XHRyZXBlYXRBbGw6IGZhbHNlLFxyXG5cdFx0XHRcdHJlcGVhdEN1cnJlbnQ6IHRydWUsXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0cmVwZWF0QWxsOiBmYWxzZSxcclxuXHRcdFx0XHRyZXBlYXRDdXJyZW50OiBmYWxzZSxcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKCF0aGlzLnN0YXRlLnJlcGVhdEFsbCAmJiAhdGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xyXG5cdFx0XHRcdHJlcGVhdEFsbDogdHJ1ZSxcclxuXHRcdFx0XHRyZXBlYXRDdXJyZW50OiBmYWxzZSxcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblx0c2V0Vm9sdW1lID0gKHZvbHVtZSkgPT4ge1xyXG5cdFx0dGhpcy5yZWZzLnZvbHVtZUJhci52YWx1ZSA9IHZvbHVtZTtcclxuXHRcdHRoaXMuc3RhdGUuZmlsZXMuZm9yRWFjaChmaWxlID0+IHtcclxuXHRcdFx0aWYgKGZpbGUuYXVkaW8uZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdGZpbGUuYXVkaW8uZWxlbWVudC52b2x1bWUgPSB2b2x1bWU7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7dm9sdW1lOiB2b2x1bWV9KTtcclxuXHR9XHJcblx0dG9nZ2xlTXV0ZSA9ICgpID0+IHtcclxuXHRcdGlmICh0aGlzLnN0YXRlLnZvbHVtZSA+IDApIHtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0bXV0ZWRWb2x1bWU6IHRoaXMuc3RhdGUudm9sdW1lLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0dGhpcy5zZXRWb2x1bWUoMCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy5zZXRWb2x1bWUodGhpcy5zdGF0ZS5tdXRlZFZvbHVtZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHJlbmRlciA9ICgpID0+IHtcclxuXHJcblx0XHRpZiAoIXRoaXMuc3RhdGUuZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdHJldHVybiAoXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWxlZHJvcC1wcm9tcHRcIj5cclxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cIm1kaSBtZGktZmlsZS1tdXNpY1wiPjwvaT5cclxuXHRcdFx0XHRcdERyYWcgJiBEcm9wIHNvbWUgbXVzaWMgaGVyZSFcclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGxldCB0cmFja3MgPSB0aGlzLnN0YXRlLmZpbGVzLm1hcCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0cmV0dXJuIDxsaSBcclxuXHRcdFx0XHRjbGFzc05hbWU9e2ZpbGUuYXVkaW8ucGxheWluZyA/IFwicGxheWluZ1wiIDogXCJcIn1cclxuXHRcdFx0XHRrZXk9e1wiZmlsZS1rZXktXCIraW5kZXh9XHJcblx0XHRcdFx0ZGF0YS1pZD17aW5kZXh9XHJcblx0XHRcdFx0ZHJhZ2dhYmxlPVwidHJ1ZVwiXHJcblx0XHRcdFx0b25EcmFnRW5kPXtwYXJlbnRQbGF5bGlzdC5kcmFnRW5kfVxyXG5cdFx0XHRcdG9uRHJhZ1N0YXJ0PXtwYXJlbnRQbGF5bGlzdC5kcmFnU3RhcnR9XHJcblx0XHRcdD5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRyYWNrLXdyYXBcIiBvbkNsaWNrPXtmdW5jdGlvbigpIHtwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZShmaWxlKTt9fT5cclxuXHRcdFx0XHRcdDxzcGFuPntmaWxlLmRhdGEubmFtZX08L3NwYW4+XHJcblx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0PGkgb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5yZW1vdmVGaWxlKGZpbGUpO319IGNsYXNzTmFtZT1cIm1kaSBtZGktcGxheWxpc3QtcmVtb3ZlXCI+PC9pPlxyXG5cdFx0XHQ8L2xpPlxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGFjdGl2ZVRyYWNrcyA9IHRoaXMuc3RhdGUuZmlsZXMubWFwKGZpbGUgPT4ge1xyXG5cdFx0XHRpZiAoZmlsZS5hdWRpby5wbGF5aW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZpbGU7XHJcblx0XHRcdH1cclxuXHRcdH0pLmZpbHRlcihsaXN0SXRlbSA9PiAobGlzdEl0ZW0pKTsgLy9pZiAhZmlsZS5hdWRpby5wbGF5aW5nLCBsaXN0SXRlbSB3aWxsIGJlIHVuZGVmaW5lZCBhbmQgbXVzdCBiZSBmaWx0ZXJlZCBvdXQuXHJcblxyXG5cdFx0bGV0IGN1cnJlbnRUcmFjayA9IGFjdGl2ZVRyYWNrcy5sZW5ndGggPyBhY3RpdmVUcmFja3NbMF0gOiBudWxsO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHBhdXNlQWxsKCkge1xyXG5cdFx0XHRpZiAoYWN0aXZlVHJhY2tzLmxlbmd0aCkge1xyXG5cdFx0XHRcdGFjdGl2ZVRyYWNrcy5mb3JFYWNoKGZpbGUgPT4gZmlsZS5hdWRpby5wYXVzZSgpKTtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IGFjdGl2ZVRyYWNrc1swXX0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHBsYXlwYXVzZUJ1dHRvbiA9IG51bGw7XHJcblx0XHRpZiAoIWFjdGl2ZVRyYWNrcy5sZW5ndGggJiYgdGhpcy5zdGF0ZS5wYXVzZWRUcmFjayA9PT0gbnVsbCkge1xyXG5cdFx0XHRwbGF5cGF1c2VCdXR0b24gPSA8YnV0dG9uIG9uQ2xpY2s9e2Z1bmN0aW9uKCkge3BhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2soKTt9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXBsYXlcIj48L2k+PC9idXR0b24+XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cGxheXBhdXNlQnV0dG9uID0gKHRoaXMuc3RhdGUucGF1c2VkVHJhY2sgIT09IG51bGwpID8gPGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpIHtwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZShwYXJlbnRQbGF5bGlzdC5zdGF0ZS5wYXVzZWRUcmFjayk7fX0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1wbGF5XCI+PC9pPjwvYnV0dG9uPiA6IDxidXR0b24gb25DbGljaz17cGF1c2VBbGx9PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcGF1c2VcIj48L2k+PC9idXR0b24+O1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCByZXBlYXRCdXR0b25JY29uID0gPGkgY2xhc3NOYW1lPVwibWRpIG1kaS1yZXBlYXQgaW5hY3RpdmVcIj48L2k+XHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRBbGwpIHtcclxuXHRcdFx0cmVwZWF0QnV0dG9uSWNvbiA9IDxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcmVwZWF0XCI+PC9pPlxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHJlcGVhdEJ1dHRvbkljb24gPSA8aSBjbGFzc05hbWU9XCJtZGkgbWRpLXJlcGVhdC1vbmNlXCI+PC9pPlxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFNwZWFrZXJJY29uKCkge1xyXG5cdFx0XHRpZiAocGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lID4gMC41KSB7XHJcblx0XHRcdFx0cmV0dXJuIFwibWRpLXZvbHVtZS1oaWdoXCI7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHBhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZSA+IDAuMjUpIHtcclxuXHRcdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLW1lZGl1bVwiO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChwYXJlbnRQbGF5bGlzdC5zdGF0ZS52b2x1bWUgPiAwKSB7XHJcblx0XHRcdFx0cmV0dXJuIFwibWRpLXZvbHVtZS1sb3dcIjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLW9mZlwiO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybihcclxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ3ZWItcGxheWxpc3RcIj5cclxuXHJcblx0XHRcdFx0PHVsIGNsYXNzTmFtZT1cInRyYWNrbGlzdFwiIHJlZj1cInRyYWNrbGlzdFwiPlxyXG5cdFx0XHRcdFx0e3RyYWNrc31cclxuXHRcdFx0XHQ8L3VsPlxyXG5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbnRyb2xzXCI+XHJcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbnRyb2xzLXBsYXliYWNrXCI+XHJcblx0XHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5UHJldlRyYWNrKGN1cnJlbnRUcmFjayl9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXNraXAtcHJldmlvdXNcIj48L2k+PC9idXR0b24+XHJcblx0XHRcdFx0XHRcdHtwbGF5cGF1c2VCdXR0b259XHJcblx0XHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5TmV4dFRyYWNrKGN1cnJlbnRUcmFjayl9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXNraXAtbmV4dFwiPjwvaT48L2J1dHRvbj5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29udHJvbHMtc2Vjb25kYXJ5XCI+XHJcblx0XHRcdFx0XHRcdDxwcm9ncmVzcyBjbGFzc05hbWU9XCJzZWVrYmFyXCIgcmVmPVwic2Vla0JhclwiIHZhbHVlPVwiMFwiIG1heD1cIjFcIj48L3Byb2dyZXNzPiBcclxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwidGltZXBvc1wiIHJlZj1cInRpbWVwb3NcIj4wOjAwPC9zcGFuPlxyXG5cdFx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzTmFtZT1cInJlcGVhdC1idXR0b25cIiBvbkNsaWNrPXtwYXJlbnRQbGF5bGlzdC50b2dnbGVSZXBlYXR9PntyZXBlYXRCdXR0b25JY29ufTwvYnV0dG9uPlxyXG5cdFx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzTmFtZT1cInNodWZmbGUtYnV0dG9uXCIgb25DbGljaz17ZnVuY3Rpb24oKSB7cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3NodWZmbGU6ICFwYXJlbnRQbGF5bGlzdC5zdGF0ZS5zaHVmZmxlfSk7fX0+IDxpIGNsYXNzTmFtZT17XCJtZGkgbWRpLXNodWZmbGVcIisoKHBhcmVudFBsYXlsaXN0LnN0YXRlLnNodWZmbGUpID8gXCJcIiA6IFwiIGluYWN0aXZlXCIpfT48L2k+IDwvYnV0dG9uPlxyXG5cclxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9scy12b2x1bWVcIj5cclxuXHRcdFx0XHRcdFx0XHQ8cHJvZ3Jlc3MgY2xhc3NOYW1lPVwidm9sdW1lYmFyXCIgb25DbGljaz17ZnVuY3Rpb24oZXZlbnQpIHtwYXJlbnRQbGF5bGlzdC5zZXRWb2x1bWUoKGV2ZW50LnBhZ2VYIC0gZXZlbnQudGFyZ2V0Lm9mZnNldExlZnQpIC8gZXZlbnQudGFyZ2V0Lm9mZnNldFdpZHRoKTt9fSByZWY9XCJ2b2x1bWVCYXJcIiB2YWx1ZT17cGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lfSBtYXg9XCIxXCI+PC9wcm9ncmVzcz5cclxuXHRcdFx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzTmFtZT1cInRvZ2dsZS1tdXRlLWJ1dHRvblwiIG9uQ2xpY2s9e3BhcmVudFBsYXlsaXN0LnRvZ2dsZU11dGV9PjxpIGNsYXNzTmFtZT17XCJtZGkgXCIrZ2V0U3BlYWtlckljb24oKX0+PC9pPjwvYnV0dG9uPlxyXG5cdFx0XHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0PC9kaXY+XHJcblx0XHQpO1xyXG5cclxuXHR9XHJcbn1cclxuUmVhY3RET00ucmVuZGVyKDxXZWJQbGF5bGlzdCBkcm9wem9uZT17d2luZG93fSAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWItcGxheWxpc3Qtd3JhcFwiKSk7Il19
