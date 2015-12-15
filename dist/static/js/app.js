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
					"ul",
					{ className: "tracklist", ref: "tracklist" },
					tracks
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
						React.createElement("progress", { className: "volumebar", onClick: function onClick(event) {
								parentPlaylist.setVolume((event.pageX - event.target.offsetLeft) / event.target.offsetWidth);
							}, ref: "volumeBar", value: parentPlaylist.state.volume, max: "1" }),
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsb0NBQW9DLENBQUM7O0FBRS9ELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQW1CaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFBQUssQ0FBQyxZQUFZLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQztBQUMxQyxRQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0dBQzdEOztRQUNELE9BQU8sR0FBRyxVQUFDLEtBQUssRUFBSztBQUNwQixTQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztBQUNwQyxTQUFLLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDOztBQUVuRCxPQUFJLEtBQUssR0FBRyxNQUFLLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDN0IsT0FBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQUssT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQyxPQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBSyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3RDLE9BQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztBQUNwQixRQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFOUMsUUFBSyxDQUFDLE9BQU8sQ0FBQyxVQUFDLElBQUksRUFBRSxLQUFLLEVBQUs7QUFDOUIsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbkIsQ0FBQyxDQUFDOztBQUVILFNBQUssUUFBUSxDQUFDLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7R0FDOUI7O1FBQ0QsUUFBUSxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3JCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2hDO0FBQ0QsUUFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3ZCLFNBQUssT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0FBQ3BDLE9BQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksYUFBYSxFQUFFLE9BQU87QUFDcEQsU0FBSyxJQUFJLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQzs7QUFFekIsT0FBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFLLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDL0MsT0FBSSxNQUFNLEdBQUcsTUFBSyxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztBQUN4QyxPQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQzs7QUFFckMsT0FBSSxNQUFNLEtBQUssTUFBSyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ25DLFFBQUksSUFBSSxHQUFHLE1BQU0sRUFBRTtBQUNsQixXQUFLLGFBQWEsR0FBRyxPQUFPLENBQUM7QUFDN0IsV0FBTSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0tBQ3BFLE1BQ0ksSUFBSSxJQUFJLEdBQUcsTUFBTSxFQUFFO0FBQ3ZCLFdBQUssYUFBYSxHQUFHLFFBQVEsQ0FBQztBQUM5QixXQUFNLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDakQ7QUFDRCxVQUFNLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakQ7R0FFRDs7UUFDRCxTQUFTLEdBQUcsVUFBQyxLQUFLO1VBQUssTUFBSyxXQUFXLENBQUMsS0FBSyxDQUFDO0dBQUE7O1FBQzlDLFNBQVMsR0FBRyxVQUFDLEtBQUs7VUFBSyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUM7R0FBQTs7UUFDOUMsSUFBSSxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ2pCLE9BQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUMvQixXQUFPLE1BQUssV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CO0FBQ0QsUUFBSyxHQUFHLE1BQUssV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hDLFFBQUssQ0FBQyxZQUFZLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQzs7QUFFdkMsT0FBSSxjQUFjLFFBQU8sQ0FBQzs7QUFFMUIsUUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RSxRQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3ZDLFNBQUksS0FBSyxHQUFHO0FBQ1gsVUFBSSxFQUFFLFFBQVE7QUFDZCxXQUFLLEVBQUUsS0FBSSxZQUFXO0FBQ3JCLFdBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFdBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFdBQUksSUFBSSxHQUFHLElBQUksQ0FBQztBQUNoQixnQkFBUyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUU7QUFDdkMsWUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDdEMsWUFBSSxPQUFPLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTyxHQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEUsZUFBVSxPQUFPLFNBQUksT0FBTyxDQUFHO1FBQy9CO0FBQ0QsV0FBSSxZQUFZLEdBQUcsQ0FBQSxZQUFXO0FBQzdCLHNCQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUMzRixzQkFBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQ3JGLENBQUEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDYixXQUFJLGNBQWMsR0FBRyxTQUFqQixjQUFjLENBQVksS0FBSyxFQUFFO0FBQ3BDLFlBQUksVUFBVSxHQUFHLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztBQUNsRCxZQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDOUQsc0JBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ3JELENBQUM7QUFDRixXQUFJLENBQUMsSUFBSSxHQUFHLFlBQVc7QUFDdEIsWUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtBQUMxQixhQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3JCLGFBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztBQUM3QixhQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNyQix1QkFBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7QUFFN0MsYUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDN0QsdUJBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN6RTtRQUNELENBQUM7QUFDRixXQUFJLENBQUMsSUFBSSxHQUFHLFlBQVc7QUFDdEIsWUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtBQUMxQixhQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BCLGFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLHVCQUFjLENBQUMsUUFBUSxDQUFDLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7O0FBRTdDLGFBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzFELHVCQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FFdEU7UUFDRCxDQUFDO0FBQ0YsV0FBSSxDQUFDLEtBQUssR0FBRyxZQUFXO0FBQ3ZCLFlBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7QUFDMUIsYUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNyQjtRQUNELENBQUM7T0FDRixDQUFBLEVBQUE7QUFDRCxZQUFNLEVBQUUsSUFBSTtBQUNaLFdBQUssRUFBRSxjQUFjLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3hDLGlCQUFXLEVBQUUscUJBQVMsYUFBYSxFQUFFOzs7QUFDcEMsV0FBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksRUFBRTtBQUN6QixZQUFJLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUM7QUFDM0QsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RCxZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDeEQsWUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUEsWUFBVztBQUN2RCxhQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNyQix1QkFBYyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuQyx1QkFBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztTQUN0QyxDQUFBLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBRWQsWUFBSSxhQUFhLEVBQUU7O0FBQ2xCLGNBQUksU0FBUyxHQUFHLENBQUEsVUFBUyxLQUFLLEVBQUU7QUFDL0IseUJBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsZUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztXQUM5RCxDQUFBLENBQUMsSUFBSSxRQUFNLENBQUM7QUFDYixpQkFBSyxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQzs7U0FDMUQ7UUFDRDtPQUNEO0FBQ0QsVUFBSSxFQUFFLGNBQVMsYUFBYSxFQUFFO0FBQzdCLFdBQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDM0MsYUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFBLFVBQVMsT0FBTyxFQUFFO0FBQ3BDLFlBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUMzQixZQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2hDLGNBQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNuQixDQUFBLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2IsYUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDOUI7O01BRUQsQ0FBQTtBQUNELFdBQUssUUFBUSxDQUFDLEVBQUMsS0FBSyxFQUFFLE1BQUssS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztLQUN6RDtJQUNEO0dBQ0Q7O1FBQ0QsaUJBQWlCLEdBQUcsWUFBTTtBQUN6QixPQUFJLFFBQVEsR0FBRyxNQUFLLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDbkMsT0FBSSxRQUFRLEVBQUU7QUFDYixZQUFRLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLE1BQUssU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzlELFlBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsTUFBSyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDNUQsWUFBUSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxNQUFLLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM5RCxZQUFRLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQUssSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BEO0dBQ0Q7O1FBQ0Qsb0JBQW9CLEdBQUcsWUFBTTtBQUM1QixPQUFJLFFBQVEsR0FBRyxNQUFLLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDbkMsT0FBSSxRQUFRLEVBQUU7QUFDYixZQUFRLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLE1BQUssU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2pFLFlBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLEVBQUUsTUFBSyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDL0QsWUFBUSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxNQUFLLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNqRSxZQUFRLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLE1BQUssSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3ZEO0dBQ0Q7O1FBQ0QsYUFBYSxHQUFHLFVBQUMsT0FBTyxFQUFLO0FBQzVCLE9BQUksS0FBSyxHQUFHLE1BQUssS0FBSyxDQUFDLEtBQUssQ0FBQzs7QUFFN0IsT0FBSSxNQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUU7O0FBRXZCLFdBQU8sTUFBSyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDckU7O0FBRUQsT0FBSSxDQUFDLE9BQU8sRUFBRTtBQUNiLFFBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUNqQixZQUFPLE1BQUssUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9CO0lBQ0Q7O0FBRUQsT0FBSSxNQUFLLEtBQUssQ0FBQyxhQUFhLEVBQUU7QUFDN0IsV0FBTyxNQUFLLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5Qjs7QUFFRCxPQUFJLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxPQUFJLElBQUksRUFBRTtBQUNULFdBQU8sTUFBSyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsTUFDSTtBQUNKLFFBQUksTUFBSyxLQUFLLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDekMsWUFBTyxNQUFLLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMvQjtJQUNEO0dBQ0Q7O1FBQ0QsYUFBYSxHQUFHLFVBQUMsT0FBTyxFQUFLO0FBQzVCLE9BQUksS0FBSyxHQUFHLE1BQUssS0FBSyxDQUFDLEtBQUssQ0FBQztBQUM3QixPQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2IsUUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO0FBQ2pCLFlBQU8sTUFBSyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7SUFDRDtBQUNELE9BQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hGLE9BQUksSUFBSSxFQUFFO0FBQ1QsV0FBTyxNQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixNQUNJO0FBQ0osUUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO0FBQ2pCLFlBQU8sTUFBSyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7SUFDRDtHQUNEOztRQUNELFFBQVEsR0FBRyxVQUFDLFVBQVUsRUFBSztBQUMxQixPQUFJLENBQUMsVUFBVSxFQUFFLE9BQU87QUFDeEIsT0FBSSxNQUFLLEtBQUssQ0FBQyxXQUFXLEtBQUssVUFBVSxFQUFFO0FBQzFDLGNBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDeEIsVUFBSyxRQUFRLENBQUMsRUFBQyxXQUFXLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUNuQyxNQUNJOzs7Ozs7QUFDSiwwQkFBaUIsTUFBSyxLQUFLLENBQUMsS0FBSyw4SEFBRTtVQUExQixJQUFJOztBQUNaLFVBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7TUFDbEI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDRCxRQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtBQUN0QyxlQUFVLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3hCLE1BQ0k7QUFDSixlQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3RCO0lBQ0Q7QUFDRCxTQUFLLFdBQVcsRUFBRSxDQUFDO0dBQ25COztRQUNELFVBQVUsR0FBRyxVQUFDLFlBQVksRUFBSztBQUM5QixPQUFJLEtBQUssR0FBRyxNQUFLLEtBQUssQ0FBQyxLQUFLLENBQUM7O0FBRTdCLFFBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNwQyxlQUFZLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzFCLGVBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUNsQyxlQUFZLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzs7QUFFM0IsUUFBSyxDQUFDLE9BQU8sQ0FBQyxVQUFDLElBQUksRUFBRSxLQUFLLEVBQUs7QUFDOUIsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbkIsQ0FBQyxDQUFDOztBQUVILFNBQUssUUFBUSxDQUFDLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7R0FDOUI7O1FBQ0QsWUFBWSxHQUFHLFlBQU07QUFDcEIsT0FBSSxNQUFLLEtBQUssQ0FBQyxTQUFTLEVBQUU7QUFDekIsVUFBSyxRQUFRLENBQUM7QUFDYixjQUFTLEVBQUUsS0FBSztBQUNoQixrQkFBYSxFQUFFLElBQUk7S0FDbkIsQ0FBQyxDQUFBO0lBQ0YsTUFDSSxJQUFJLE1BQUssS0FBSyxDQUFDLGFBQWEsRUFBRTtBQUNsQyxVQUFLLFFBQVEsQ0FBQztBQUNiLGNBQVMsRUFBRSxLQUFLO0FBQ2hCLGtCQUFhLEVBQUUsS0FBSztLQUNwQixDQUFDLENBQUE7SUFDRixNQUNJLElBQUksQ0FBQyxNQUFLLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxNQUFLLEtBQUssQ0FBQyxhQUFhLEVBQUU7QUFDNUQsVUFBSyxRQUFRLENBQUM7QUFDYixjQUFTLEVBQUUsSUFBSTtBQUNmLGtCQUFhLEVBQUUsS0FBSztLQUNwQixDQUFDLENBQUE7SUFDRjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLE1BQU0sRUFBSztBQUN2QixTQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztBQUNuQyxTQUFLLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSSxFQUFJO0FBQ2hDLFFBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssSUFBSSxFQUFFO0FBQ2hDLFNBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7S0FDbkM7SUFDRCxDQUFDLENBQUM7QUFDSCxTQUFLLFFBQVEsQ0FBQyxFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO0dBQ2hDOztRQUNELFVBQVUsR0FBRyxZQUFNO0FBQ2xCLE9BQUksTUFBSyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUMxQixVQUFLLFFBQVEsQ0FBQztBQUNiLGdCQUFXLEVBQUUsTUFBSyxLQUFLLENBQUMsTUFBTTtLQUM5QixDQUFDLENBQUM7QUFDSCxVQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixNQUNJO0FBQ0osVUFBSyxTQUFTLENBQUMsTUFBSyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdkM7R0FDRDs7UUFDRCxNQUFNLEdBQUcsWUFBTTs7QUFFZCxPQUFJLENBQUMsTUFBSyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUM3QixXQUNDOztPQUFLLFNBQVMsRUFBQyxpQkFBaUI7S0FDL0IsMkJBQUcsU0FBUyxFQUFDLG9CQUFvQixHQUFLOztLQUVqQyxDQUNMO0lBQ0Y7O0FBRUQsT0FBSSxjQUFjLFFBQU8sQ0FBQzs7QUFFMUIsT0FBSSxNQUFNLEdBQUcsTUFBSyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUksRUFBRSxLQUFLLEVBQUs7QUFDbEQsV0FBTzs7O0FBQ04sZUFBUyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFNBQVMsR0FBRyxFQUFFLEFBQUM7QUFDL0MsU0FBRyxFQUFFLFdBQVcsR0FBQyxLQUFLLEFBQUM7QUFDdkIsaUJBQVMsS0FBSyxBQUFDO0FBQ2YsZUFBUyxFQUFDLE1BQU07QUFDaEIsZUFBUyxFQUFFLGNBQWMsQ0FBQyxPQUFPLEFBQUM7QUFDbEMsaUJBQVcsRUFBRSxjQUFjLENBQUMsU0FBUyxBQUFDOztLQUV0Qzs7UUFBSyxTQUFTLEVBQUMsWUFBWSxFQUFDLE9BQU8sRUFBRSxtQkFBVztBQUFDLHNCQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQUMsQUFBQztNQUNoRjs7O09BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO09BQVE7TUFDeEI7S0FDTiwyQkFBRyxHQUFHLEVBQUMsc0JBQXNCLEVBQUMsS0FBSyxFQUFDLHNCQUFzQixFQUFDLE9BQU8sRUFBRSxtQkFBVTtBQUFDLHFCQUFjLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQUMsQUFBQyxFQUFDLFNBQVMsRUFBQyxxREFBcUQsR0FBSztLQUNsTCxDQUFBO0lBQ0wsQ0FBQyxDQUFDOztBQUVILE9BQUksWUFBWSxHQUFHLE1BQUssS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQSxJQUFJLEVBQUk7QUFDL0MsUUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtBQUN2QixZQUFPLElBQUksQ0FBQztLQUNaO0lBQ0QsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFBLFFBQVE7V0FBSyxRQUFRO0lBQUMsQ0FBQzs7QUFBQyxBQUVsQyxPQUFJLFlBQVksR0FBRyxZQUFZLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7O0FBRWhFLFlBQVMsUUFBUSxHQUFHO0FBQ25CLFFBQUksWUFBWSxDQUFDLE1BQU0sRUFBRTtBQUN4QixpQkFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFBLElBQUk7YUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRTtNQUFBLENBQUMsQ0FBQztBQUNqRCxtQkFBYyxDQUFDLFFBQVEsQ0FBQyxFQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0tBQ3hEO0lBQ0Q7O0FBRUQsT0FBSSxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBQzNCLE9BQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxJQUFJLE1BQUssS0FBSyxDQUFDLFdBQVcsS0FBSyxJQUFJLEVBQUU7QUFDNUQsbUJBQWUsR0FBRzs7T0FBUSxPQUFPLEVBQUUsbUJBQVc7QUFBQyxxQkFBYyxDQUFDLGFBQWEsRUFBRSxDQUFDO09BQUMsQUFBQztLQUFDLDJCQUFHLFNBQVMsRUFBQywrQkFBK0IsR0FBSztLQUFTLENBQUE7SUFDM0ksTUFDSTtBQUNKLG1CQUFlLEdBQUcsQUFBQyxNQUFLLEtBQUssQ0FBQyxXQUFXLEtBQUssSUFBSSxHQUFJOztPQUFRLE9BQU8sRUFBRSxtQkFBVztBQUFDLHFCQUFjLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7T0FBQyxBQUFDO0tBQUMsMkJBQUcsU0FBUyxFQUFDLCtCQUErQixHQUFLO0tBQVMsR0FBRzs7T0FBUSxPQUFPLEVBQUUsUUFBUSxBQUFDO0tBQUMsMkJBQUcsU0FBUyxFQUFDLGdDQUFnQyxHQUFLO0tBQVMsQ0FBQztJQUNwUzs7QUFFRCxPQUFJLFlBQVksR0FBRzs7TUFBUSxHQUFHLEVBQUMsZUFBZSxFQUFDLEtBQUssRUFBQyxlQUFlLEVBQUMsU0FBUyxFQUFDLGVBQWUsRUFBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLFlBQVksQUFBQztJQUFDLDJCQUFHLFNBQVMsRUFBQyx5QkFBeUIsR0FBSztJQUFTLENBQUM7QUFDMUwsT0FBSSxNQUFLLEtBQUssQ0FBQyxTQUFTLEVBQUU7QUFDekIsZ0JBQVksR0FBRzs7T0FBUSxHQUFHLEVBQUMsY0FBYyxFQUFDLEtBQUssRUFBQyxjQUFjLEVBQUMsU0FBUyxFQUFDLGVBQWUsRUFBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLFlBQVksQUFBQztLQUFDLDJCQUFHLFNBQVMsRUFBQyxnQkFBZ0IsR0FBSztLQUFTLENBQUM7SUFDM0ssTUFDSSxJQUFJLE1BQUssS0FBSyxDQUFDLGFBQWEsRUFBRTtBQUNsQyxnQkFBWSxHQUFHOztPQUFRLEdBQUcsRUFBQyxtQkFBbUIsRUFBQyxLQUFLLEVBQUMsbUJBQW1CLEVBQUMsU0FBUyxFQUFDLGVBQWUsRUFBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLFlBQVksQUFBQztLQUFDLDJCQUFHLFNBQVMsRUFBQyxxQkFBcUIsR0FBSztLQUFTLENBQUM7SUFDMUw7O0FBRUQsWUFBUyxjQUFjLEdBQUc7QUFDekIsUUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLEVBQUU7QUFDdEMsWUFBTyxpQkFBaUIsQ0FBQztLQUN6QjtBQUNELFFBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUFFO0FBQ3ZDLFlBQU8sbUJBQW1CLENBQUM7S0FDM0I7QUFDRCxRQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNwQyxZQUFPLGdCQUFnQixDQUFDO0tBQ3hCO0FBQ0QsV0FBTyxnQkFBZ0IsQ0FBQztJQUN4Qjs7QUFFRCxVQUNDOztNQUFLLFNBQVMsRUFBQyxjQUFjO0lBRTVCOztPQUFJLFNBQVMsRUFBQyxXQUFXLEVBQUMsR0FBRyxFQUFDLFdBQVc7S0FDdkMsTUFBTTtLQUNIO0lBR0w7O09BQUssU0FBUyxFQUFDLGNBQWM7S0FDNUIsa0NBQVUsU0FBUyxFQUFDLFNBQVMsRUFBQyxHQUFHLEVBQUMsU0FBUyxFQUFDLEtBQUssRUFBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLEdBQUcsR0FBWTtLQUNwRTtJQUVOOztPQUFLLFNBQVMsRUFBQyxVQUFVO0tBRXhCOztRQUFLLFNBQVMsRUFBQyxjQUFjO01BQzVCOztTQUFNLFNBQVMsRUFBQyxTQUFTLEVBQUMsR0FBRyxFQUFDLFNBQVM7O09BQVk7TUFDOUM7S0FHTjs7UUFBSyxTQUFTLEVBQUMsbUJBQW1CO01BQ2hDLFlBQVk7TUFDYjs7U0FBUSxPQUFPLEVBQUUsbUJBQVU7QUFBQyx1QkFBYyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtTQUFDLEFBQUM7T0FBQywyQkFBRyxTQUFTLEVBQUMsdUJBQXVCLEdBQUs7T0FBUztNQUMxSCxlQUFlO01BQ2hCOztTQUFRLE9BQU8sRUFBRSxtQkFBVTtBQUFDLHVCQUFjLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFBO1NBQUMsQUFBQztPQUFDLDJCQUFHLFNBQVMsRUFBQyxtQkFBbUIsR0FBSztPQUFTO01BQ3ZIOztTQUFRLEdBQUcsRUFBQyxnQkFBZ0IsRUFBQyxLQUFLLEVBQUMsZ0JBQWdCLEVBQUMsU0FBUyxFQUFDLGdCQUFnQixFQUFDLE9BQU8sRUFBRSxtQkFBVztBQUFDLHVCQUFjLENBQUMsUUFBUSxDQUFDLEVBQUMsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO1NBQUMsQUFBQzs7T0FBRSwyQkFBRyxTQUFTLEVBQUUsaUJBQWlCLElBQUUsQUFBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBSSxFQUFFLEdBQUcsV0FBVyxDQUFBLEFBQUMsQUFBQyxHQUFLOztPQUFVO01BQ3hRO0tBRU47O1FBQUssU0FBUyxFQUFDLGlCQUFpQjtNQUMvQixrQ0FBVSxTQUFTLEVBQUMsV0FBVyxFQUFDLE9BQU8sRUFBRSxpQkFBUyxLQUFLLEVBQUU7QUFBQyxzQkFBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUEsR0FBSSxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQUMsQUFBQyxFQUFDLEdBQUcsRUFBQyxXQUFXLEVBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxBQUFDLEVBQUMsR0FBRyxFQUFDLEdBQUcsR0FBWTtNQUNqTzs7U0FBUSxHQUFHLEVBQUMsYUFBYSxFQUFDLEtBQUssRUFBQyxhQUFhLEVBQUMsU0FBUyxFQUFDLG9CQUFvQixFQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsVUFBVSxBQUFDO09BQUMsMkJBQUcsU0FBUyxFQUFFLE1BQU0sR0FBQyxjQUFjLEVBQUUsQUFBQyxHQUFLO09BQVM7TUFDaEs7S0FHRDtJQUVELENBQ0w7R0FFRjs7QUEvWkEsUUFBSyxLQUFLLEdBQUc7QUFDWixRQUFLLEVBQUUsRUFBRTtBQUNULFlBQVMsRUFBRSxJQUFJO0FBQ2YsZ0JBQWEsRUFBRSxLQUFLO0FBQ3BCLGNBQVcsRUFBRSxJQUFJO0FBQ2pCLFNBQU0sRUFBRSxDQUFDO0FBQ1QsY0FBVyxFQUFFLENBQUM7QUFDZCxVQUFPLEVBQUUsS0FBSztHQUNkLENBQUE7O0VBQ0Q7O2NBYkksV0FBVzs7OEJBY0osS0FBSyxFQUFFO0FBQ2xCLFFBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN4QixRQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdkIsVUFBTyxLQUFLLENBQUM7R0FDYjs7O1FBbEJJLFdBQVc7R0FBUyxLQUFLLENBQUMsU0FBUzs7QUFxYXpDLFFBQVEsQ0FBQyxNQUFNLENBQUMsb0JBQUMsV0FBVyxJQUFDLFFBQVEsRUFBRSxNQUFNLEFBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IFdPUktFUl9GSUxFUkVBREVSID0gXCJzdGF0aWMvanMvRmlsZVJlYWRlclN5bmNfd29ya2VyLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpIHtcclxuXHRpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudC5kYXRhVHJhbnNmZXIudHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlc1tpXSA9PT0gXCJGaWxlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHR9XHJcbiAgICByZXR1cm4gZmFsc2U7XHRcdFx0XHJcbn1cclxuXHJcbmxldCBwbGFjZWhvbGRlckxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG5wbGFjZWhvbGRlckxpLmNsYXNzTmFtZSA9IFwicGxhY2Vob2xkZXJcIjtcclxuXHJcbmNsYXNzIFdlYlBsYXlsaXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0dGhpcy5zdGF0ZSA9IHtcclxuXHRcdFx0ZmlsZXM6IFtdLFxyXG5cdFx0XHRyZXBlYXRBbGw6IHRydWUsXHJcblx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0XHRwYXVzZWRUcmFjazogbnVsbCxcclxuXHRcdFx0dm9sdW1lOiAxLFxyXG5cdFx0XHRtdXRlZFZvbHVtZTogMSwgLy9zb3VuZC1sZXZlbCB0byByZXR1cm4gdG8gYWZ0ZXIgdW5tdXRpbmcuIFRoZSB2b2x1bWUgd2FzIGF0IHRoaXMgbGV2ZWwgd2hlbiB0aGUgcGxheWVyIHdhcyBtdXRlZC5cclxuXHRcdFx0c2h1ZmZsZTogZmFsc2UsXHJcblx0XHR9XHJcblx0fVxyXG5cdGNhbmNlbEV2ZW50KGV2ZW50KSB7XHJcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0fVxyXG5cdGJ1YmJsZUV2ZW50ID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGV2ZW50O1xyXG5cdFx0fVxyXG5cdH1cclxuXHRkcmFnU3RhcnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwibW92ZVwiO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0L2h0bWxcIiwgZXZlbnQuY3VycmVudFRhcmdldCk7XHJcblx0fVxyXG5cdGRyYWdFbmQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XHJcblx0XHR0aGlzLmRyYWdnZWQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwbGFjZWhvbGRlckxpKTtcclxuXHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0bGV0IGZyb20gPSBOdW1iZXIodGhpcy5kcmFnZ2VkLmRhdGFzZXQuaWQpO1xyXG5cdFx0bGV0IHRvID0gTnVtYmVyKHRoaXMub3Zlci5kYXRhc2V0LmlkKTtcclxuXHRcdGlmIChmcm9tIDwgdG8pIHRvLS07XHJcblx0XHRmaWxlcy5zcGxpY2UodG8sIDAsIGZpbGVzLnNwbGljZShmcm9tLCAxKVswXSk7XHJcblxyXG5cdFx0ZmlsZXMuZm9yRWFjaCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZmlsZS5pbmRleCA9IGluZGV4O1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IGZpbGVzfSk7XHJcblx0fVxyXG5cdGRyYWdPdmVyID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7O1xyXG5cdFx0fVxyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblx0XHRpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTmFtZSA9PSBcInBsYWNlaG9sZGVyXCIpIHJldHVybjtcclxuXHRcdHRoaXMub3ZlciA9IGV2ZW50LnRhcmdldDtcclxuXHJcblx0XHRsZXQgcmVsWSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLm92ZXIub2Zmc2V0VG9wO1xyXG5cdFx0bGV0IGhlaWdodCA9IHRoaXMub3Zlci5vZmZzZXRIZWlnaHQgLyAyO1xyXG5cdFx0bGV0IHBhcmVudCA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuXHRcdGlmIChwYXJlbnQgPT09IHRoaXMucmVmcy50cmFja2xpc3QpIHtcclxuXHRcdFx0aWYgKHJlbFkgPiBoZWlnaHQpIHtcclxuXHRcdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImFmdGVyXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQubmV4dEVsZW1lbnRTaWJsaW5nKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChyZWxZIDwgaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJiZWZvcmVcIjtcclxuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldCk7XHJcblx0XHRcdH1cclxuXHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0ZHJhZ0VudGVyID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcmFnTGVhdmUgPSAoZXZlbnQpID0+IHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdGRyb3AgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmICghZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHRcdFx0XHJcblx0XHR9XHJcblx0XHRldmVudCA9IHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcImNvcHlcIjtcclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwLCBmaWxlRGF0YTsgZmlsZURhdGEgPSBldmVudC5kYXRhVHJhbnNmZXIuZmlsZXNbaV07IGkrKykge1xyXG5cdFx0XHRpZiAoZmlsZURhdGEudHlwZS5zdGFydHNXaXRoKFwiYXVkaW8vXCIpKSB7XHJcblx0XHRcdFx0bGV0IF9maWxlID0ge1xyXG5cdFx0XHRcdFx0ZGF0YTogZmlsZURhdGEsXHJcblx0XHRcdFx0XHRhdWRpbzogbmV3IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQgPSBudWxsO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0bGV0IHNlbGYgPSB0aGlzO1xyXG5cdFx0XHRcdFx0XHRmdW5jdGlvbiBzZWNvbmRzVG9QYWRkZWRNaW51dGVzKG51bWJlcikge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBtaW51dGVzID0gTWF0aC5mbG9vcihudW1iZXIgLyA2MCk7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHNlY29uZHMgPSAoXCIwXCIgKyBNYXRoLnJvdW5kKG51bWJlciAtIG1pbnV0ZXMqNjApKS5zbGljZSgtMik7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGAke21pbnV0ZXN9OiR7c2Vjb25kc31gO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGxldCBvblRpbWVVcGRhdGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnRpbWVwb3MudGV4dENvbnRlbnQgPSBzZWNvbmRzVG9QYWRkZWRNaW51dGVzKHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSk7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrQmFyLnZhbHVlID0gdGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lIC8gdGhpcy5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdGxldCBvblNlZWtCYXJDbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHBlcmNlbnRhZ2UgPSBldmVudC5vZmZzZXRYIC8gdGhpcy5vZmZzZXRXaWR0aDtcclxuXHRcdFx0XHRcdFx0XHRzZWxmLmVsZW1lbnQuY3VycmVudFRpbWUgPSBwZXJjZW50YWdlICogc2VsZi5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci52YWx1ZSA9IHBlcmNlbnRhZ2UgLyAxMDA7XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lID0gMDtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy50aW1lcG9zLnRleHRDb250ZW50ID0gXCJcIjtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgb25UaW1lVXBkYXRlKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25TZWVrQmFyQ2xpY2spO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBsYXkoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IG51bGx9KTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgb25UaW1lVXBkYXRlKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25TZWVrQmFyQ2xpY2spO1xyXG5cclxuXHRcdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGJ1ZmZlcjogbnVsbCxcclxuXHRcdFx0XHRcdGluZGV4OiBwYXJlbnRQbGF5bGlzdC5zdGF0ZS5maWxlcy5sZW5ndGgsXHJcblx0XHRcdFx0XHRjcmVhdGVBdWRpbzogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5idWZmZXIgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgYmxvYiA9IG5ldyBCbG9iKFt0aGlzLmJ1ZmZlcl0sIHt0eXBlOiB0aGlzLmRhdGEudHlwZX0pO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudCA9IG5ldyBBdWRpbyhbVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKV0pO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC52b2x1bWUgPSBwYXJlbnRQbGF5bGlzdC5zdGF0ZS52b2x1bWU7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheU5leHRUcmFjayh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci52YWx1ZSA9IDA7XHJcblx0XHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGxldCBvbkNhblBsYXkgPSBmdW5jdGlvbihldmVudCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZSh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQudHlwZSwgb25DYW5QbGF5KTtcclxuXHRcdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2FucGxheVwiLCBvbkNhblBsYXkpO1x0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0cmVhZDogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRsZXQgd29ya2VyID0gbmV3IFdvcmtlcihXT1JLRVJfRklMRVJFQURFUik7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5idWZmZXIgPSBtZXNzYWdlLmRhdGE7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5jcmVhdGVBdWRpbyhwbGF5V2hlblJlYWR5KTtcclxuXHRcdFx0XHRcdFx0XHR3b3JrZXIudGVybWluYXRlKCk7XHJcblx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0d29ya2VyLnBvc3RNZXNzYWdlKHRoaXMuZGF0YSk7XHJcblx0XHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHRoaXMuc3RhdGUuZmlsZXMuY29uY2F0KFtfZmlsZV0pfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50V2lsbFVubW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cGxheU5leHRUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cclxuXHRcdGlmICh0aGlzLnN0YXRlLnNodWZmbGUpIHtcclxuXHRcdFx0Ly9jb25zaWRlciBhZGRpbmcgYSBwbGF5IHF1ZXVlLCBzbyB3ZSBjYW4gZ2VuZXJhdGUgYSBzaHVmZmxlZCBwbGF5bGlzdCAoRmlzaGVyLVlhdGVzIHNodWZmbGUpLiBUaGlzIHdpbGwgbGV0IGJhY2svbmV4dCBzdGVwIHRocm91Z2ggdGhlIHNodWZmbGVkIGxpc3RcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZmlsZXMubGVuZ3RoKV0pXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFjdXJyZW50KSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGN1cnJlbnQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBuZXh0ID0gZmlsZXNbY3VycmVudC5pbmRleCsxXTtcclxuXHRcdGlmIChuZXh0KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKG5leHQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEFsbCAmJiBmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cGxheVByZXZUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0aWYgKCFjdXJyZW50KSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGxldCBwcmV2ID0gY3VycmVudC5pbmRleCA9PT0gMCA/IGZpbGVzW2ZpbGVzLmxlbmd0aC0xXSA6IGZpbGVzW2N1cnJlbnQuaW5kZXgtMV07XHJcblx0XHRpZiAocHJldikge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShwcmV2KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlGaWxlID0gKGZpbGVUb1BsYXkpID0+IHtcclxuXHRcdGlmICghZmlsZVRvUGxheSkgcmV0dXJuO1xyXG5cdFx0aWYgKHRoaXMuc3RhdGUucGF1c2VkVHJhY2sgPT09IGZpbGVUb1BsYXkpIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3BhdXNlZFRyYWNrOiBudWxsfSk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Zm9yIChsZXQgZmlsZSBvZiB0aGlzLnN0YXRlLmZpbGVzKSB7XHJcblx0XHRcdFx0ZmlsZS5hdWRpby5zdG9wKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGZpbGVUb1BsYXkuYXVkaW8uZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGZpbGVUb1BsYXkucmVhZCh0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dGhpcy5mb3JjZVVwZGF0ZSgpO1xyXG5cdH1cclxuXHRyZW1vdmVGaWxlID0gKGZpbGVUb1JlbW92ZSkgPT4ge1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHJcblx0XHRmaWxlcy5zcGxpY2UoZmlsZVRvUmVtb3ZlLmluZGV4LCAxKTtcclxuXHRcdGZpbGVUb1JlbW92ZS5hdWRpby5zdG9wKCk7XHJcblx0XHRmaWxlVG9SZW1vdmUuYXVkaW8uZWxlbWVudCA9IG51bGw7XHJcblx0XHRmaWxlVG9SZW1vdmUuYnVmZmVyID0gbnVsbDtcclxuXHJcblx0XHRmaWxlcy5mb3JFYWNoKChmaWxlLCBpbmRleCkgPT4ge1xyXG5cdFx0XHRmaWxlLmluZGV4ID0gaW5kZXg7XHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLnNldFN0YXRlKHtmaWxlczogZmlsZXN9KTtcclxuXHR9XHJcblx0dG9nZ2xlUmVwZWF0ID0gKCkgPT4ge1xyXG5cdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0QWxsKSB7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xyXG5cdFx0XHRcdHJlcGVhdEFsbDogZmFsc2UsXHJcblx0XHRcdFx0cmVwZWF0Q3VycmVudDogdHJ1ZSxcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcclxuXHRcdFx0XHRyZXBlYXRBbGw6IGZhbHNlLFxyXG5cdFx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAoIXRoaXMuc3RhdGUucmVwZWF0QWxsICYmICF0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0cmVwZWF0QWxsOiB0cnVlLFxyXG5cdFx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdH1cclxuXHRzZXRWb2x1bWUgPSAodm9sdW1lKSA9PiB7XHJcblx0XHR0aGlzLnJlZnMudm9sdW1lQmFyLnZhbHVlID0gdm9sdW1lO1xyXG5cdFx0dGhpcy5zdGF0ZS5maWxlcy5mb3JFYWNoKGZpbGUgPT4ge1xyXG5cdFx0XHRpZiAoZmlsZS5hdWRpby5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0ZmlsZS5hdWRpby5lbGVtZW50LnZvbHVtZSA9IHZvbHVtZTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHR0aGlzLnNldFN0YXRlKHt2b2x1bWU6IHZvbHVtZX0pO1xyXG5cdH1cclxuXHR0b2dnbGVNdXRlID0gKCkgPT4ge1xyXG5cdFx0aWYgKHRoaXMuc3RhdGUudm9sdW1lID4gMCkge1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcclxuXHRcdFx0XHRtdXRlZFZvbHVtZTogdGhpcy5zdGF0ZS52b2x1bWUsXHJcblx0XHRcdH0pO1xyXG5cdFx0XHR0aGlzLnNldFZvbHVtZSgwKTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aGlzLnNldFZvbHVtZSh0aGlzLnN0YXRlLm11dGVkVm9sdW1lKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmVuZGVyID0gKCkgPT4ge1xyXG5cclxuXHRcdGlmICghdGhpcy5zdGF0ZS5maWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0cmV0dXJuIChcclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpbGVkcm9wLXByb21wdFwiPlxyXG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1maWxlLW11c2ljXCI+PC9pPlxyXG5cdFx0XHRcdFx0RHJhZyAmIERyb3Agc29tZSBtdXNpYyBoZXJlIVxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBwYXJlbnRQbGF5bGlzdCA9IHRoaXM7XHJcblxyXG5cdFx0bGV0IHRyYWNrcyA9IHRoaXMuc3RhdGUuZmlsZXMubWFwKChmaWxlLCBpbmRleCkgPT4ge1xyXG5cdFx0XHRyZXR1cm4gPGxpIFxyXG5cdFx0XHRcdGNsYXNzTmFtZT17ZmlsZS5hdWRpby5wbGF5aW5nID8gXCJwbGF5aW5nXCIgOiBcIlwifVxyXG5cdFx0XHRcdGtleT17XCJmaWxlLWtleS1cIitpbmRleH1cclxuXHRcdFx0XHRkYXRhLWlkPXtpbmRleH1cclxuXHRcdFx0XHRkcmFnZ2FibGU9XCJ0cnVlXCJcclxuXHRcdFx0XHRvbkRyYWdFbmQ9e3BhcmVudFBsYXlsaXN0LmRyYWdFbmR9XHJcblx0XHRcdFx0b25EcmFnU3RhcnQ9e3BhcmVudFBsYXlsaXN0LmRyYWdTdGFydH1cclxuXHRcdFx0PlxyXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidHJhY2std3JhcFwiIG9uQ2xpY2s9e2Z1bmN0aW9uKCkge3BhcmVudFBsYXlsaXN0LnBsYXlGaWxlKGZpbGUpO319PlxyXG5cdFx0XHRcdFx0PHNwYW4+e2ZpbGUuZGF0YS5uYW1lfTwvc3Bhbj5cclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0XHQ8aSBhbHQ9XCJyZW1vdmUgZnJvbSBwbGF5bGlzdFwiIHRpdGxlPVwicmVtb3ZlIGZyb20gcGxheWxpc3RcIiBvbkNsaWNrPXtmdW5jdGlvbigpe3BhcmVudFBsYXlsaXN0LnJlbW92ZUZpbGUoZmlsZSk7fX0gY2xhc3NOYW1lPVwibWRpIG1kaS1wbGF5bGlzdC1yZW1vdmUgcmVtb3ZlLWZyb20tcGxheWxpc3QtYnV0dG9uXCI+PC9pPlxyXG5cdFx0XHQ8L2xpPlxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGFjdGl2ZVRyYWNrcyA9IHRoaXMuc3RhdGUuZmlsZXMubWFwKGZpbGUgPT4ge1xyXG5cdFx0XHRpZiAoZmlsZS5hdWRpby5wbGF5aW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZpbGU7XHJcblx0XHRcdH1cclxuXHRcdH0pLmZpbHRlcihsaXN0SXRlbSA9PiAobGlzdEl0ZW0pKTsgLy9pZiAhZmlsZS5hdWRpby5wbGF5aW5nLCBsaXN0SXRlbSB3aWxsIGJlIHVuZGVmaW5lZCBhbmQgbXVzdCBiZSBmaWx0ZXJlZCBvdXQuXHJcblxyXG5cdFx0bGV0IGN1cnJlbnRUcmFjayA9IGFjdGl2ZVRyYWNrcy5sZW5ndGggPyBhY3RpdmVUcmFja3NbMF0gOiBudWxsO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHBhdXNlQWxsKCkge1xyXG5cdFx0XHRpZiAoYWN0aXZlVHJhY2tzLmxlbmd0aCkge1xyXG5cdFx0XHRcdGFjdGl2ZVRyYWNrcy5mb3JFYWNoKGZpbGUgPT4gZmlsZS5hdWRpby5wYXVzZSgpKTtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IGFjdGl2ZVRyYWNrc1swXX0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHBsYXlwYXVzZUJ1dHRvbiA9IG51bGw7XHJcblx0XHRpZiAoIWFjdGl2ZVRyYWNrcy5sZW5ndGggJiYgdGhpcy5zdGF0ZS5wYXVzZWRUcmFjayA9PT0gbnVsbCkge1xyXG5cdFx0XHRwbGF5cGF1c2VCdXR0b24gPSA8YnV0dG9uIG9uQ2xpY2s9e2Z1bmN0aW9uKCkge3BhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2soKTt9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXBsYXktY2lyY2xlIHBsYXlwYXVzZVwiPjwvaT48L2J1dHRvbj5cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRwbGF5cGF1c2VCdXR0b24gPSAodGhpcy5zdGF0ZS5wYXVzZWRUcmFjayAhPT0gbnVsbCkgPyA8YnV0dG9uIG9uQ2xpY2s9e2Z1bmN0aW9uKCkge3BhcmVudFBsYXlsaXN0LnBsYXlGaWxlKHBhcmVudFBsYXlsaXN0LnN0YXRlLnBhdXNlZFRyYWNrKTt9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXBsYXktY2lyY2xlIHBsYXlwYXVzZVwiPjwvaT48L2J1dHRvbj4gOiA8YnV0dG9uIG9uQ2xpY2s9e3BhdXNlQWxsfT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXBhdXNlLWNpcmNsZSBwbGF5cGF1c2VcIj48L2k+PC9idXR0b24+O1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCByZXBlYXRCdXR0b24gPSA8YnV0dG9uIGFsdD1cInJlcGVhdCBpcyBvZmZcIiB0aXRsZT1cInJlcGVhdCBpcyBvZmZcIiBjbGFzc05hbWU9XCJyZXBlYXQtYnV0dG9uXCIgb25DbGljaz17cGFyZW50UGxheWxpc3QudG9nZ2xlUmVwZWF0fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXJlcGVhdCBpbmFjdGl2ZVwiPjwvaT48L2J1dHRvbj47XHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRBbGwpIHtcclxuXHRcdFx0cmVwZWF0QnV0dG9uID0gPGJ1dHRvbiBhbHQ9XCJyZXBlYXQgaXMgb25cIiB0aXRsZT1cInJlcGVhdCBpcyBvblwiIGNsYXNzTmFtZT1cInJlcGVhdC1idXR0b25cIiBvbkNsaWNrPXtwYXJlbnRQbGF5bGlzdC50b2dnbGVSZXBlYXR9PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcmVwZWF0XCI+PC9pPjwvYnV0dG9uPjtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHRyZXBlYXRCdXR0b24gPSA8YnV0dG9uIGFsdD1cInJlcGVhdGluZyBjdXJyZW50XCIgdGl0bGU9XCJyZXBlYXRpbmcgY3VycmVudFwiIGNsYXNzTmFtZT1cInJlcGVhdC1idXR0b25cIiBvbkNsaWNrPXtwYXJlbnRQbGF5bGlzdC50b2dnbGVSZXBlYXR9PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcmVwZWF0LW9uY2VcIj48L2k+PC9idXR0b24+O1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFNwZWFrZXJJY29uKCkge1xyXG5cdFx0XHRpZiAocGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lID4gMC41KSB7XHJcblx0XHRcdFx0cmV0dXJuIFwibWRpLXZvbHVtZS1oaWdoXCI7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHBhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZSA+IDAuMjUpIHtcclxuXHRcdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLW1lZGl1bVwiO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChwYXJlbnRQbGF5bGlzdC5zdGF0ZS52b2x1bWUgPiAwKSB7XHJcblx0XHRcdFx0cmV0dXJuIFwibWRpLXZvbHVtZS1sb3dcIjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLW9mZlwiO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybihcclxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ3ZWItcGxheWxpc3RcIj5cclxuXHJcblx0XHRcdFx0PHVsIGNsYXNzTmFtZT1cInRyYWNrbGlzdFwiIHJlZj1cInRyYWNrbGlzdFwiPlxyXG5cdFx0XHRcdFx0e3RyYWNrc31cclxuXHRcdFx0XHQ8L3VsPlxyXG5cclxuXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWVrYmFyLXdyYXBcIj5cclxuXHRcdFx0XHRcdDxwcm9ncmVzcyBjbGFzc05hbWU9XCJzZWVrYmFyXCIgcmVmPVwic2Vla0JhclwiIHZhbHVlPVwiMFwiIG1heD1cIjFcIj48L3Byb2dyZXNzPiBcclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9sc1wiPlxyXG5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidGltZXBvcy13cmFwXCI+XHJcblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInRpbWVwb3NcIiByZWY9XCJ0aW1lcG9zXCI+MDowMDwvc3Bhbj5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cclxuXHJcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbnRyb2xzLXBsYXliYWNrXCI+XHJcblx0XHRcdFx0XHRcdHtyZXBlYXRCdXR0b259XHJcblx0XHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5UHJldlRyYWNrKGN1cnJlbnRUcmFjayl9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXNraXAtcHJldmlvdXNcIj48L2k+PC9idXR0b24+XHJcblx0XHRcdFx0XHRcdHtwbGF5cGF1c2VCdXR0b259XHJcblx0XHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5TmV4dFRyYWNrKGN1cnJlbnRUcmFjayl9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXNraXAtbmV4dFwiPjwvaT48L2J1dHRvbj5cclxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBhbHQ9XCJ0b2dnbGUgc2h1ZmZsZVwiIHRpdGxlPVwidG9nZ2xlIHNodWZmbGVcIiBjbGFzc05hbWU9XCJzaHVmZmxlLWJ1dHRvblwiIG9uQ2xpY2s9e2Z1bmN0aW9uKCkge3BhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtzaHVmZmxlOiAhcGFyZW50UGxheWxpc3Quc3RhdGUuc2h1ZmZsZX0pO319PiA8aSBjbGFzc05hbWU9e1wibWRpIG1kaS1zaHVmZmxlXCIrKChwYXJlbnRQbGF5bGlzdC5zdGF0ZS5zaHVmZmxlKSA/IFwiXCIgOiBcIiBpbmFjdGl2ZVwiKX0+PC9pPiA8L2J1dHRvbj5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29udHJvbHMtdm9sdW1lXCI+XHJcblx0XHRcdFx0XHRcdDxwcm9ncmVzcyBjbGFzc05hbWU9XCJ2b2x1bWViYXJcIiBvbkNsaWNrPXtmdW5jdGlvbihldmVudCkge3BhcmVudFBsYXlsaXN0LnNldFZvbHVtZSgoZXZlbnQucGFnZVggLSBldmVudC50YXJnZXQub2Zmc2V0TGVmdCkgLyBldmVudC50YXJnZXQub2Zmc2V0V2lkdGgpO319IHJlZj1cInZvbHVtZUJhclwiIHZhbHVlPXtwYXJlbnRQbGF5bGlzdC5zdGF0ZS52b2x1bWV9IG1heD1cIjFcIj48L3Byb2dyZXNzPlxyXG5cdFx0XHRcdFx0XHQ8YnV0dG9uIGFsdD1cInRvZ2dsZSBtdXRlXCIgdGl0bGU9XCJ0b2dnbGUgbXV0ZVwiIGNsYXNzTmFtZT1cInRvZ2dsZS1tdXRlLWJ1dHRvblwiIG9uQ2xpY2s9e3BhcmVudFBsYXlsaXN0LnRvZ2dsZU11dGV9PjxpIGNsYXNzTmFtZT17XCJtZGkgXCIrZ2V0U3BlYWtlckljb24oKX0+PC9pPjwvYnV0dG9uPlxyXG5cdFx0XHRcdFx0PC9kaXY+XHRcdFxyXG5cclxuXHJcblx0XHRcdFx0PC9kaXY+XHJcblxyXG5cdFx0XHQ8L2Rpdj5cclxuXHRcdCk7XHJcblxyXG5cdH1cclxufVxyXG5SZWFjdERPTS5yZW5kZXIoPFdlYlBsYXlsaXN0IGRyb3B6b25lPXt3aW5kb3d9IC8+LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIndlYi1wbGF5bGlzdC13cmFwXCIpKTsiXX0=
