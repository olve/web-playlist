(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WORKER_FILEREADER = "./FileReaderSync_worker.js";

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
								parentPlaylist.refs.seekbar.value = this.element.currentTime / this.element.duration;
							}).bind(this);
							var onSeekbarClick = function onSeekbarClick(event) {
								var percentage = event.offsetX / this.offsetWidth;
								self.element.currentTime = percentage * self.element.duration;
								parentPlaylist.refs.seekbar.value = percentage / 100;
							};
							this.stop = function () {
								if (this.element !== null) {
									this.element.pause();
									this.element.currentTime = 0;
									this.playing = false;
									parentPlaylist.refs.timepos.textContent = "";

									this.element.removeEventListener("timeupdate", onTimeUpdate);
									parentPlaylist.refs.seekbar.removeEventListener("click", onSeekbarClick);
								}
							};
							this.play = function () {
								if (this.element !== null) {
									this.element.play();
									this.playing = true;
									parentPlaylist.setState({ pausedTrack: null });

									this.element.addEventListener("timeupdate", onTimeUpdate);
									parentPlaylist.refs.seekbar.addEventListener("click", onSeekbarClick);
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
								this.audio.element.addEventListener("ended", (function () {
									this.playing = false;
									parentPlaylist.playNextTrack(this);
									parentPlaylist.refs.seekbar.value = 0;
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
				return React.createElement(
					"p",
					null,
					"Drop music!"
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
						React.createElement("progress", { ref: "seekbar", value: "0", max: "1" }),
						React.createElement("span", { className: "timepos", ref: "timepos" }),
						React.createElement(
							"button",
							{ className: "repeat-button", onClick: toggleRepeat },
							repeatButtonText
						)
					)
				)
			);
		};

		_this.state = {
			files: [],
			repeatAll: true,
			repeatCurrent: false,
			pausedTrack: null
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0FBRXZELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQWdCaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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RUFBQyxPQUFPLEVBQUUsWUFBWSxBQUFDO09BQUUsZ0JBQWdCO09BQVU7TUFDL0U7S0FDRDtJQUVELENBQ0w7R0FFRjs7QUFuV0EsUUFBSyxLQUFLLEdBQUc7QUFDWixRQUFLLEVBQUUsRUFBRTtBQUNULFlBQVMsRUFBRSxJQUFJO0FBQ2YsZ0JBQWEsRUFBRSxLQUFLO0FBQ3BCLGNBQVcsRUFBRSxJQUFJO0dBQ2pCLENBQUE7O0VBQ0Q7O2NBVkksV0FBVzs7OEJBV0osS0FBSyxFQUFFO0FBQ2xCLFFBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN4QixRQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdkIsVUFBTyxLQUFLLENBQUM7R0FDYjs7O1FBZkksV0FBVztHQUFTLEtBQUssQ0FBQyxTQUFTOztBQXlXekMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxXQUFXLElBQUMsUUFBUSxFQUFFLE1BQU0sQUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgV09SS0VSX0ZJTEVSRUFERVIgPSBcIi4vRmlsZVJlYWRlclN5bmNfd29ya2VyLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpIHtcclxuXHRpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudC5kYXRhVHJhbnNmZXIudHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlc1tpXSA9PT0gXCJGaWxlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHR9XHJcbiAgICByZXR1cm4gZmFsc2U7XHRcdFx0XHJcbn1cclxuXHJcbmxldCBwbGFjZWhvbGRlckxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG5wbGFjZWhvbGRlckxpLmNsYXNzTmFtZSA9IFwicGxhY2Vob2xkZXJcIjtcclxuXHJcbmNsYXNzIFdlYlBsYXlsaXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0dGhpcy5zdGF0ZSA9IHtcclxuXHRcdFx0ZmlsZXM6IFtdLFxyXG5cdFx0XHRyZXBlYXRBbGw6IHRydWUsXHJcblx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0XHRwYXVzZWRUcmFjazogbnVsbCxcclxuXHRcdH1cclxuXHR9XHJcblx0Y2FuY2VsRXZlbnQoZXZlbnQpIHtcclxuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHJldHVybiBldmVudDtcclxuXHR9XHJcblx0YnViYmxlRXZlbnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmIChldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0XHR9XHJcblx0fVxyXG5cdGRyYWdTdGFydCA9IChldmVudCkgPT4ge1xyXG5cdFx0dGhpcy5kcmFnZ2VkID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvaHRtbFwiLCBldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuXHR9XHJcblx0ZHJhZ0VuZCA9IChldmVudCkgPT4ge1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcblx0XHR0aGlzLmRyYWdnZWQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwbGFjZWhvbGRlckxpKTtcclxuXHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0bGV0IGZyb20gPSBOdW1iZXIodGhpcy5kcmFnZ2VkLmRhdGFzZXQuaWQpO1xyXG5cdFx0bGV0IHRvID0gTnVtYmVyKHRoaXMub3Zlci5kYXRhc2V0LmlkKTtcclxuXHRcdGlmIChmcm9tIDwgdG8pIHRvLS07XHJcblx0XHRmaWxlcy5zcGxpY2UodG8sIDAsIGZpbGVzLnNwbGljZShmcm9tLCAxKVswXSk7XHJcblxyXG5cdFx0ZmlsZXMuZm9yRWFjaCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZmlsZS5pbmRleCA9IGluZGV4O1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IGZpbGVzfSk7XHJcblx0fVxyXG5cdGRyYWdPdmVyID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7O1xyXG5cdFx0fVxyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblx0XHRpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTmFtZSA9PSBcInBsYWNlaG9sZGVyXCIpIHJldHVybjtcclxuXHRcdHRoaXMub3ZlciA9IGV2ZW50LnRhcmdldDtcclxuXHJcblx0XHRsZXQgcmVsWSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLm92ZXIub2Zmc2V0VG9wO1xyXG5cdFx0bGV0IGhlaWdodCA9IHRoaXMub3Zlci5vZmZzZXRIZWlnaHQgLyAyO1xyXG5cdFx0bGV0IHBhcmVudCA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuXHRcdGlmIChwYXJlbnQgPT09IHRoaXMucmVmcy50cmFja2xpc3QpIHtcclxuXHRcdFx0aWYgKHJlbFkgPiBoZWlnaHQpIHtcclxuXHRcdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImFmdGVyXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQubmV4dEVsZW1lbnRTaWJsaW5nKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChyZWxZIDwgaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJiZWZvcmVcIjtcclxuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldCk7XHJcblx0XHRcdH1cclxuXHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0ZHJhZ0VudGVyID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcmFnTGVhdmUgPSAoZXZlbnQpID0+IHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdGRyb3AgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmICghZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHRcdFx0XHJcblx0XHR9XHJcblx0XHRldmVudCA9IHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcImNvcHlcIjtcclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwLCBmaWxlRGF0YTsgZmlsZURhdGEgPSBldmVudC5kYXRhVHJhbnNmZXIuZmlsZXNbaV07IGkrKykge1xyXG5cdFx0XHRpZiAoZmlsZURhdGEudHlwZS5zdGFydHNXaXRoKFwiYXVkaW8vXCIpKSB7XHJcblx0XHRcdFx0bGV0IF9maWxlID0ge1xyXG5cdFx0XHRcdFx0ZGF0YTogZmlsZURhdGEsXHJcblx0XHRcdFx0XHRhdWRpbzogbmV3IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQgPSBudWxsO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0bGV0IHNlbGYgPSB0aGlzO1xyXG5cdFx0XHRcdFx0XHRmdW5jdGlvbiBzZWNvbmRzVG9QYWRkZWRNaW51dGVzKG51bWJlcikge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBtaW51dGVzID0gTWF0aC5mbG9vcihudW1iZXIgLyA2MCk7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHNlY29uZHMgPSAoXCIwXCIgKyBNYXRoLnJvdW5kKG51bWJlciAtIG1pbnV0ZXMqNjApKS5zbGljZSgtMik7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGAke21pbnV0ZXN9OiR7c2Vjb25kc31gO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGxldCBvblRpbWVVcGRhdGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnRpbWVwb3MudGV4dENvbnRlbnQgPSBzZWNvbmRzVG9QYWRkZWRNaW51dGVzKHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSk7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrYmFyLnZhbHVlID0gdGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lIC8gdGhpcy5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdGxldCBvblNlZWtiYXJDbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHBlcmNlbnRhZ2UgPSBldmVudC5vZmZzZXRYIC8gdGhpcy5vZmZzZXRXaWR0aDtcclxuXHRcdFx0XHRcdFx0XHRzZWxmLmVsZW1lbnQuY3VycmVudFRpbWUgPSBwZXJjZW50YWdlICogc2VsZi5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla2Jhci52YWx1ZSA9IHBlcmNlbnRhZ2UgLyAxMDA7XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lID0gMDtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy50aW1lcG9zLnRleHRDb250ZW50ID0gXCJcIjtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgb25UaW1lVXBkYXRlKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla2Jhci5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25TZWVrYmFyQ2xpY2spO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBsYXkoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IG51bGx9KTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgb25UaW1lVXBkYXRlKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla2Jhci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25TZWVrYmFyQ2xpY2spO1xyXG5cdFx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBhdXNlKCk7XHJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0YnVmZmVyOiBudWxsLFxyXG5cdFx0XHRcdFx0aW5kZXg6IHBhcmVudFBsYXlsaXN0LnN0YXRlLmZpbGVzLmxlbmd0aCxcclxuXHRcdFx0XHRcdGNyZWF0ZUF1ZGlvOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLmJ1ZmZlciAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBibG9iID0gbmV3IEJsb2IoW3RoaXMuYnVmZmVyXSwge3R5cGU6IHRoaXMuZGF0YS50eXBlfSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50ID0gbmV3IEF1ZGlvKFtVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheU5leHRUcmFjayh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla2Jhci52YWx1ZSA9IDA7XHJcblx0XHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGxldCBvbkNhblBsYXkgPSBmdW5jdGlvbihldmVudCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZSh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQudHlwZSwgb25DYW5QbGF5KTtcclxuXHRcdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2FucGxheVwiLCBvbkNhblBsYXkpO1x0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0cmVhZDogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRsZXQgd29ya2VyID0gbmV3IFdvcmtlcihXT1JLRVJfRklMRVJFQURFUik7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5idWZmZXIgPSBtZXNzYWdlLmRhdGE7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5jcmVhdGVBdWRpbyhwbGF5V2hlblJlYWR5KTtcclxuXHRcdFx0XHRcdFx0XHR3b3JrZXIudGVybWluYXRlKCk7XHJcblx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0d29ya2VyLnBvc3RNZXNzYWdlKHRoaXMuZGF0YSk7XHJcblx0XHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHRoaXMuc3RhdGUuZmlsZXMuY29uY2F0KFtfZmlsZV0pfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50V2lsbFVubW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cGxheU5leHRUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0aWYgKCFjdXJyZW50KSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGN1cnJlbnQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBuZXh0ID0gZmlsZXNbY3VycmVudC5pbmRleCsxXTtcclxuXHRcdGlmIChuZXh0KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKG5leHQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEFsbCAmJiBmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cGxheVByZXZUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0aWYgKCFjdXJyZW50KSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGxldCBwcmV2ID0gY3VycmVudC5pbmRleCA9PT0gMCA/IGZpbGVzW2ZpbGVzLmxlbmd0aC0xXSA6IGZpbGVzW2N1cnJlbnQuaW5kZXgtMV07XHJcblx0XHRpZiAocHJldikge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShwcmV2KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlGaWxlID0gKGZpbGVUb1BsYXkpID0+IHtcclxuXHRcdGlmICghZmlsZVRvUGxheSkgcmV0dXJuO1xyXG5cdFx0aWYgKHRoaXMuc3RhdGUucGF1c2VkVHJhY2sgPT09IGZpbGVUb1BsYXkpIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3BhdXNlZFRyYWNrOiBudWxsfSk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Zm9yIChsZXQgZmlsZSBvZiB0aGlzLnN0YXRlLmZpbGVzKSB7XHJcblx0XHRcdFx0ZmlsZS5hdWRpby5zdG9wKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGZpbGVUb1BsYXkuYXVkaW8uZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGZpbGVUb1BsYXkucmVhZCh0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dGhpcy5mb3JjZVVwZGF0ZSgpO1xyXG5cdH1cclxuXHRyZW5kZXIgPSAoKSA9PiB7XHJcblx0XHRpZiAoIXRoaXMuc3RhdGUuZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdHJldHVybiAoXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWxlZHJvcC1wcm9tcHRcIj5cclxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cIm1kaSBtZGktZmlsZS1tdXNpY1wiPjwvaT5cclxuXHRcdFx0XHRcdERyYWcgJiBEcm9wIHNvbWUgbXVzaWMgaGVyZSFcclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0KTtcclxuXHRcdFx0cmV0dXJuIDxwPkRyb3AgbXVzaWMhPC9wPjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGxldCBmaWxlRWxlbWVudHMgPSB0aGlzLnN0YXRlLmZpbGVzLm1hcCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZnVuY3Rpb24gb25jbGljaygpIHtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZShmaWxlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIDxsaSBcclxuXHRcdFx0XHRjbGFzc05hbWU9e2ZpbGUuYXVkaW8ucGxheWluZyA/IFwicGxheWluZ1wiIDogXCJcIn1cclxuXHRcdFx0XHRvbkNsaWNrPXtvbmNsaWNrfVxyXG5cdFx0XHRcdGtleT17XCJmaWxlLWtleS1cIitpbmRleH1cclxuXHRcdFx0XHRkYXRhLWlkPXtpbmRleH1cclxuXHRcdFx0XHRkcmFnZ2FibGU9XCJ0cnVlXCJcclxuXHRcdFx0XHRvbkRyYWdFbmQ9e3BhcmVudFBsYXlsaXN0LmRyYWdFbmR9XHJcblx0XHRcdFx0b25EcmFnU3RhcnQ9e3BhcmVudFBsYXlsaXN0LmRyYWdTdGFydH1cclxuXHRcdFx0PlxyXG5cdFx0XHRcdHtmaWxlLmRhdGEubmFtZX1cclxuXHRcdFx0PC9saT5cclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBhY3RpdmVUcmFja3MgPSB0aGlzLnN0YXRlLmZpbGVzLm1hcChmaWxlID0+IHtcclxuXHRcdFx0aWYgKGZpbGUuYXVkaW8ucGxheWluZykge1xyXG5cdFx0XHRcdHJldHVybiBmaWxlO1xyXG5cdFx0XHR9XHJcblx0XHR9KS5maWx0ZXIobGlzdEl0ZW0gPT4gKGxpc3RJdGVtKSk7XHJcblxyXG5cdFx0bGV0IGN1cnJlbnRUcmFjayA9IGFjdGl2ZVRyYWNrcy5sZW5ndGggPyBhY3RpdmVUcmFja3NbMF0gOiBudWxsO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHBhdXNlQWxsKCkge1xyXG5cdFx0XHRpZiAoYWN0aXZlVHJhY2tzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtwYXVzZWRUcmFjazogYWN0aXZlVHJhY2tzWzBdfSk7XHJcblx0XHRcdFx0YWN0aXZlVHJhY2tzLmZvckVhY2goZmlsZSA9PiB7XHJcblx0XHRcdFx0XHRmaWxlLmF1ZGlvLnBhdXNlKClcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5mb3JjZVVwZGF0ZSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRmdW5jdGlvbiBwbGF5UGF1c2VkKCkge1xyXG5cdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZShwYXJlbnRQbGF5bGlzdC5zdGF0ZS5wYXVzZWRUcmFjayk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHBsYXlwYXVzZSA9IG51bGw7XHJcblx0XHRpZiAoIWFjdGl2ZVRyYWNrcy5sZW5ndGggJiYgdGhpcy5zdGF0ZS5wYXVzZWRUcmFjayA9PT0gbnVsbCkge1xyXG5cdFx0XHRwbGF5cGF1c2UgPSA8YnV0dG9uIG9uQ2xpY2s9e2Z1bmN0aW9uKCkge3BhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2soKTt9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXBsYXlcIj48L2k+PC9idXR0b24+XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cGxheXBhdXNlID0gKHRoaXMuc3RhdGUucGF1c2VkVHJhY2sgIT09IG51bGwpID8gPGJ1dHRvbiBvbkNsaWNrPXtwbGF5UGF1c2VkfT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXBsYXlcIj48L2k+PC9idXR0b24+IDogPGJ1dHRvbiBvbkNsaWNrPXtwYXVzZUFsbH0+PGkgY2xhc3NOYW1lPVwibWRpIG1kaS1wYXVzZVwiPjwvaT48L2J1dHRvbj47XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHRvZ2dsZVJlcGVhdCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRBbGwpIHtcclxuXHRcdFx0XHR0aGlzLnNldFN0YXRlKHtcclxuXHRcdFx0XHRcdHJlcGVhdEFsbDogZmFsc2UsXHJcblx0XHRcdFx0XHRyZXBlYXRDdXJyZW50OiB0cnVlLFxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0XHRyZXBlYXRBbGw6IGZhbHNlLFxyXG5cdFx0XHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmICghdGhpcy5zdGF0ZS5yZXBlYXRBbGwgJiYgIXRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe1xyXG5cdFx0XHRcdFx0cmVwZWF0QWxsOiB0cnVlLFxyXG5cdFx0XHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVxyXG5cdFx0fS5iaW5kKHRoaXMpO1xyXG5cclxuXHRcdC8vbGV0IHJlcGVhdEJ1dHRvblRleHQgPSBcIk5vIHJlcGVhdFwiO1xyXG5cdFx0bGV0IHJlcGVhdEJ1dHRvblRleHQgPSA8aSBjbGFzc05hbWU9XCJtZGkgbWRpLXJlcGVhdC1vZmZcIj48L2k+XHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRBbGwpIHtcclxuXHRcdFx0Ly9yZXBlYXRCdXR0b25UZXh0ID0gXCJSZXBlYXRpbmcgYWxsXCI7XHJcblx0XHRcdHJlcGVhdEJ1dHRvblRleHQgPSA8aSBjbGFzc05hbWU9XCJtZGkgbWRpLXJlcGVhdFwiPjwvaT5cclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHQvL3JlcGVhdEJ1dHRvblRleHQgPSBcIlJlcGVhdGluZyBjdXJyZW50XCI7XHJcblx0XHRcdHJlcGVhdEJ1dHRvblRleHQgPSA8aSBjbGFzc05hbWU9XCJtZGkgbWRpLXJlcGVhdC1vbmNlXCI+PC9pPlxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybihcclxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ3ZWItcGxheWxpc3RcIj5cclxuXHJcblx0XHRcdFx0PHVsIGNsYXNzTmFtZT1cInRyYWNrbGlzdFwiIHJlZj1cInRyYWNrbGlzdFwiPlxyXG5cdFx0XHRcdFx0e2ZpbGVFbGVtZW50c31cclxuXHRcdFx0XHQ8L3VsPlxyXG5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbnRyb2xzXCI+XHJcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbnRyb2xzLXBsYXliYWNrXCI+XHJcblx0XHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5UHJldlRyYWNrKGN1cnJlbnRUcmFjayl9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXNraXAtcHJldmlvdXNcIj48L2k+PC9idXR0b24+XHJcblx0XHRcdFx0XHRcdHtwbGF5cGF1c2V9XHJcblx0XHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5TmV4dFRyYWNrKGN1cnJlbnRUcmFjayl9fT48aSBjbGFzc05hbWU9XCJtZGkgbWRpLXNraXAtbmV4dFwiPjwvaT48L2J1dHRvbj5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29udHJvbHMtc2Vjb25kYXJ5XCI+XHJcblx0XHRcdFx0XHRcdDxwcm9ncmVzcyByZWY9XCJzZWVrYmFyXCIgdmFsdWU9XCIwXCIgbWF4PVwiMVwiPjwvcHJvZ3Jlc3M+IFxyXG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJ0aW1lcG9zXCIgcmVmPVwidGltZXBvc1wiPjwvc3Bhbj5cclxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBjbGFzc05hbWU9XCJyZXBlYXQtYnV0dG9uXCIgb25DbGljaz17dG9nZ2xlUmVwZWF0fT57cmVwZWF0QnV0dG9uVGV4dH08L2J1dHRvbj5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0PC9kaXY+XHJcblx0XHQpO1xyXG5cclxuXHR9XHJcbn1cclxuUmVhY3RET00ucmVuZGVyKDxXZWJQbGF5bGlzdCBkcm9wem9uZT17d2luZG93fSAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWItcGxheWxpc3Qtd3JhcFwiKSk7Il19
