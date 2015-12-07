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
			_this.dragged.style.display = "block";
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

			var fileElements = _this.state.files.map(function (file, index) {
				function onclick() {
					parentPlaylist.playFile(file);
				}

				return React.createElement(
					"li",
					{
						className: file.audio.playing ? "playing" : "",
						onClick: onclick,
						key: "file-key-" + index,
						"data-id": index,
						draggable: "true",
						onDragEnd: parentPlaylist.dragEnd,
						onDragStart: parentPlaylist.dragStart
					},
					file.data.name
				);
			});

			var activeTracks = _this.state.files.map(function (file) {
				if (file.audio.playing) {
					return file;
				}
			}).filter(function (listItem) {
				return listItem;
			});

			var currentTrack = activeTracks.length ? activeTracks[0] : null;

			function pauseAll() {
				if (activeTracks.length) {
					parentPlaylist.setState({ pausedTrack: activeTracks[0] });
					activeTracks.forEach(function (file) {
						file.audio.pause();
					});
					parentPlaylist.forceUpdate();
				}
			}
			function playPaused() {
				parentPlaylist.playFile(parentPlaylist.state.pausedTrack);
			}

			var playpause = null;
			if (!activeTracks.length && _this.state.pausedTrack === null) {
				playpause = React.createElement(
					"button",
					{ onClick: function onClick() {
							parentPlaylist.playNextTrack();
						} },
					React.createElement("i", { className: "mdi mdi-play" })
				);
			} else {
				playpause = _this.state.pausedTrack !== null ? React.createElement(
					"button",
					{ onClick: playPaused },
					React.createElement("i", { className: "mdi mdi-play" })
				) : React.createElement(
					"button",
					{ onClick: pauseAll },
					React.createElement("i", { className: "mdi mdi-pause" })
				);
			}

			var toggleRepeat = (function () {
				if (this.state.repeatAll) {
					this.setState({
						repeatAll: false,
						repeatCurrent: true
					});
				} else if (this.state.repeatCurrent) {
					this.setState({
						repeatAll: false,
						repeatCurrent: false
					});
				} else if (!this.state.repeatAll && !this.state.repeatCurrent) {
					this.setState({
						repeatAll: true,
						repeatCurrent: false
					});
				}
			}).bind(_this);

			//let repeatButtonText = "No repeat";
			var repeatButtonText = React.createElement("i", { className: "mdi mdi-repeat-off" });
			if (_this.state.repeatAll) {
				//repeatButtonText = "Repeating all";
				repeatButtonText = React.createElement("i", { className: "mdi mdi-repeat" });
			} else if (_this.state.repeatCurrent) {
				//repeatButtonText = "Repeating current";
				repeatButtonText = React.createElement("i", { className: "mdi mdi-repeat-once" });
			}

			function setVolume(volume) {
				parentPlaylist.refs.volumeBar.value = volume;
				parentPlaylist.state.files.forEach(function (file) {
					if (file.audio.element !== null) {
						file.audio.element.volume = volume;
					}
				});
				parentPlaylist.setState({ volume: volume });
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
			function toggleMute() {
				if (parentPlaylist.state.volume > 0) {
					parentPlaylist.setState({
						mutedVolume: parentPlaylist.state.volume
					});
					setVolume(0);
				} else {
					setVolume(parentPlaylist.state.mutedVolume);
				}
			}

			return React.createElement(
				"div",
				{ className: "web-playlist" },
				React.createElement(
					"ul",
					{ className: "tracklist", ref: "tracklist" },
					fileElements
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
						playpause,
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
						React.createElement("span", { className: "timepos", ref: "timepos" }),
						React.createElement(
							"button",
							{ className: "repeat-button", onClick: toggleRepeat },
							repeatButtonText
						),
						React.createElement(
							"div",
							{ className: "controls-volume" },
							React.createElement("progress", { className: "volumebar", onClick: function onClick(event) {
									setVolume((event.pageX - event.target.offsetLeft) / event.target.offsetWidth);
								}, ref: "volumeBar", value: parentPlaylist.state.volume, max: "1" }),
							React.createElement(
								"button",
								{ className: "toggle-mute-button", onClick: toggleMute },
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
			mutedVolume: 0 };
		return _this;
	}

	_createClass(WebPlaylist, [{
		key: "cancelEvent",
		//sound-level to return to after unmuting. The volume was at this level when the player was muted.
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsb0NBQW9DLENBQUM7O0FBRS9ELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQWtCaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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LEVBQUUsTUFBTSxBQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBXT1JLRVJfRklMRVJFQURFUiA9IFwic3RhdGljL2pzL0ZpbGVSZWFkZXJTeW5jX3dvcmtlci5qc1wiO1xyXG5cclxuZnVuY3Rpb24gZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSB7XHJcblx0aWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcykge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIudHlwZXNbaV0gPT09IFwiRmlsZXNcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblx0fVxyXG4gICAgcmV0dXJuIGZhbHNlO1x0XHRcdFxyXG59XHJcblxyXG5sZXQgcGxhY2Vob2xkZXJMaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxucGxhY2Vob2xkZXJMaS5jbGFzc05hbWUgPSBcInBsYWNlaG9sZGVyXCI7XHJcblxyXG5jbGFzcyBXZWJQbGF5bGlzdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cclxuXHRcdHRoaXMuc3RhdGUgPSB7XHJcblx0XHRcdGZpbGVzOiBbXSxcclxuXHRcdFx0cmVwZWF0QWxsOiB0cnVlLFxyXG5cdFx0XHRyZXBlYXRDdXJyZW50OiBmYWxzZSxcclxuXHRcdFx0cGF1c2VkVHJhY2s6IG51bGwsXHJcblx0XHRcdHZvbHVtZTogMSxcclxuXHRcdFx0bXV0ZWRWb2x1bWU6IDAsIC8vc291bmQtbGV2ZWwgdG8gcmV0dXJuIHRvIGFmdGVyIHVubXV0aW5nLiBUaGUgdm9sdW1lIHdhcyBhdCB0aGlzIGxldmVsIHdoZW4gdGhlIHBsYXllciB3YXMgbXV0ZWQuXHJcblx0XHR9XHJcblx0fVxyXG5cdGNhbmNlbEV2ZW50KGV2ZW50KSB7XHJcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0fVxyXG5cdGJ1YmJsZUV2ZW50ID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGV2ZW50O1xyXG5cdFx0fVxyXG5cdH1cclxuXHRkcmFnU3RhcnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwibW92ZVwiO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0L2h0bWxcIiwgZXZlbnQuY3VycmVudFRhcmdldCk7XHJcblx0fVxyXG5cdGRyYWdFbmQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXJMaSk7XHJcblxyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGxldCBmcm9tID0gTnVtYmVyKHRoaXMuZHJhZ2dlZC5kYXRhc2V0LmlkKTtcclxuXHRcdGxldCB0byA9IE51bWJlcih0aGlzLm92ZXIuZGF0YXNldC5pZCk7XHJcblx0XHRpZiAoZnJvbSA8IHRvKSB0by0tO1xyXG5cdFx0ZmlsZXMuc3BsaWNlKHRvLCAwLCBmaWxlcy5zcGxpY2UoZnJvbSwgMSlbMF0pO1xyXG5cclxuXHRcdGZpbGVzLmZvckVhY2goKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZpbGUuaW5kZXggPSBpbmRleDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiBmaWxlc30pO1xyXG5cdH1cclxuXHRkcmFnT3ZlciA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpOztcclxuXHRcdH1cclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdFx0aWYgKGV2ZW50LnRhcmdldC5jbGFzc05hbWUgPT0gXCJwbGFjZWhvbGRlclwiKSByZXR1cm47XHJcblx0XHR0aGlzLm92ZXIgPSBldmVudC50YXJnZXQ7XHJcblxyXG5cdFx0bGV0IHJlbFkgPSBldmVudC5jbGllbnRZIC0gdGhpcy5vdmVyLm9mZnNldFRvcDtcclxuXHRcdGxldCBoZWlnaHQgPSB0aGlzLm92ZXIub2Zmc2V0SGVpZ2h0IC8gMjtcclxuXHRcdGxldCBwYXJlbnQgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcblx0XHRpZiAocGFyZW50ID09PSB0aGlzLnJlZnMudHJhY2tsaXN0KSB7XHJcblx0XHRcdGlmIChyZWxZID4gaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJhZnRlclwiO1xyXG5cdFx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0Lm5leHRFbGVtZW50U2libGluZyk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAocmVsWSA8IGhlaWdodCkge1xyXG5cdFx0XHRcdHRoaXMubm9kZVBsYWNlbWVudCA9IFwiYmVmb3JlXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cdGRyYWdFbnRlciA9IChldmVudCkgPT4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0ZHJhZ0xlYXZlID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcm9wID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoIWV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1x0XHRcdFxyXG5cdFx0fVxyXG5cdFx0ZXZlbnQgPSB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gXCJjb3B5XCI7XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRmb3IgKGxldCBpID0gMCwgZmlsZURhdGE7IGZpbGVEYXRhID0gZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGZpbGVEYXRhLnR5cGUuc3RhcnRzV2l0aChcImF1ZGlvL1wiKSkge1xyXG5cdFx0XHRcdGxldCBfZmlsZSA9IHtcclxuXHRcdFx0XHRcdGRhdGE6IGZpbGVEYXRhLFxyXG5cdFx0XHRcdFx0YXVkaW86IG5ldyBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50ID0gbnVsbDtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdGxldCBzZWxmID0gdGhpcztcclxuXHRcdFx0XHRcdFx0ZnVuY3Rpb24gc2Vjb25kc1RvUGFkZGVkTWludXRlcyhudW1iZXIpIHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgbWludXRlcyA9IE1hdGguZmxvb3IobnVtYmVyIC8gNjApO1xyXG5cdFx0XHRcdFx0XHRcdGxldCBzZWNvbmRzID0gKFwiMFwiICsgTWF0aC5yb3VuZChudW1iZXIgLSBtaW51dGVzKjYwKSkuc2xpY2UoLTIpO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBgJHttaW51dGVzfToke3NlY29uZHN9YDtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRsZXQgb25UaW1lVXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy50aW1lcG9zLnRleHRDb250ZW50ID0gc2Vjb25kc1RvUGFkZGVkTWludXRlcyh0aGlzLmVsZW1lbnQuY3VycmVudFRpbWUpO1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla0Jhci52YWx1ZSA9IHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSAvIHRoaXMuZWxlbWVudC5kdXJhdGlvbjtcclxuXHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRsZXQgb25TZWVrQmFyQ2xpY2sgPSBmdW5jdGlvbihldmVudCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBwZXJjZW50YWdlID0gZXZlbnQub2Zmc2V0WCAvIHRoaXMub2Zmc2V0V2lkdGg7XHJcblx0XHRcdFx0XHRcdFx0c2VsZi5lbGVtZW50LmN1cnJlbnRUaW1lID0gcGVyY2VudGFnZSAqIHNlbGYuZWxlbWVudC5kdXJhdGlvbjtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIudmFsdWUgPSBwZXJjZW50YWdlIC8gMTAwO1xyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGF1c2UoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSA9IDA7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMudGltZXBvcy50ZXh0Q29udGVudCA9IFwiXCI7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsIG9uVGltZVVwZGF0ZSk7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uU2Vla0JhckNsaWNrKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMucGxheSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wbGF5KCk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3BhdXNlZFRyYWNrOiBudWxsfSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsIG9uVGltZVVwZGF0ZSk7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uU2Vla0JhckNsaWNrKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGF1c2UoKTtcclxuXHRcdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRidWZmZXI6IG51bGwsXHJcblx0XHRcdFx0XHRpbmRleDogcGFyZW50UGxheWxpc3Quc3RhdGUuZmlsZXMubGVuZ3RoLFxyXG5cdFx0XHRcdFx0Y3JlYXRlQXVkaW86IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYnVmZmVyICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IGJsb2IgPSBuZXcgQmxvYihbdGhpcy5idWZmZXJdLCB7dHlwZTogdGhpcy5kYXRhLnR5cGV9KTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQgPSBuZXcgQXVkaW8oW1VSTC5jcmVhdGVPYmplY3RVUkwoYmxvYildKTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQudm9sdW1lID0gcGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2sodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnNlZWtCYXIudmFsdWUgPSAwO1xyXG5cdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmIChwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRsZXQgb25DYW5QbGF5ID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LnR5cGUsIG9uQ2FuUGxheSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNhbnBsYXlcIiwgb25DYW5QbGF5KTtcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdHJlYWQ6IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHdvcmtlciA9IG5ldyBXb3JrZXIoV09SS0VSX0ZJTEVSRUFERVIpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYnVmZmVyID0gbWVzc2FnZS5kYXRhO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY3JlYXRlQXVkaW8ocGxheVdoZW5SZWFkeSk7XHJcblx0XHRcdFx0XHRcdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5wb3N0TWVzc2FnZSh0aGlzLmRhdGEpO1xyXG5cdFx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB0aGlzLnN0YXRlLmZpbGVzLmNvbmNhdChbX2ZpbGVdKX0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudERpZE1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlOZXh0VHJhY2sgPSAoY3VycmVudCkgPT4ge1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGlmICghY3VycmVudCkge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShjdXJyZW50KTtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgbmV4dCA9IGZpbGVzW2N1cnJlbnQuaW5kZXgrMV07XHJcblx0XHRpZiAobmV4dCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShuZXh0KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRBbGwgJiYgZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlQcmV2VHJhY2sgPSAoY3VycmVudCkgPT4ge1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGlmICghY3VycmVudCkge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRsZXQgcHJldiA9IGN1cnJlbnQuaW5kZXggPT09IDAgPyBmaWxlc1tmaWxlcy5sZW5ndGgtMV0gOiBmaWxlc1tjdXJyZW50LmluZGV4LTFdO1xyXG5cdFx0aWYgKHByZXYpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUocHJldik7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aWYgKGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRwbGF5RmlsZSA9IChmaWxlVG9QbGF5KSA9PiB7XHJcblx0XHRpZiAoIWZpbGVUb1BsYXkpIHJldHVybjtcclxuXHRcdGlmICh0aGlzLnN0YXRlLnBhdXNlZFRyYWNrID09PSBmaWxlVG9QbGF5KSB7XHJcblx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtwYXVzZWRUcmFjazogbnVsbH0pO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGZvciAobGV0IGZpbGUgb2YgdGhpcy5zdGF0ZS5maWxlcykge1xyXG5cdFx0XHRcdGZpbGUuYXVkaW8uc3RvcCgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChmaWxlVG9QbGF5LmF1ZGlvLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRmaWxlVG9QbGF5LmF1ZGlvLnBsYXkoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRmaWxlVG9QbGF5LnJlYWQodHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHRoaXMuZm9yY2VVcGRhdGUoKTtcclxuXHR9XHJcblx0cmVuZGVyID0gKCkgPT4ge1xyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLmZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRyZXR1cm4gKFxyXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZmlsZWRyb3AtcHJvbXB0XCI+XHJcblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJtZGkgbWRpLWZpbGUtbXVzaWNcIj48L2k+XHJcblx0XHRcdFx0XHREcmFnICYgRHJvcCBzb21lIG11c2ljIGhlcmUhXHJcblx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRsZXQgZmlsZUVsZW1lbnRzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZ1bmN0aW9uIG9uY2xpY2soKSB7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUoZmlsZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiA8bGkgXHJcblx0XHRcdFx0Y2xhc3NOYW1lPXtmaWxlLmF1ZGlvLnBsYXlpbmcgPyBcInBsYXlpbmdcIiA6IFwiXCJ9XHJcblx0XHRcdFx0b25DbGljaz17b25jbGlja31cclxuXHRcdFx0XHRrZXk9e1wiZmlsZS1rZXktXCIraW5kZXh9XHJcblx0XHRcdFx0ZGF0YS1pZD17aW5kZXh9XHJcblx0XHRcdFx0ZHJhZ2dhYmxlPVwidHJ1ZVwiXHJcblx0XHRcdFx0b25EcmFnRW5kPXtwYXJlbnRQbGF5bGlzdC5kcmFnRW5kfVxyXG5cdFx0XHRcdG9uRHJhZ1N0YXJ0PXtwYXJlbnRQbGF5bGlzdC5kcmFnU3RhcnR9XHJcblx0XHRcdD5cclxuXHRcdFx0XHR7ZmlsZS5kYXRhLm5hbWV9XHJcblx0XHRcdDwvbGk+XHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgYWN0aXZlVHJhY2tzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoZmlsZSA9PiB7XHJcblx0XHRcdGlmIChmaWxlLmF1ZGlvLnBsYXlpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmlsZTtcclxuXHRcdFx0fVxyXG5cdFx0fSkuZmlsdGVyKGxpc3RJdGVtID0+IChsaXN0SXRlbSkpO1xyXG5cclxuXHRcdGxldCBjdXJyZW50VHJhY2sgPSBhY3RpdmVUcmFja3MubGVuZ3RoID8gYWN0aXZlVHJhY2tzWzBdIDogbnVsbDtcclxuXHJcblx0XHRmdW5jdGlvbiBwYXVzZUFsbCgpIHtcclxuXHRcdFx0aWYgKGFjdGl2ZVRyYWNrcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IGFjdGl2ZVRyYWNrc1swXX0pO1xyXG5cdFx0XHRcdGFjdGl2ZVRyYWNrcy5mb3JFYWNoKGZpbGUgPT4ge1xyXG5cdFx0XHRcdFx0ZmlsZS5hdWRpby5wYXVzZSgpXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3QuZm9yY2VVcGRhdGUoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZnVuY3Rpb24gcGxheVBhdXNlZCgpIHtcclxuXHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUocGFyZW50UGxheWxpc3Quc3RhdGUucGF1c2VkVHJhY2spO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBwbGF5cGF1c2UgPSBudWxsO1xyXG5cdFx0aWYgKCFhY3RpdmVUcmFja3MubGVuZ3RoICYmIHRoaXMuc3RhdGUucGF1c2VkVHJhY2sgPT09IG51bGwpIHtcclxuXHRcdFx0cGxheXBhdXNlID0gPGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpIHtwYXJlbnRQbGF5bGlzdC5wbGF5TmV4dFRyYWNrKCk7fX0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1wbGF5XCI+PC9pPjwvYnV0dG9uPlxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHBsYXlwYXVzZSA9ICh0aGlzLnN0YXRlLnBhdXNlZFRyYWNrICE9PSBudWxsKSA/IDxidXR0b24gb25DbGljaz17cGxheVBhdXNlZH0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1wbGF5XCI+PC9pPjwvYnV0dG9uPiA6IDxidXR0b24gb25DbGljaz17cGF1c2VBbGx9PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktcGF1c2VcIj48L2k+PC9idXR0b24+O1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCB0b2dnbGVSZXBlYXQgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0QWxsKSB7XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0XHRyZXBlYXRBbGw6IGZhbHNlLFxyXG5cdFx0XHRcdFx0cmVwZWF0Q3VycmVudDogdHJ1ZSxcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe1xyXG5cdFx0XHRcdFx0cmVwZWF0QWxsOiBmYWxzZSxcclxuXHRcdFx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoIXRoaXMuc3RhdGUucmVwZWF0QWxsICYmICF0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtcclxuXHRcdFx0XHRcdHJlcGVhdEFsbDogdHJ1ZSxcclxuXHRcdFx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cclxuXHRcdH0uYmluZCh0aGlzKTtcclxuXHJcblx0XHQvL2xldCByZXBlYXRCdXR0b25UZXh0ID0gXCJObyByZXBlYXRcIjtcclxuXHRcdGxldCByZXBlYXRCdXR0b25UZXh0ID0gPGkgY2xhc3NOYW1lPVwibWRpIG1kaS1yZXBlYXQtb2ZmXCI+PC9pPlxyXG5cdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0QWxsKSB7XHJcblx0XHRcdC8vcmVwZWF0QnV0dG9uVGV4dCA9IFwiUmVwZWF0aW5nIGFsbFwiO1xyXG5cdFx0XHRyZXBlYXRCdXR0b25UZXh0ID0gPGkgY2xhc3NOYW1lPVwibWRpIG1kaS1yZXBlYXRcIj48L2k+XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0Ly9yZXBlYXRCdXR0b25UZXh0ID0gXCJSZXBlYXRpbmcgY3VycmVudFwiO1xyXG5cdFx0XHRyZXBlYXRCdXR0b25UZXh0ID0gPGkgY2xhc3NOYW1lPVwibWRpIG1kaS1yZXBlYXQtb25jZVwiPjwvaT5cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0ZnVuY3Rpb24gc2V0Vm9sdW1lKHZvbHVtZSkge1xyXG5cdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnZvbHVtZUJhci52YWx1ZSA9IHZvbHVtZTtcclxuXHRcdFx0cGFyZW50UGxheWxpc3Quc3RhdGUuZmlsZXMuZm9yRWFjaChmaWxlID0+IHtcclxuXHRcdFx0XHRpZiAoZmlsZS5hdWRpby5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRmaWxlLmF1ZGlvLmVsZW1lbnQudm9sdW1lID0gdm9sdW1lO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHt2b2x1bWU6IHZvbHVtZX0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFNwZWFrZXJJY29uKCkge1xyXG5cdFx0XHRpZiAocGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lID4gMC41KSB7XHJcblx0XHRcdFx0cmV0dXJuIFwibWRpLXZvbHVtZS1oaWdoXCI7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHBhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZSA+IDAuMjUpIHtcclxuXHRcdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLW1lZGl1bVwiO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChwYXJlbnRQbGF5bGlzdC5zdGF0ZS52b2x1bWUgPiAwKSB7XHJcblx0XHRcdFx0cmV0dXJuIFwibWRpLXZvbHVtZS1sb3dcIjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gXCJtZGktdm9sdW1lLW9mZlwiO1xyXG5cdFx0fVxyXG5cdFx0ZnVuY3Rpb24gdG9nZ2xlTXV0ZSgpIHtcclxuXHRcdFx0aWYgKHBhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZSA+IDApIHtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0XHRtdXRlZFZvbHVtZTogcGFyZW50UGxheWxpc3Quc3RhdGUudm9sdW1lLFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHNldFZvbHVtZSgwKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRzZXRWb2x1bWUocGFyZW50UGxheWxpc3Quc3RhdGUubXV0ZWRWb2x1bWUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuKFxyXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIndlYi1wbGF5bGlzdFwiPlxyXG5cclxuXHRcdFx0XHQ8dWwgY2xhc3NOYW1lPVwidHJhY2tsaXN0XCIgcmVmPVwidHJhY2tsaXN0XCI+XHJcblx0XHRcdFx0XHR7ZmlsZUVsZW1lbnRzfVxyXG5cdFx0XHRcdDwvdWw+XHJcblxyXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29udHJvbHNcIj5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29udHJvbHMtcGxheWJhY2tcIj5cclxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpe3BhcmVudFBsYXlsaXN0LnBsYXlQcmV2VHJhY2soY3VycmVudFRyYWNrKX19PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktc2tpcC1wcmV2aW91c1wiPjwvaT48L2J1dHRvbj5cclxuXHRcdFx0XHRcdFx0e3BsYXlwYXVzZX1cclxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpe3BhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2soY3VycmVudFRyYWNrKX19PjxpIGNsYXNzTmFtZT1cIm1kaSBtZGktc2tpcC1uZXh0XCI+PC9pPjwvYnV0dG9uPlxyXG5cdFx0XHRcdFx0PC9kaXY+XHJcblxyXG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9scy1zZWNvbmRhcnlcIj5cclxuXHRcdFx0XHRcdFx0PHByb2dyZXNzIGNsYXNzTmFtZT1cInNlZWtiYXJcIiByZWY9XCJzZWVrQmFyXCIgdmFsdWU9XCIwXCIgbWF4PVwiMVwiPjwvcHJvZ3Jlc3M+IFxyXG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJ0aW1lcG9zXCIgcmVmPVwidGltZXBvc1wiPjwvc3Bhbj5cclxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBjbGFzc05hbWU9XCJyZXBlYXQtYnV0dG9uXCIgb25DbGljaz17dG9nZ2xlUmVwZWF0fT57cmVwZWF0QnV0dG9uVGV4dH08L2J1dHRvbj5cclxuXHJcblx0XHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29udHJvbHMtdm9sdW1lXCI+XHJcblx0XHRcdFx0XHRcdFx0PHByb2dyZXNzIGNsYXNzTmFtZT1cInZvbHVtZWJhclwiIG9uQ2xpY2s9e2Z1bmN0aW9uKGV2ZW50KSB7c2V0Vm9sdW1lKChldmVudC5wYWdlWCAtIGV2ZW50LnRhcmdldC5vZmZzZXRMZWZ0KSAvIGV2ZW50LnRhcmdldC5vZmZzZXRXaWR0aCk7fX0gcmVmPVwidm9sdW1lQmFyXCIgdmFsdWU9e3BhcmVudFBsYXlsaXN0LnN0YXRlLnZvbHVtZX0gbWF4PVwiMVwiPjwvcHJvZ3Jlc3M+XHJcblx0XHRcdFx0XHRcdFx0PGJ1dHRvbiBjbGFzc05hbWU9XCJ0b2dnbGUtbXV0ZS1idXR0b25cIiBvbkNsaWNrPXt0b2dnbGVNdXRlfT48aSBjbGFzc05hbWU9e1wibWRpIFwiK2dldFNwZWFrZXJJY29uKCl9PjwvaT48L2J1dHRvbj5cclxuXHRcdFx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHJcblx0XHRcdDwvZGl2PlxyXG5cdFx0KTtcclxuXHJcblx0fVxyXG59XHJcblJlYWN0RE9NLnJlbmRlcig8V2ViUGxheWxpc3QgZHJvcHpvbmU9e3dpbmRvd30gLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2ViLXBsYXlsaXN0LXdyYXBcIikpOyJdfQ==
