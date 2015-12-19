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
					React.createElement("i", { className: "mdi mdi-play-circle playpause" })
				);
			} else {
				playpauseButton = _this.state.pausedTrack !== null ? React.createElement(
					"button",
					{ onClick: function onClick() {
							parentPlaylist.playFile(parentPlaylist.state.pausedTrack);
						} },
					React.createElement("i", { className: "mdi mdi-play-circle playpause" })
				) : React.createElement(
					"button",
					{ onClick: pauseAll },
					React.createElement("i", { className: "mdi mdi-pause-circle playpause" })
				);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsb0NBQW9DLENBQUM7O0FBRS9ELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQW1CaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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T0FBTyxFQUFFLGNBQWMsQ0FBQyxVQUFVLEFBQUM7T0FBQywyQkFBRyxTQUFTLEVBQUUsTUFBTSxHQUFDLGNBQWMsRUFBRSxBQUFDLEdBQUs7T0FBUztNQUNoSztLQUdEO0lBRUQsQ0FDTDtHQUVGOztBQXJhQSxRQUFLLEtBQUssR0FBRztBQUNaLFFBQUssRUFBRSxFQUFFO0FBQ1QsWUFBUyxFQUFFLElBQUk7QUFDZixnQkFBYSxFQUFFLEtBQUs7QUFDcEIsY0FBVyxFQUFFLElBQUk7QUFDakIsU0FBTSxFQUFFLENBQUM7QUFDVCxjQUFXLEVBQUUsQ0FBQztBQUNkLFVBQU8sRUFBRSxLQUFLO0dBQ2QsQ0FBQTs7RUFDRDs7Y0FiSSxXQUFXOzs4QkFjSixLQUFLLEVBQUU7QUFDbEIsUUFBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3hCLFFBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN2QixVQUFPLEtBQUssQ0FBQztHQUNiOzs7UUFsQkksV0FBVztHQUFTLEtBQUssQ0FBQyxTQUFTOztBQTJhekMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxXQUFXLElBQUMsUUFBUSxFQUFFLE1BQU0sQUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgV09SS0VSX0ZJTEVSRUFERVIgPSBcInN0YXRpYy9qcy9GaWxlUmVhZGVyU3luY193b3JrZXIuanNcIjtcclxuXHJcbmZ1bmN0aW9uIGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkge1xyXG5cdGlmIChldmVudC5kYXRhVHJhbnNmZXIudHlwZXMpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzW2ldID09PSBcIkZpbGVzXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cdH1cclxuICAgIHJldHVybiBmYWxzZTtcdFx0XHRcclxufVxyXG5cclxubGV0IHBsYWNlaG9sZGVyTGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbnBsYWNlaG9sZGVyTGkuY2xhc3NOYW1lID0gXCJwbGFjZWhvbGRlclwiO1xyXG5cclxuY2xhc3MgV2ViUGxheWxpc3QgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHJcblx0XHR0aGlzLnN0YXRlID0ge1xyXG5cdFx0XHRmaWxlczogW10sXHJcblx0XHRcdHJlcGVhdEFsbDogdHJ1ZSxcclxuXHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHRcdHBhdXNlZFRyYWNrOiBudWxsLFxyXG5cdFx0XHR2b2x1bWU6IDEsXHJcblx0XHRcdG11dGVkVm9sdW1lOiAxLCAvL3NvdW5kLWxldmVsIHRvIHJldHVybiB0byBhZnRlciB1bm11dGluZy4gVGhlIHZvbHVtZSB3YXMgYXQgdGhpcyBsZXZlbCB3aGVuIHRoZSBwbGF5ZXIgd2FzIG11dGVkLlxyXG5cdFx0XHRzaHVmZmxlOiBmYWxzZSxcclxuXHRcdH1cclxuXHR9XHJcblx0Y2FuY2VsRXZlbnQoZXZlbnQpIHtcclxuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHJldHVybiBldmVudDtcclxuXHR9XHJcblx0YnViYmxlRXZlbnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmIChldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0XHR9XHJcblx0fVxyXG5cdGRyYWdTdGFydCA9IChldmVudCkgPT4ge1xyXG5cdFx0dGhpcy5kcmFnZ2VkID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvaHRtbFwiLCBldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuXHR9XHJcblx0ZHJhZ0VuZCA9IChldmVudCkgPT4ge1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcclxuXHRcdHRoaXMuZHJhZ2dlZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBsYWNlaG9sZGVyTGkpO1xyXG5cclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblx0XHRsZXQgZnJvbSA9IE51bWJlcih0aGlzLmRyYWdnZWQuZGF0YXNldC5pZCk7XHJcblx0XHRsZXQgdG8gPSBOdW1iZXIodGhpcy5vdmVyLmRhdGFzZXQuaWQpO1xyXG5cdFx0aWYgKGZyb20gPCB0bykgdG8tLTtcclxuXHRcdGZpbGVzLnNwbGljZSh0bywgMCwgZmlsZXMuc3BsaWNlKGZyb20sIDEpWzBdKTtcclxuXHJcblx0XHRmaWxlcy5mb3JFYWNoKChmaWxlLCBpbmRleCkgPT4ge1xyXG5cdFx0XHRmaWxlLmluZGV4ID0gaW5kZXg7XHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLnNldFN0YXRlKHtmaWxlczogZmlsZXN9KTtcclxuXHR9XHJcblx0ZHJhZ092ZXIgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmIChldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTs7XHJcblx0XHR9XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHRcdGlmIChldmVudC50YXJnZXQuY2xhc3NOYW1lID09IFwicGxhY2Vob2xkZXJcIikgcmV0dXJuO1xyXG5cdFx0dGhpcy5vdmVyID0gZXZlbnQudGFyZ2V0O1xyXG5cclxuXHRcdGxldCByZWxZID0gZXZlbnQuY2xpZW50WSAtIHRoaXMub3Zlci5vZmZzZXRUb3A7XHJcblx0XHRsZXQgaGVpZ2h0ID0gdGhpcy5vdmVyLm9mZnNldEhlaWdodCAvIDI7XHJcblx0XHRsZXQgcGFyZW50ID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XHJcblxyXG5cdFx0aWYgKHBhcmVudCA9PT0gdGhpcy5yZWZzLnRyYWNrbGlzdCkge1xyXG5cdFx0XHRpZiAocmVsWSA+IGhlaWdodCkge1xyXG5cdFx0XHRcdHRoaXMubm9kZVBsYWNlbWVudCA9IFwiYWZ0ZXJcIjtcclxuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldC5uZXh0RWxlbWVudFNpYmxpbmcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHJlbFkgPCBoZWlnaHQpIHtcclxuXHRcdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImJlZm9yZVwiO1xyXG5cdFx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldCk7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHRkcmFnRW50ZXIgPSAoZXZlbnQpID0+IHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdGRyYWdMZWF2ZSA9IChldmVudCkgPT4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0ZHJvcCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKCFldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcdFx0XHRcclxuXHRcdH1cclxuXHRcdGV2ZW50ID0gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwiY29weVwiO1xyXG5cclxuXHRcdGxldCBwYXJlbnRQbGF5bGlzdCA9IHRoaXM7XHJcblxyXG5cdFx0Zm9yIChsZXQgaSA9IDAsIGZpbGVEYXRhOyBmaWxlRGF0YSA9IGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlc1tpXTsgaSsrKSB7XHJcblx0XHRcdGlmIChmaWxlRGF0YS50eXBlLnN0YXJ0c1dpdGgoXCJhdWRpby9cIikpIHtcclxuXHRcdFx0XHRsZXQgX2ZpbGUgPSB7XHJcblx0XHRcdFx0XHRkYXRhOiBmaWxlRGF0YSxcclxuXHRcdFx0XHRcdGF1ZGlvOiBuZXcgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudCA9IG51bGw7XHJcblx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRsZXQgc2VsZiA9IHRoaXM7XHJcblx0XHRcdFx0XHRcdGZ1bmN0aW9uIHNlY29uZHNUb1BhZGRlZE1pbnV0ZXMobnVtYmVyKSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKG51bWJlciAvIDYwKTtcclxuXHRcdFx0XHRcdFx0XHRsZXQgc2Vjb25kcyA9IChcIjBcIiArIE1hdGgucm91bmQobnVtYmVyIC0gbWludXRlcyo2MCkpLnNsaWNlKC0yKTtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYCR7bWludXRlc306JHtzZWNvbmRzfWA7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0bGV0IG9uVGltZVVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMudGltZXBvcy50ZXh0Q29udGVudCA9IHNlY29uZHNUb1BhZGRlZE1pbnV0ZXModGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lKTtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIudmFsdWUgPSB0aGlzLmVsZW1lbnQuY3VycmVudFRpbWUgLyB0aGlzLmVsZW1lbnQuZHVyYXRpb247XHJcblx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0bGV0IG9uU2Vla0JhckNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgcGVyY2VudGFnZSA9IGV2ZW50Lm9mZnNldFggLyB0aGlzLm9mZnNldFdpZHRoO1xyXG5cdFx0XHRcdFx0XHRcdHNlbGYuZWxlbWVudC5jdXJyZW50VGltZSA9IHBlcmNlbnRhZ2UgKiBzZWxmLmVsZW1lbnQuZHVyYXRpb247XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrQmFyLnZhbHVlID0gcGVyY2VudGFnZSAvIDEwMDtcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5zdG9wID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBhdXNlKCk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQuY3VycmVudFRpbWUgPSAwO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnRpbWVwb3MudGV4dENvbnRlbnQgPSBcIlwiO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCBvblRpbWVVcGRhdGUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrQmFyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvblNlZWtCYXJDbGljayk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBsYXkgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGxheSgpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtwYXVzZWRUcmFjazogbnVsbH0pO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCBvblRpbWVVcGRhdGUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrQmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvblNlZWtCYXJDbGljayk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBhdXNlKCk7XHJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0YnVmZmVyOiBudWxsLFxyXG5cdFx0XHRcdFx0aW5kZXg6IHBhcmVudFBsYXlsaXN0LnN0YXRlLmZpbGVzLmxlbmd0aCxcclxuXHRcdFx0XHRcdGNyZWF0ZUF1ZGlvOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLmJ1ZmZlciAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBibG9iID0gbmV3IEJsb2IoW3RoaXMuYnVmZmVyXSwge3R5cGU6IHRoaXMuZGF0YS50eXBlfSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50ID0gbmV3IEF1ZGlvKFtVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LnZvbHVtZSA9IHBhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5TmV4dFRyYWNrKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrQmFyLnZhbHVlID0gMDtcclxuXHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcykpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiAocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0bGV0IG9uQ2FuUGxheSA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlGaWxlKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudC50eXBlLCBvbkNhblBsYXkpO1xyXG5cdFx0XHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjYW5wbGF5XCIsIG9uQ2FuUGxheSk7XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRyZWFkOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGxldCB3b3JrZXIgPSBuZXcgV29ya2VyKFdPUktFUl9GSUxFUkVBREVSKTtcclxuXHRcdFx0XHRcdFx0d29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmJ1ZmZlciA9IG1lc3NhZ2UuZGF0YTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmNyZWF0ZUF1ZGlvKHBsYXlXaGVuUmVhZHkpO1xyXG5cdFx0XHRcdFx0XHRcdHdvcmtlci50ZXJtaW5hdGUoKTtcclxuXHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIucG9zdE1lc3NhZ2UodGhpcy5kYXRhKTtcclxuXHRcdFx0XHRcdH0sXHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtmaWxlczogdGhpcy5zdGF0ZS5maWxlcy5jb25jYXQoW19maWxlXSl9KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRjb21wb25lbnREaWRNb3VudCA9ICgpID0+IHtcclxuXHRcdGxldCBkcm9wem9uZSA9IHRoaXMucHJvcHMuZHJvcHpvbmU7XHJcblx0XHRpZiAoZHJvcHpvbmUpIHtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbnRlclwiLCB0aGlzLmRyYWdFbnRlciwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgdGhpcy5kcmFnT3ZlciwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIHRoaXMuZHJhZ0xlYXZlLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIHRoaXMuZHJvcCwgZmFsc2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRjb21wb25lbnRXaWxsVW5tb3VudCA9ICgpID0+IHtcclxuXHRcdGxldCBkcm9wem9uZSA9IHRoaXMucHJvcHMuZHJvcHpvbmU7XHJcblx0XHRpZiAoZHJvcHpvbmUpIHtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdlbnRlclwiLCB0aGlzLmRyYWdFbnRlciwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgdGhpcy5kcmFnT3ZlciwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIHRoaXMuZHJhZ0xlYXZlLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIHRoaXMuZHJvcCwgZmFsc2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRwbGF5TmV4dFRyYWNrID0gKGN1cnJlbnQpID0+IHtcclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblxyXG5cdFx0aWYgKHRoaXMuc3RhdGUuc2h1ZmZsZSkge1xyXG5cdFx0XHQvL2NvbnNpZGVyIGFkZGluZyBhIHBsYXkgcXVldWUsIHNvIHdlIGNhbiBnZW5lcmF0ZSBhIHNodWZmbGVkIHBsYXlsaXN0IChGaXNoZXItWWF0ZXMgc2h1ZmZsZSkuIFRoaXMgd2lsbCBsZXQgYmFjay9uZXh0IHN0ZXAgdGhyb3VnaCB0aGUgc2h1ZmZsZWQgbGlzdFxyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBmaWxlcy5sZW5ndGgpXSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWN1cnJlbnQpIHtcclxuXHRcdFx0aWYgKGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoY3VycmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IG5leHQgPSBmaWxlc1tjdXJyZW50LmluZGV4KzFdO1xyXG5cdFx0aWYgKG5leHQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUobmV4dCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0QWxsICYmIGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRwbGF5UHJldlRyYWNrID0gKGN1cnJlbnQpID0+IHtcclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblx0XHRpZiAoIWN1cnJlbnQpIHtcclxuXHRcdFx0aWYgKGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0bGV0IHByZXYgPSBjdXJyZW50LmluZGV4ID09PSAwID8gZmlsZXNbZmlsZXMubGVuZ3RoLTFdIDogZmlsZXNbY3VycmVudC5pbmRleC0xXTtcclxuXHRcdGlmIChwcmV2KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKHByZXYpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cGxheUZpbGUgPSAoZmlsZVRvUGxheSkgPT4ge1xyXG5cdFx0aWYgKCFmaWxlVG9QbGF5KSByZXR1cm47XHJcblx0XHRpZiAodGhpcy5zdGF0ZS5wYXVzZWRUcmFjayA9PT0gZmlsZVRvUGxheSkge1xyXG5cdFx0XHRmaWxlVG9QbGF5LmF1ZGlvLnBsYXkoKTtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IG51bGx9KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRmb3IgKGxldCBmaWxlIG9mIHRoaXMuc3RhdGUuZmlsZXMpIHtcclxuXHRcdFx0XHRmaWxlLmF1ZGlvLnN0b3AoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZmlsZVRvUGxheS5hdWRpby5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0ZmlsZVRvUGxheS5yZWFkKHRydWUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7XHJcblx0fVxyXG5cdHJlbW92ZUZpbGUgPSAoZmlsZVRvUmVtb3ZlKSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cclxuXHRcdGZpbGVzLnNwbGljZShmaWxlVG9SZW1vdmUuaW5kZXgsIDEpO1xyXG5cdFx0ZmlsZVRvUmVtb3ZlLmF1ZGlvLnN0b3AoKTtcclxuXHRcdGZpbGVUb1JlbW92ZS5hdWRpby5lbGVtZW50ID0gbnVsbDtcclxuXHRcdGZpbGVUb1JlbW92ZS5idWZmZXIgPSBudWxsO1xyXG5cclxuXHRcdGZpbGVzLmZvckVhY2goKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZpbGUuaW5kZXggPSBpbmRleDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiBmaWxlc30pO1xyXG5cdH1cclxuXHR0b2dnbGVSZXBlYXQgPSAoKSA9PiB7XHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRBbGwpIHtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0cmVwZWF0QWxsOiBmYWxzZSxcclxuXHRcdFx0XHRyZXBlYXRDdXJyZW50OiB0cnVlLFxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xyXG5cdFx0XHRcdHJlcGVhdEFsbDogZmFsc2UsXHJcblx0XHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICghdGhpcy5zdGF0ZS5yZXBlYXRBbGwgJiYgIXRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcclxuXHRcdFx0XHRyZXBlYXRBbGw6IHRydWUsXHJcblx0XHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0fVxyXG5cdHNldFZvbHVtZSA9ICh2b2x1bWUpID0+IHtcclxuXHRcdHRoaXMucmVmcy52b2x1bWVCYXIudmFsdWUgPSB2b2x1bWU7XHJcblx0XHR0aGlzLnN0YXRlLmZpbGVzLmZvckVhY2goZmlsZSA9PiB7XHJcblx0XHRcdGlmIChmaWxlLmF1ZGlvLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRmaWxlLmF1ZGlvLmVsZW1lbnQudm9sdW1lID0gdm9sdW1lO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdHRoaXMuc2V0U3RhdGUoe3ZvbHVtZTogdm9sdW1lfSk7XHJcblx0fVxyXG5cdHRvZ2dsZU11dGUgPSAoKSA9PiB7XHJcblx0XHRpZiAodGhpcy5zdGF0ZS52b2x1bWUgPiAwKSB7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xyXG5cdFx0XHRcdG11dGVkVm9sdW1lOiB0aGlzLnN0YXRlLnZvbHVtZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHRoaXMuc2V0Vm9sdW1lKDApO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRoaXMuc2V0Vm9sdW1lKHRoaXMuc3RhdGUubXV0ZWRWb2x1bWUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZW5kZXIgPSAoKSA9PiB7XHJcblxyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLmZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRyZXR1cm4gKFxyXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZmlsZWRyb3AtcHJvbXB0XCI+XHJcblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJtZGkgbWRpLWZpbGUtbXVzaWNcIj48L2k+XHJcblx0XHRcdFx0XHQ8c3Bhbj5EcmFnICYgRHJvcCBhIGJ1bmNoIG9mIG1wM3MgaGVyZSE8L3NwYW4+XHJcblx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRsZXQgdHJhY2tzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdHJldHVybiA8bGkgXHJcblx0XHRcdFx0Y2xhc3NOYW1lPXtmaWxlLmF1ZGlvLnBsYXlpbmcgPyBcInBsYXlpbmdcIiA6IFwiXCJ9XHJcblx0XHRcdFx0a2V5PXtcImZpbGUta2V5LVwiK2luZGV4fVxyXG5cdFx0XHRcdGRhdGEtaWQ9e2luZGV4fVxyXG5cdFx0XHRcdGRyYWdnYWJsZT1cInRydWVcIlxyXG5cdFx0XHRcdG9uRHJhZ0VuZD17cGFyZW50UGxheWxpc3QuZHJhZ0VuZH1cclxuXHRcdFx0XHRvbkRyYWdTdGFydD17cGFyZW50UGxheWxpc3QuZHJhZ1N0YXJ0fVxyXG5cdFx0XHQ+XHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ0cmFjay13cmFwXCIgb25DbGljaz17ZnVuY3Rpb24oKSB7cGFyZW50UGxheWxpc3QucGxheUZpbGUoZmlsZSk7fX0+XHJcblx0XHRcdFx0XHQ8c3Bhbj57ZmlsZS5kYXRhLm5hbWV9PC9zcGFuPlxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHRcdDxpIGFsdD1cInJlbW92ZSBmcm9tIHBsYXlsaXN0XCIgdGl0bGU9XCJyZW1vdmUgZnJvbSBwbGF5bGlzdFwiIG9uQ2xpY2s9e2Z1bmN0aW9uKCl7cGFyZW50UGxheWxpc3QucmVtb3ZlRmlsZShmaWxlKTt9fSBjbGFzc05hbWU9XCJtZGkgbWRpLXBsYXlsaXN0LXJlbW92ZSByZW1vdmUtZnJvbS1wbGF5bGlzdC1idXR0b25cIj48L2k+XHJcblx0XHRcdDwvbGk+XHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgYWN0aXZlVHJhY2tzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoZmlsZSA9PiB7XHJcblx0XHRcdGlmIChmaWxlLmF1ZGlvLnBsYXlpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmlsZTtcclxuXHRcdFx0fVxyXG5cdFx0fSkuZmlsdGVyKGxpc3RJdGVtID0+IChsaXN0SXRlbSkpOyAvL2lmICFmaWxlLmF1ZGlvLnBsYXlpbmcsIGxpc3RJdGVtIHdpbGwgYmUgdW5kZWZpbmVkIGFuZCBtdXN0IGJlIGZpbHRlcmVkIG91dC5cclxuXHJcblx0XHRsZXQgY3VycmVudFRyYWNrID0gYWN0aXZlVHJhY2tzLmxlbmd0aCA/IGFjdGl2ZVRyYWNrc1swXSA6IG51bGw7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcGF1c2VBbGwoKSB7XHJcblx0XHRcdGlmIChhY3RpdmVUcmFja3MubGVuZ3RoKSB7XHJcblx0XHRcdFx0YWN0aXZlVHJhY2tzLmZvckVhY2goZmlsZSA9PiBmaWxlLmF1ZGlvLnBhdXNlKCkpO1xyXG5cdFx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtwYXVzZWRUcmFjazogYWN0aXZlVHJhY2tzWzBdfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcGxheXBhdXNlQnV0dG9uID0gbnVsbDtcclxuXHRcdGlmICghYWN0aXZlVHJhY2tzLmxlbmd0aCAmJiB0aGlzLnN0YXRlLnBhdXNlZFRyYWNrID09PSBudWxsKSB7XHJcblx0XHRcdHBsYXlwYXVzZUJ1dHRvbiA9IDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKSB7cGFyZW50UGxheWxpc3QucGxheU5leHRUcmFjaygpO319PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcGxheS1jaXJjbGUgcGxheXBhdXNlXCI+PC9pPjwvYnV0dG9uPlxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHBsYXlwYXVzZUJ1dHRvbiA9ICh0aGlzLnN0YXRlLnBhdXNlZFRyYWNrICE9PSBudWxsKSA/IDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKSB7cGFyZW50UGxheWxpc3QucGxheUZpbGUocGFyZW50UGxheWxpc3Quc3RhdGUucGF1c2VkVHJhY2spO319PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcGxheS1jaXJjbGUgcGxheXBhdXNlXCI+PC9pPjwvYnV0dG9uPiA6IDxidXR0b24gb25DbGljaz17cGF1c2VBbGx9PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcGF1c2UtY2lyY2xlIHBsYXlwYXVzZVwiPjwvaT48L2J1dHRvbj47XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHJlcGVhdEJ1dHRvbiA9IDxidXR0b24gYWx0PVwicmVwZWF0IGlzIG9mZlwiIHRpdGxlPVwicmVwZWF0IGlzIG9mZlwiIGNsYXNzTmFtZT1cInJlcGVhdC1idXR0b25cIiBvbkNsaWNrPXtwYXJlbnRQbGF5bGlzdC50b2dnbGVSZXBlYXR9PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcmVwZWF0IGluYWN0aXZlXCI+PC9pPjwvYnV0dG9uPjtcclxuXHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEFsbCkge1xyXG5cdFx0XHRyZXBlYXRCdXR0b24gPSA8YnV0dG9uIGFsdD1cInJlcGVhdCBpcyBvblwiIHRpdGxlPVwicmVwZWF0IGlzIG9uXCIgY2xhc3NOYW1lPVwicmVwZWF0LWJ1dHRvblwiIG9uQ2xpY2s9e3BhcmVudFBsYXlsaXN0LnRvZ2dsZVJlcGVhdH0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1yZXBlYXRcIj48L2k+PC9idXR0b24+O1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHJlcGVhdEJ1dHRvbiA9IDxidXR0b24gYWx0PVwicmVwZWF0aW5nIGN1cnJlbnRcIiB0aXRsZT1cInJlcGVhdGluZyBjdXJyZW50XCIgY2xhc3NOYW1lPVwicmVwZWF0LWJ1dHRvblwiIG9uQ2xpY2s9e3BhcmVudFBsYXlsaXN0LnRvZ2dsZVJlcGVhdH0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1yZXBlYXQtb25jZVwiPjwvaT48L2J1dHRvbj47XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U3BlYWtlckljb24oKSB7XHJcblx0XHRcdGlmIChwYXJlbnRQbGF5bGlzdC5zdGF0ZS52b2x1bWUgPiAwLjUpIHtcclxuXHRcdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLWhpZ2hcIjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lID4gMC4yNSkge1xyXG5cdFx0XHRcdHJldHVybiBcIm1kaS12b2x1bWUtbWVkaXVtXCI7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHBhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZSA+IDApIHtcclxuXHRcdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLWxvd1wiO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBcIm1kaS12b2x1bWUtb2ZmXCI7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuKFxyXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIndlYi1wbGF5bGlzdFwiPlxyXG5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRyYWNrbGlzdC13cmFwXCI+XHJcblx0XHRcdFx0XHQ8dWwgY2xhc3NOYW1lPVwidHJhY2tsaXN0XCIgcmVmPVwidHJhY2tsaXN0XCI+XHJcblx0XHRcdFx0XHRcdHt0cmFja3N9XHJcblx0XHRcdFx0XHQ8L3VsPlxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cclxuXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWVrYmFyLXdyYXBcIj5cclxuXHRcdFx0XHRcdDxwcm9ncmVzcyBjbGFzc05hbWU9XCJzZWVrYmFyXCIgcmVmPVwic2Vla0JhclwiIHZhbHVlPVwiMFwiIG1heD1cIjFcIj48L3Byb2dyZXNzPiBcclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9sc1wiPlxyXG5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidGltZXBvcy13cmFwXCI+XHJcblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInRpbWVwb3NcIiByZWY9XCJ0aW1lcG9zXCI+MDowMDwvc3Bhbj5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cclxuXHJcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbnRyb2xzLXBsYXliYWNrXCI+XHJcblx0XHRcdFx0XHRcdHtyZXBlYXRCdXR0b259XHJcblx0XHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5UHJldlRyYWNrKGN1cnJlbnRUcmFjayl9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXNraXAtcHJldmlvdXNcIj48L2k+PC9idXR0b24+XHJcblx0XHRcdFx0XHRcdHtwbGF5cGF1c2VCdXR0b259XHJcblx0XHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5TmV4dFRyYWNrKGN1cnJlbnRUcmFjayl9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXNraXAtbmV4dFwiPjwvaT48L2J1dHRvbj5cclxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBhbHQ9XCJ0b2dnbGUgc2h1ZmZsZVwiIHRpdGxlPVwidG9nZ2xlIHNodWZmbGVcIiBjbGFzc05hbWU9XCJzaHVmZmxlLWJ1dHRvblwiIG9uQ2xpY2s9e2Z1bmN0aW9uKCkge3BhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtzaHVmZmxlOiAhcGFyZW50UGxheWxpc3Quc3RhdGUuc2h1ZmZsZX0pO319PiA8aSBjbGFzc05hbWU9e1wibWRpIG1kaS1zaHVmZmxlXCIrKChwYXJlbnRQbGF5bGlzdC5zdGF0ZS5zaHVmZmxlKSA/IFwiXCIgOiBcIiBpbmFjdGl2ZVwiKX0+PC9pPiA8L2J1dHRvbj5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29udHJvbHMtdm9sdW1lXCI+XHJcblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidm9sdW1lYmFyLXdyYXBcIiBvbkNsaWNrPXtmdW5jdGlvbihldmVudCkge3BhcmVudFBsYXlsaXN0LnNldFZvbHVtZSgoZXZlbnQucGFnZVggLSBldmVudC50YXJnZXQub2Zmc2V0TGVmdCkgLyBldmVudC50YXJnZXQub2Zmc2V0V2lkdGgpO319PlxyXG5cdFx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidm9sdW1lYmFyLWhlaWdodC13cmFwXCI+XHJcblx0XHRcdFx0XHRcdFx0XHQ8cHJvZ3Jlc3MgY2xhc3NOYW1lPVwidm9sdW1lYmFyXCIgcmVmPVwidm9sdW1lQmFyXCIgdmFsdWU9e3BhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZX0gbWF4PVwiMVwiPjwvcHJvZ3Jlc3M+XHJcblx0XHRcdFx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHRcdFx0XHQ8YnV0dG9uIGFsdD1cInRvZ2dsZSBtdXRlXCIgdGl0bGU9XCJ0b2dnbGUgbXV0ZVwiIGNsYXNzTmFtZT1cInRvZ2dsZS1tdXRlLWJ1dHRvblwiIG9uQ2xpY2s9e3BhcmVudFBsYXlsaXN0LnRvZ2dsZU11dGV9PjxpIGNsYXNzTmFtZT17XCJtZGkgXCIrZ2V0U3BlYWtlckljb24oKX0+PC9pPjwvYnV0dG9uPlxyXG5cdFx0XHRcdFx0PC9kaXY+XHRcdFxyXG5cclxuXHJcblx0XHRcdFx0PC9kaXY+XHJcblxyXG5cdFx0XHQ8L2Rpdj5cclxuXHRcdCk7XHJcblxyXG5cdH1cclxufVxyXG5SZWFjdERPTS5yZW5kZXIoPFdlYlBsYXlsaXN0IGRyb3B6b25lPXt3aW5kb3d9IC8+LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIndlYi1wbGF5bGlzdC13cmFwXCIpKTsiXX0=
