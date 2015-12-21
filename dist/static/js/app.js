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
			if (fileToPlay === _this.state.currentTrack && fileToPlay.audio.paused) {
				fileToPlay.audio.play();
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

				_this.setState({ currentTrack: null });

				if (fileToPlay.audio.element !== null) {
					fileToPlay.audio.play();
					_this.setState({ currentTrack: fileToPlay });
				} else {
					fileToPlay.read(true);
				}
			}
			_this.forceUpdate();
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsb0NBQW9DLENBQUM7O0FBRS9ELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQW1CaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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O0FBQ2YsZ0JBQWEsRUFBRSxLQUFLO0FBQ3BCLGVBQVksRUFBRSxJQUFJO0FBQ2xCLFNBQU0sRUFBRSxDQUFDO0FBQ1QsY0FBVyxFQUFFLENBQUM7QUFDZCxVQUFPLEVBQUUsS0FBSztHQUNkLENBQUE7O0VBQ0Q7O2NBYkksV0FBVzs7OEJBY0osS0FBSyxFQUFFO0FBQ2xCLFFBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN4QixRQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdkIsVUFBTyxLQUFLLENBQUM7R0FDYjs7O1FBbEJJLFdBQVc7R0FBUyxLQUFLLENBQUMsU0FBUzs7QUF3YXpDLFFBQVEsQ0FBQyxNQUFNLENBQUMsb0JBQUMsV0FBVyxJQUFDLFFBQVEsRUFBRSxNQUFNLEFBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IFdPUktFUl9GSUxFUkVBREVSID0gXCJzdGF0aWMvanMvRmlsZVJlYWRlclN5bmNfd29ya2VyLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpIHtcclxuXHRpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudC5kYXRhVHJhbnNmZXIudHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlc1tpXSA9PT0gXCJGaWxlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHR9XHJcbiAgICByZXR1cm4gZmFsc2U7XHRcdFx0XHJcbn1cclxuXHJcbmxldCBwbGFjZWhvbGRlckxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG5wbGFjZWhvbGRlckxpLmNsYXNzTmFtZSA9IFwicGxhY2Vob2xkZXJcIjtcclxuXHJcbmNsYXNzIFdlYlBsYXlsaXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0dGhpcy5zdGF0ZSA9IHtcclxuXHRcdFx0ZmlsZXM6IFtdLFxyXG5cdFx0XHRyZXBlYXRBbGw6IHRydWUsXHJcblx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0XHRjdXJyZW50VHJhY2s6IG51bGwsXHJcblx0XHRcdHZvbHVtZTogMSxcclxuXHRcdFx0bXV0ZWRWb2x1bWU6IDEsIC8vc291bmQtbGV2ZWwgdG8gcmV0dXJuIHRvIGFmdGVyIHVubXV0aW5nLiBUaGUgdm9sdW1lIHdhcyBhdCB0aGlzIGxldmVsIHdoZW4gdGhlIHBsYXllciB3YXMgbXV0ZWQuXHJcblx0XHRcdHNodWZmbGU6IGZhbHNlLFxyXG5cdFx0fVxyXG5cdH1cclxuXHRjYW5jZWxFdmVudChldmVudCkge1xyXG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0cmV0dXJuIGV2ZW50O1xyXG5cdH1cclxuXHRidWJibGVFdmVudCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJldHVybiBldmVudDtcclxuXHRcdH1cclxuXHR9XHJcblx0ZHJhZ1N0YXJ0ID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIjtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9odG1sXCIsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xyXG5cdH1cclxuXHRkcmFnRW5kID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXJMaSk7XHJcblxyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGxldCBmcm9tID0gTnVtYmVyKHRoaXMuZHJhZ2dlZC5kYXRhc2V0LmlkKTtcclxuXHRcdGxldCB0byA9IE51bWJlcih0aGlzLm92ZXIuZGF0YXNldC5pZCk7XHJcblx0XHRpZiAoZnJvbSA8IHRvKSB0by0tO1xyXG5cdFx0ZmlsZXMuc3BsaWNlKHRvLCAwLCBmaWxlcy5zcGxpY2UoZnJvbSwgMSlbMF0pO1xyXG5cclxuXHRcdGZpbGVzLmZvckVhY2goKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZpbGUuaW5kZXggPSBpbmRleDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiBmaWxlc30pO1xyXG5cdH1cclxuXHRkcmFnT3ZlciA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpOztcclxuXHRcdH1cclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdFx0aWYgKGV2ZW50LnRhcmdldC5jbGFzc05hbWUgPT0gXCJwbGFjZWhvbGRlclwiKSByZXR1cm47XHJcblx0XHR0aGlzLm92ZXIgPSBldmVudC50YXJnZXQ7XHJcblxyXG5cdFx0bGV0IHJlbFkgPSBldmVudC5jbGllbnRZIC0gdGhpcy5vdmVyLm9mZnNldFRvcDtcclxuXHRcdGxldCBoZWlnaHQgPSB0aGlzLm92ZXIub2Zmc2V0SGVpZ2h0IC8gMjtcclxuXHRcdGxldCBwYXJlbnQgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcblx0XHRpZiAocGFyZW50ID09PSB0aGlzLnJlZnMudHJhY2tsaXN0KSB7XHJcblx0XHRcdGlmIChyZWxZID4gaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJhZnRlclwiO1xyXG5cdFx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0Lm5leHRFbGVtZW50U2libGluZyk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAocmVsWSA8IGhlaWdodCkge1xyXG5cdFx0XHRcdHRoaXMubm9kZVBsYWNlbWVudCA9IFwiYmVmb3JlXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cdGRyYWdFbnRlciA9IChldmVudCkgPT4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0ZHJhZ0xlYXZlID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcm9wID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoIWV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1x0XHRcdFxyXG5cdFx0fVxyXG5cdFx0ZXZlbnQgPSB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gXCJjb3B5XCI7XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRmb3IgKGxldCBpID0gMCwgZmlsZURhdGE7IGZpbGVEYXRhID0gZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGZpbGVEYXRhLnR5cGUuc3RhcnRzV2l0aChcImF1ZGlvL1wiKSkge1xyXG5cdFx0XHRcdGxldCBfZmlsZSA9IHtcclxuXHRcdFx0XHRcdGRhdGE6IGZpbGVEYXRhLFxyXG5cdFx0XHRcdFx0YXVkaW86IG5ldyBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50ID0gbnVsbDtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdGxldCBzZWxmID0gdGhpcztcclxuXHRcdFx0XHRcdFx0ZnVuY3Rpb24gc2Vjb25kc1RvUGFkZGVkTWludXRlcyhudW1iZXIpIHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgbWludXRlcyA9IE1hdGguZmxvb3IobnVtYmVyIC8gNjApO1xyXG5cdFx0XHRcdFx0XHRcdGxldCBzZWNvbmRzID0gKFwiMFwiICsgTWF0aC5yb3VuZChudW1iZXIgLSBtaW51dGVzKjYwKSkuc2xpY2UoLTIpO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBgJHttaW51dGVzfToke3NlY29uZHN9YDtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRsZXQgb25UaW1lVXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy50aW1lcG9zLnRleHRDb250ZW50ID0gc2Vjb25kc1RvUGFkZGVkTWludXRlcyh0aGlzLmVsZW1lbnQuY3VycmVudFRpbWUpO1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci52YWx1ZSA9IHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSAvIHRoaXMuZWxlbWVudC5kdXJhdGlvbjtcclxuXHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRsZXQgb25TZWVrQmFyQ2xpY2sgPSBmdW5jdGlvbihldmVudCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBwZXJjZW50YWdlID0gZXZlbnQub2Zmc2V0WCAvIHRoaXMub2Zmc2V0V2lkdGg7XHJcblx0XHRcdFx0XHRcdFx0c2VsZi5lbGVtZW50LmN1cnJlbnRUaW1lID0gcGVyY2VudGFnZSAqIHNlbGYuZWxlbWVudC5kdXJhdGlvbjtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIudmFsdWUgPSBwZXJjZW50YWdlIC8gMTAwO1xyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGF1c2UoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSA9IDA7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMudGltZXBvcy50ZXh0Q29udGVudCA9IFwiXCI7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsIG9uVGltZVVwZGF0ZSk7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uU2Vla0JhckNsaWNrKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMucGxheSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wbGF5KCk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5wYXVzZWQgPSBmYWxzZTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgb25UaW1lVXBkYXRlKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25TZWVrQmFyQ2xpY2spO1xyXG5cdFx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBhdXNlKCk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBhdXNlZCA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0YnVmZmVyOiBudWxsLFxyXG5cdFx0XHRcdFx0aW5kZXg6IHBhcmVudFBsYXlsaXN0LnN0YXRlLmZpbGVzLmxlbmd0aCxcclxuXHRcdFx0XHRcdGNyZWF0ZUF1ZGlvOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLmJ1ZmZlciAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBibG9iID0gbmV3IEJsb2IoW3RoaXMuYnVmZmVyXSwge3R5cGU6IHRoaXMuZGF0YS50eXBlfSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50ID0gbmV3IEF1ZGlvKFtVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LnZvbHVtZSA9IHBhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5TmV4dFRyYWNrKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrQmFyLnZhbHVlID0gMDtcclxuXHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcykpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiAocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0bGV0IG9uQ2FuUGxheSA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlGaWxlKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudC50eXBlLCBvbkNhblBsYXkpO1xyXG5cdFx0XHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjYW5wbGF5XCIsIG9uQ2FuUGxheSk7XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRyZWFkOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGxldCB3b3JrZXIgPSBuZXcgV29ya2VyKFdPUktFUl9GSUxFUkVBREVSKTtcclxuXHRcdFx0XHRcdFx0d29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmJ1ZmZlciA9IG1lc3NhZ2UuZGF0YTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmNyZWF0ZUF1ZGlvKHBsYXlXaGVuUmVhZHkpO1xyXG5cdFx0XHRcdFx0XHRcdHdvcmtlci50ZXJtaW5hdGUoKTtcclxuXHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIucG9zdE1lc3NhZ2UodGhpcy5kYXRhKTtcclxuXHRcdFx0XHRcdH0sXHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtmaWxlczogdGhpcy5zdGF0ZS5maWxlcy5jb25jYXQoW19maWxlXSl9KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRjb21wb25lbnREaWRNb3VudCA9ICgpID0+IHtcclxuXHRcdGxldCBkcm9wem9uZSA9IHRoaXMucHJvcHMuZHJvcHpvbmU7XHJcblx0XHRpZiAoZHJvcHpvbmUpIHtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbnRlclwiLCB0aGlzLmRyYWdFbnRlciwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgdGhpcy5kcmFnT3ZlciwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIHRoaXMuZHJhZ0xlYXZlLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIHRoaXMuZHJvcCwgZmFsc2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRjb21wb25lbnRXaWxsVW5tb3VudCA9ICgpID0+IHtcclxuXHRcdGxldCBkcm9wem9uZSA9IHRoaXMucHJvcHMuZHJvcHpvbmU7XHJcblx0XHRpZiAoZHJvcHpvbmUpIHtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdlbnRlclwiLCB0aGlzLmRyYWdFbnRlciwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgdGhpcy5kcmFnT3ZlciwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIHRoaXMuZHJhZ0xlYXZlLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIHRoaXMuZHJvcCwgZmFsc2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRwbGF5TmV4dFRyYWNrID0gKGN1cnJlbnQpID0+IHtcclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblxyXG5cdFx0aWYgKHRoaXMuc3RhdGUuc2h1ZmZsZSkge1xyXG5cdFx0XHQvL2NvbnNpZGVyIGFkZGluZyBhIHBsYXkgcXVldWUsIHNvIHdlIGNhbiBnZW5lcmF0ZSBhIHNodWZmbGVkIHBsYXlsaXN0IChGaXNoZXItWWF0ZXMgc2h1ZmZsZSkuIFRoaXMgd2lsbCBsZXQgYmFjay9uZXh0IHN0ZXAgdGhyb3VnaCB0aGUgc2h1ZmZsZWQgbGlzdFxyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBmaWxlcy5sZW5ndGgpXSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWN1cnJlbnQpIHtcclxuXHRcdFx0aWYgKGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoY3VycmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IG5leHQgPSBmaWxlc1tjdXJyZW50LmluZGV4KzFdO1xyXG5cdFx0aWYgKG5leHQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUobmV4dCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0QWxsICYmIGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRwbGF5UHJldlRyYWNrID0gKGN1cnJlbnQpID0+IHtcclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblx0XHRpZiAoIWN1cnJlbnQpIHtcclxuXHRcdFx0aWYgKGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0bGV0IHByZXYgPSBjdXJyZW50LmluZGV4ID09PSAwID8gZmlsZXNbZmlsZXMubGVuZ3RoLTFdIDogZmlsZXNbY3VycmVudC5pbmRleC0xXTtcclxuXHRcdGlmIChwcmV2KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKHByZXYpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cGxheUZpbGUgPSAoZmlsZVRvUGxheSkgPT4ge1xyXG5cdFx0aWYgKCFmaWxlVG9QbGF5KSByZXR1cm47XHJcblx0XHRpZiAoZmlsZVRvUGxheSA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50VHJhY2sgJiYgZmlsZVRvUGxheS5hdWRpby5wYXVzZWQpIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Zm9yIChsZXQgZmlsZSBvZiB0aGlzLnN0YXRlLmZpbGVzKSB7XHJcblx0XHRcdFx0ZmlsZS5hdWRpby5zdG9wKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7Y3VycmVudFRyYWNrOiBudWxsfSk7XHJcblxyXG5cdFx0XHRpZiAoZmlsZVRvUGxheS5hdWRpby5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7Y3VycmVudFRyYWNrOiBmaWxlVG9QbGF5fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0ZmlsZVRvUGxheS5yZWFkKHRydWUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7XHJcblx0fVxyXG5cdHBhdXNlQ3VycmVudCA9ICgpID0+IHtcclxuXHRcdGlmICh0aGlzLnN0YXRlLmN1cnJlbnRUcmFjayAhPT0gbnVsbCkge1xyXG5cdFx0XHR0aGlzLnN0YXRlLmN1cnJlbnRUcmFjay5hdWRpby5wYXVzZSgpO1xyXG5cdFx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHJlbW92ZUZpbGUgPSAoZmlsZVRvUmVtb3ZlKSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cclxuXHRcdGZpbGVzLnNwbGljZShmaWxlVG9SZW1vdmUuaW5kZXgsIDEpO1xyXG5cdFx0ZmlsZVRvUmVtb3ZlLmF1ZGlvLnN0b3AoKTtcclxuXHRcdGZpbGVUb1JlbW92ZS5hdWRpby5lbGVtZW50ID0gbnVsbDtcclxuXHRcdGZpbGVUb1JlbW92ZS5idWZmZXIgPSBudWxsO1xyXG5cclxuXHRcdGZpbGVzLmZvckVhY2goKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZpbGUuaW5kZXggPSBpbmRleDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiBmaWxlc30pO1xyXG5cdH1cclxuXHR0b2dnbGVSZXBlYXQgPSAoKSA9PiB7XHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRBbGwpIHtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0cmVwZWF0QWxsOiBmYWxzZSxcclxuXHRcdFx0XHRyZXBlYXRDdXJyZW50OiB0cnVlLFxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xyXG5cdFx0XHRcdHJlcGVhdEFsbDogZmFsc2UsXHJcblx0XHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICghdGhpcy5zdGF0ZS5yZXBlYXRBbGwgJiYgIXRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcclxuXHRcdFx0XHRyZXBlYXRBbGw6IHRydWUsXHJcblx0XHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0fVxyXG5cdHNldFZvbHVtZSA9ICh2b2x1bWUpID0+IHtcclxuXHRcdHRoaXMucmVmcy52b2x1bWVCYXIudmFsdWUgPSB2b2x1bWU7XHJcblx0XHR0aGlzLnN0YXRlLmZpbGVzLmZvckVhY2goZmlsZSA9PiB7XHJcblx0XHRcdGlmIChmaWxlLmF1ZGlvLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRmaWxlLmF1ZGlvLmVsZW1lbnQudm9sdW1lID0gdm9sdW1lO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdHRoaXMuc2V0U3RhdGUoe3ZvbHVtZTogdm9sdW1lfSk7XHJcblx0fVxyXG5cdHRvZ2dsZU11dGUgPSAoKSA9PiB7XHJcblx0XHRpZiAodGhpcy5zdGF0ZS52b2x1bWUgPiAwKSB7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xyXG5cdFx0XHRcdG11dGVkVm9sdW1lOiB0aGlzLnN0YXRlLnZvbHVtZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHRoaXMuc2V0Vm9sdW1lKDApO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRoaXMuc2V0Vm9sdW1lKHRoaXMuc3RhdGUubXV0ZWRWb2x1bWUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZW5kZXIgPSAoKSA9PiB7XHJcblxyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLmZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRyZXR1cm4gKFxyXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZmlsZWRyb3AtcHJvbXB0XCI+XHJcblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJtZGkgbWRpLWZpbGUtbXVzaWNcIj48L2k+XHJcblx0XHRcdFx0XHQ8c3Bhbj5EcmFnICYgRHJvcCBhIGJ1bmNoIG9mIG1wM3MgaGVyZSE8L3NwYW4+XHJcblx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRsZXQgdHJhY2tzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdHJldHVybiA8bGkgXHJcblx0XHRcdFx0Y2xhc3NOYW1lPXtmaWxlLmF1ZGlvLnBsYXlpbmcgPyBcInBsYXlpbmdcIiA6IFwiXCJ9XHJcblx0XHRcdFx0a2V5PXtcImZpbGUta2V5LVwiK2luZGV4fVxyXG5cdFx0XHRcdGRhdGEtaWQ9e2luZGV4fVxyXG5cdFx0XHRcdGRyYWdnYWJsZT1cInRydWVcIlxyXG5cdFx0XHRcdG9uRHJhZ0VuZD17cGFyZW50UGxheWxpc3QuZHJhZ0VuZH1cclxuXHRcdFx0XHRvbkRyYWdTdGFydD17cGFyZW50UGxheWxpc3QuZHJhZ1N0YXJ0fVxyXG5cdFx0XHQ+XHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ0cmFjay13cmFwXCIgb25DbGljaz17ZnVuY3Rpb24oKSB7cGFyZW50UGxheWxpc3QucGxheUZpbGUoZmlsZSk7fX0+XHJcblx0XHRcdFx0XHQ8c3Bhbj57ZmlsZS5kYXRhLm5hbWV9PC9zcGFuPlxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHRcdDxpIGFsdD1cInJlbW92ZSBmcm9tIHBsYXlsaXN0XCIgdGl0bGU9XCJyZW1vdmUgZnJvbSBwbGF5bGlzdFwiIG9uQ2xpY2s9e2Z1bmN0aW9uKCl7cGFyZW50UGxheWxpc3QucmVtb3ZlRmlsZShmaWxlKTt9fSBjbGFzc05hbWU9XCJtZGkgbWRpLXBsYXlsaXN0LXJlbW92ZSByZW1vdmUtZnJvbS1wbGF5bGlzdC1idXR0b25cIj48L2k+XHJcblx0XHRcdDwvbGk+XHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgcGxheXBhdXNlQnV0dG9uID0gbnVsbDtcclxuXHRcdGlmICh0aGlzLnN0YXRlLmN1cnJlbnRUcmFjayA9PT0gbnVsbCkge1xyXG5cdFx0XHRwbGF5cGF1c2VCdXR0b24gPSA8YnV0dG9uIG9uQ2xpY2s9e2Z1bmN0aW9uKCkge3BhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2soKTt9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXBsYXktY2lyY2xlIHBsYXlwYXVzZVwiPjwvaT48L2J1dHRvbj5cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRpZiAodGhpcy5zdGF0ZS5jdXJyZW50VHJhY2suYXVkaW8ucGF1c2VkKSB7XHJcblx0XHRcdFx0cGxheXBhdXNlQnV0dG9uID0gPGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpIHtwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZShwYXJlbnRQbGF5bGlzdC5zdGF0ZS5jdXJyZW50VHJhY2spO319PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcGxheS1jaXJjbGUgcGxheXBhdXNlXCI+PC9pPjwvYnV0dG9uPjtcdFxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdHBsYXlwYXVzZUJ1dHRvbiA9IDxidXR0b24gb25DbGljaz17cGFyZW50UGxheWxpc3QucGF1c2VDdXJyZW50fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXBhdXNlLWNpcmNsZSBwbGF5cGF1c2VcIj48L2k+PC9idXR0b24+O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHJlcGVhdEJ1dHRvbiA9IDxidXR0b24gYWx0PVwicmVwZWF0IGlzIG9mZlwiIHRpdGxlPVwicmVwZWF0IGlzIG9mZlwiIGNsYXNzTmFtZT1cInJlcGVhdC1idXR0b25cIiBvbkNsaWNrPXtwYXJlbnRQbGF5bGlzdC50b2dnbGVSZXBlYXR9PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcmVwZWF0IGluYWN0aXZlXCI+PC9pPjwvYnV0dG9uPjtcclxuXHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEFsbCkge1xyXG5cdFx0XHRyZXBlYXRCdXR0b24gPSA8YnV0dG9uIGFsdD1cInJlcGVhdCBpcyBvblwiIHRpdGxlPVwicmVwZWF0IGlzIG9uXCIgY2xhc3NOYW1lPVwicmVwZWF0LWJ1dHRvblwiIG9uQ2xpY2s9e3BhcmVudFBsYXlsaXN0LnRvZ2dsZVJlcGVhdH0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1yZXBlYXRcIj48L2k+PC9idXR0b24+O1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHJlcGVhdEJ1dHRvbiA9IDxidXR0b24gYWx0PVwicmVwZWF0aW5nIGN1cnJlbnRcIiB0aXRsZT1cInJlcGVhdGluZyBjdXJyZW50XCIgY2xhc3NOYW1lPVwicmVwZWF0LWJ1dHRvblwiIG9uQ2xpY2s9e3BhcmVudFBsYXlsaXN0LnRvZ2dsZVJlcGVhdH0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1yZXBlYXQtb25jZVwiPjwvaT48L2J1dHRvbj47XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U3BlYWtlckljb24oKSB7XHJcblx0XHRcdGlmIChwYXJlbnRQbGF5bGlzdC5zdGF0ZS52b2x1bWUgPiAwLjUpIHtcclxuXHRcdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLWhpZ2hcIjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lID4gMC4yNSkge1xyXG5cdFx0XHRcdHJldHVybiBcIm1kaS12b2x1bWUtbWVkaXVtXCI7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHBhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZSA+IDApIHtcclxuXHRcdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLWxvd1wiO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBcIm1kaS12b2x1bWUtb2ZmXCI7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuKFxyXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIndlYi1wbGF5bGlzdFwiPlxyXG5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRyYWNrbGlzdC13cmFwXCI+XHJcblx0XHRcdFx0XHQ8dWwgY2xhc3NOYW1lPVwidHJhY2tsaXN0XCIgcmVmPVwidHJhY2tsaXN0XCI+XHJcblx0XHRcdFx0XHRcdHt0cmFja3N9XHJcblx0XHRcdFx0XHQ8L3VsPlxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cclxuXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWVrYmFyLXdyYXBcIj5cclxuXHRcdFx0XHRcdDxwcm9ncmVzcyBjbGFzc05hbWU9XCJzZWVrYmFyXCIgcmVmPVwic2Vla0JhclwiIHZhbHVlPVwiMFwiIG1heD1cIjFcIj48L3Byb2dyZXNzPiBcclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9sc1wiPlxyXG5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidGltZXBvcy13cmFwXCI+XHJcblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInRpbWVwb3NcIiByZWY9XCJ0aW1lcG9zXCI+MDowMDwvc3Bhbj5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29udHJvbHMtcGxheWJhY2tcIj5cclxuXHRcdFx0XHRcdFx0e3JlcGVhdEJ1dHRvbn1cclxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpe3BhcmVudFBsYXlsaXN0LnBsYXlQcmV2VHJhY2socGFyZW50UGxheWxpc3Quc3RhdGUuY3VycmVudFRyYWNrKX19PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktc2tpcC1wcmV2aW91c1wiPjwvaT48L2J1dHRvbj5cclxuXHRcdFx0XHRcdFx0e3BsYXlwYXVzZUJ1dHRvbn1cclxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpe3BhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2socGFyZW50UGxheWxpc3Quc3RhdGUuY3VycmVudFRyYWNrKX19PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktc2tpcC1uZXh0XCI+PC9pPjwvYnV0dG9uPlxyXG5cdFx0XHRcdFx0XHQ8YnV0dG9uIGFsdD1cInRvZ2dsZSBzaHVmZmxlXCIgdGl0bGU9XCJ0b2dnbGUgc2h1ZmZsZVwiIGNsYXNzTmFtZT1cInNodWZmbGUtYnV0dG9uXCIgb25DbGljaz17ZnVuY3Rpb24oKSB7cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3NodWZmbGU6ICFwYXJlbnRQbGF5bGlzdC5zdGF0ZS5zaHVmZmxlfSk7fX0+IDxpIGNsYXNzTmFtZT17XCJtZGkgbWRpLXNodWZmbGVcIisoKHBhcmVudFBsYXlsaXN0LnN0YXRlLnNodWZmbGUpID8gXCJcIiA6IFwiIGluYWN0aXZlXCIpfT48L2k+IDwvYnV0dG9uPlxyXG5cdFx0XHRcdFx0PC9kaXY+XHJcblxyXG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9scy12b2x1bWVcIj5cclxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ2b2x1bWViYXItd3JhcFwiIG9uQ2xpY2s9e2Z1bmN0aW9uKGV2ZW50KSB7cGFyZW50UGxheWxpc3Quc2V0Vm9sdW1lKChldmVudC5wYWdlWCAtIGV2ZW50LnRhcmdldC5vZmZzZXRMZWZ0KSAvIGV2ZW50LnRhcmdldC5vZmZzZXRXaWR0aCk7fX0+XHJcblx0XHRcdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ2b2x1bWViYXItaGVpZ2h0LXdyYXBcIj5cclxuXHRcdFx0XHRcdFx0XHRcdDxwcm9ncmVzcyBjbGFzc05hbWU9XCJ2b2x1bWViYXJcIiByZWY9XCJ2b2x1bWVCYXJcIiB2YWx1ZT17cGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lfSBtYXg9XCIxXCI+PC9wcm9ncmVzcz5cclxuXHRcdFx0XHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0XHRcdDxidXR0b24gYWx0PVwidG9nZ2xlIG11dGVcIiB0aXRsZT1cInRvZ2dsZSBtdXRlXCIgY2xhc3NOYW1lPVwidG9nZ2xlLW11dGUtYnV0dG9uXCIgb25DbGljaz17cGFyZW50UGxheWxpc3QudG9nZ2xlTXV0ZX0+PGkgY2xhc3NOYW1lPXtcIm1kaSBcIitnZXRTcGVha2VySWNvbigpfT48L2k+PC9idXR0b24+XHJcblx0XHRcdFx0XHQ8L2Rpdj5cdFx0XHJcblxyXG5cclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHJcblx0XHRcdDwvZGl2PlxyXG5cdFx0KTtcclxuXHJcblx0fVxyXG59XHJcblJlYWN0RE9NLnJlbmRlcig8V2ViUGxheWxpc3QgZHJvcHpvbmU9e3dpbmRvd30gLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2ViLXBsYXlsaXN0LXdyYXBcIikpOyJdfQ==
