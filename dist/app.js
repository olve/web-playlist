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
			_this.forceUpdate(); //maybe not necessary; this.setState forceUpdates?
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

			function toggleRepeatAll() {
				parentPlaylist.setState({ repeatAll: !parentPlaylist.state.repeatAll });
				parentPlaylist.forceUpdate();
			}
			function toggleRepeatCurrent() {
				parentPlaylist.setState({ repeatCurrent: !parentPlaylist.state.repeatCurrent });
				parentPlaylist.forceUpdate();
			}

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
					"Play"
				);
			} else {
				playpause = _this.state.pausedTrack !== null ? React.createElement(
					"button",
					{ onClick: playPaused },
					"Play"
				) : React.createElement(
					"button",
					{ onClick: pauseAll },
					"Pause"
				);
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
						"button",
						{ onClick: function onClick() {
								parentPlaylist.playPrevTrack(currentTrack);
							} },
						"Previous"
					),
					playpause,
					React.createElement(
						"button",
						{ onClick: function onClick() {
								parentPlaylist.playNextTrack(currentTrack);
							} },
						"Next"
					),
					React.createElement(
						"button",
						{ className: _this.state.repeatAll ? "repeat-all-button enabledButton" : "repeat-all-button", onClick: toggleRepeatAll },
						"Repeat all"
					),
					React.createElement(
						"button",
						{ className: _this.state.repeatCurrent ? "repeat-current-button enabledButton" : "repeat-current-button", onClick: toggleRepeatCurrent },
						"Repeat current"
					),
					React.createElement("progress", { ref: "seekbar", value: "0", max: "1" }),
					React.createElement("span", { className: "timepos", ref: "timepos" })
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0FBRXZELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQWdCaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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LGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUFDLEFBQUM7O01BQWM7S0FFdEY7O1FBQVEsU0FBUyxFQUFFLE1BQUssS0FBSyxDQUFDLFNBQVMsR0FBRyxpQ0FBaUMsR0FBRyxtQkFBbUIsQUFBQyxFQUFDLE9BQU8sRUFBRSxlQUFlLEFBQUM7O01BQW9CO0tBQ2hKOztRQUFRLFNBQVMsRUFBRSxNQUFLLEtBQUssQ0FBQyxhQUFhLEdBQUcscUNBQXFDLEdBQUcsdUJBQXVCLEFBQUMsRUFBQyxPQUFPLEVBQUUsbUJBQW1CLEFBQUM7O01BQXdCO0tBRXBLLGtDQUFVLEdBQUcsRUFBQyxTQUFTLEVBQUMsS0FBSyxFQUFDLEdBQUcsRUFBQyxHQUFHLEVBQUMsR0FBRyxHQUFZO0tBQ3JELDhCQUFNLFNBQVMsRUFBQyxTQUFTLEVBQUMsR0FBRyxFQUFDLFNBQVMsR0FBUTtLQUMxQztJQUVELENBQ0w7R0FFRjs7QUF2VUEsUUFBSyxLQUFLLEdBQUc7QUFDWixRQUFLLEVBQUUsRUFBRTtBQUNULFlBQVMsRUFBRSxJQUFJO0FBQ2YsZ0JBQWEsRUFBRSxLQUFLO0FBQ3BCLGNBQVcsRUFBRSxJQUFJO0dBQ2pCLENBQUE7O0VBQ0Q7O2NBVkksV0FBVzs7OEJBV0osS0FBSyxFQUFFO0FBQ2xCLFFBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN4QixRQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdkIsVUFBTyxLQUFLLENBQUM7R0FDYjs7O1FBZkksV0FBVztHQUFTLEtBQUssQ0FBQyxTQUFTOztBQTZVekMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxXQUFXLElBQUMsUUFBUSxFQUFFLE1BQU0sQUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgV09SS0VSX0ZJTEVSRUFERVIgPSBcIi4vRmlsZVJlYWRlclN5bmNfd29ya2VyLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpIHtcclxuXHRpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudC5kYXRhVHJhbnNmZXIudHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlc1tpXSA9PT0gXCJGaWxlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHR9XHJcbiAgICByZXR1cm4gZmFsc2U7XHRcdFx0XHJcbn1cclxuXHJcbmxldCBwbGFjZWhvbGRlckxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG5wbGFjZWhvbGRlckxpLmNsYXNzTmFtZSA9IFwicGxhY2Vob2xkZXJcIjtcclxuXHJcbmNsYXNzIFdlYlBsYXlsaXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0dGhpcy5zdGF0ZSA9IHtcclxuXHRcdFx0ZmlsZXM6IFtdLFxyXG5cdFx0XHRyZXBlYXRBbGw6IHRydWUsXHJcblx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0XHRwYXVzZWRUcmFjazogbnVsbCxcclxuXHRcdH1cclxuXHR9XHJcblx0Y2FuY2VsRXZlbnQoZXZlbnQpIHtcclxuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHJldHVybiBldmVudDtcclxuXHR9XHJcblx0YnViYmxlRXZlbnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmIChldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0XHR9XHJcblx0fVxyXG5cdGRyYWdTdGFydCA9IChldmVudCkgPT4ge1xyXG5cdFx0dGhpcy5kcmFnZ2VkID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvaHRtbFwiLCBldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuXHR9XHJcblx0ZHJhZ0VuZCA9IChldmVudCkgPT4ge1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcblx0XHR0aGlzLmRyYWdnZWQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwbGFjZWhvbGRlckxpKTtcclxuXHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0bGV0IGZyb20gPSBOdW1iZXIodGhpcy5kcmFnZ2VkLmRhdGFzZXQuaWQpO1xyXG5cdFx0bGV0IHRvID0gTnVtYmVyKHRoaXMub3Zlci5kYXRhc2V0LmlkKTtcclxuXHRcdGlmIChmcm9tIDwgdG8pIHRvLS07XHJcblx0XHRmaWxlcy5zcGxpY2UodG8sIDAsIGZpbGVzLnNwbGljZShmcm9tLCAxKVswXSk7XHJcblxyXG5cdFx0ZmlsZXMuZm9yRWFjaCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZmlsZS5pbmRleCA9IGluZGV4O1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IGZpbGVzfSk7XHJcblx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7IC8vbWF5YmUgbm90IG5lY2Vzc2FyeTsgdGhpcy5zZXRTdGF0ZSBmb3JjZVVwZGF0ZXM/XHJcblx0fVxyXG5cdGRyYWdPdmVyID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7O1xyXG5cdFx0fVxyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblx0XHRpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTmFtZSA9PSBcInBsYWNlaG9sZGVyXCIpIHJldHVybjtcclxuXHRcdHRoaXMub3ZlciA9IGV2ZW50LnRhcmdldDtcclxuXHJcblx0XHRsZXQgcmVsWSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLm92ZXIub2Zmc2V0VG9wO1xyXG5cdFx0bGV0IGhlaWdodCA9IHRoaXMub3Zlci5vZmZzZXRIZWlnaHQgLyAyO1xyXG5cdFx0bGV0IHBhcmVudCA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuXHRcdGlmIChwYXJlbnQgPT09IHRoaXMucmVmcy50cmFja2xpc3QpIHtcclxuXHRcdFx0aWYgKHJlbFkgPiBoZWlnaHQpIHtcclxuXHRcdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImFmdGVyXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQubmV4dEVsZW1lbnRTaWJsaW5nKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChyZWxZIDwgaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJiZWZvcmVcIjtcclxuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldCk7XHJcblx0XHRcdH1cclxuXHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0ZHJhZ0VudGVyID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcmFnTGVhdmUgPSAoZXZlbnQpID0+IHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdGRyb3AgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmICghZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHRcdFx0XHJcblx0XHR9XHJcblx0XHRldmVudCA9IHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcImNvcHlcIjtcclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwLCBmaWxlRGF0YTsgZmlsZURhdGEgPSBldmVudC5kYXRhVHJhbnNmZXIuZmlsZXNbaV07IGkrKykge1xyXG5cdFx0XHRpZiAoZmlsZURhdGEudHlwZS5zdGFydHNXaXRoKFwiYXVkaW8vXCIpKSB7XHJcblx0XHRcdFx0bGV0IF9maWxlID0ge1xyXG5cdFx0XHRcdFx0ZGF0YTogZmlsZURhdGEsXHJcblx0XHRcdFx0XHRhdWRpbzogbmV3IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQgPSBudWxsO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0bGV0IHNlbGYgPSB0aGlzO1xyXG5cdFx0XHRcdFx0XHRmdW5jdGlvbiBzZWNvbmRzVG9QYWRkZWRNaW51dGVzKG51bWJlcikge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBtaW51dGVzID0gTWF0aC5mbG9vcihudW1iZXIgLyA2MCk7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHNlY29uZHMgPSAoXCIwXCIgKyBNYXRoLnJvdW5kKG51bWJlciAtIG1pbnV0ZXMqNjApKS5zbGljZSgtMik7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGAke21pbnV0ZXN9OiR7c2Vjb25kc31gO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGxldCBvblRpbWVVcGRhdGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5yZWZzLnRpbWVwb3MudGV4dENvbnRlbnQgPSBzZWNvbmRzVG9QYWRkZWRNaW51dGVzKHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSk7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrYmFyLnZhbHVlID0gdGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lIC8gdGhpcy5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdGxldCBvblNlZWtiYXJDbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHBlcmNlbnRhZ2UgPSBldmVudC5vZmZzZXRYIC8gdGhpcy5vZmZzZXRXaWR0aDtcclxuXHRcdFx0XHRcdFx0XHRzZWxmLmVsZW1lbnQuY3VycmVudFRpbWUgPSBwZXJjZW50YWdlICogc2VsZi5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla2Jhci52YWx1ZSA9IHBlcmNlbnRhZ2UgLyAxMDA7XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lID0gMDtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy50aW1lcG9zLnRleHRDb250ZW50ID0gXCJcIjtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgb25UaW1lVXBkYXRlKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla2Jhci5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25TZWVrYmFyQ2xpY2spO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBsYXkoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IG51bGx9KTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgb25UaW1lVXBkYXRlKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla2Jhci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25TZWVrYmFyQ2xpY2spO1xyXG5cdFx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBhdXNlKCk7XHJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0YnVmZmVyOiBudWxsLFxyXG5cdFx0XHRcdFx0aW5kZXg6IHBhcmVudFBsYXlsaXN0LnN0YXRlLmZpbGVzLmxlbmd0aCxcclxuXHRcdFx0XHRcdGNyZWF0ZUF1ZGlvOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLmJ1ZmZlciAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBibG9iID0gbmV3IEJsb2IoW3RoaXMuYnVmZmVyXSwge3R5cGU6IHRoaXMuZGF0YS50eXBlfSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50ID0gbmV3IEF1ZGlvKFtVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheU5leHRUcmFjayh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla2Jhci52YWx1ZSA9IDA7XHJcblx0XHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGxldCBvbkNhblBsYXkgPSBmdW5jdGlvbihldmVudCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZSh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQudHlwZSwgb25DYW5QbGF5KTtcclxuXHRcdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2FucGxheVwiLCBvbkNhblBsYXkpO1x0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0cmVhZDogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRsZXQgd29ya2VyID0gbmV3IFdvcmtlcihXT1JLRVJfRklMRVJFQURFUik7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5idWZmZXIgPSBtZXNzYWdlLmRhdGE7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5jcmVhdGVBdWRpbyhwbGF5V2hlblJlYWR5KTtcclxuXHRcdFx0XHRcdFx0XHR3b3JrZXIudGVybWluYXRlKCk7XHJcblx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0d29ya2VyLnBvc3RNZXNzYWdlKHRoaXMuZGF0YSk7XHJcblx0XHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHRoaXMuc3RhdGUuZmlsZXMuY29uY2F0KFtfZmlsZV0pfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50V2lsbFVubW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cGxheU5leHRUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0aWYgKCFjdXJyZW50KSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGN1cnJlbnQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBuZXh0ID0gZmlsZXNbY3VycmVudC5pbmRleCsxXTtcclxuXHRcdGlmIChuZXh0KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKG5leHQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEFsbCAmJiBmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cGxheVByZXZUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0aWYgKCFjdXJyZW50KSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGxldCBwcmV2ID0gY3VycmVudC5pbmRleCA9PT0gMCA/IGZpbGVzW2ZpbGVzLmxlbmd0aC0xXSA6IGZpbGVzW2N1cnJlbnQuaW5kZXgtMV07XHJcblx0XHRpZiAocHJldikge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShwcmV2KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlGaWxlID0gKGZpbGVUb1BsYXkpID0+IHtcclxuXHRcdGlmICghZmlsZVRvUGxheSkgcmV0dXJuO1xyXG5cdFx0aWYgKHRoaXMuc3RhdGUucGF1c2VkVHJhY2sgPT09IGZpbGVUb1BsYXkpIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3BhdXNlZFRyYWNrOiBudWxsfSk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Zm9yIChsZXQgZmlsZSBvZiB0aGlzLnN0YXRlLmZpbGVzKSB7XHJcblx0XHRcdFx0ZmlsZS5hdWRpby5zdG9wKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGZpbGVUb1BsYXkuYXVkaW8uZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGZpbGVUb1BsYXkucmVhZCh0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dGhpcy5mb3JjZVVwZGF0ZSgpO1xyXG5cdH1cclxuXHRyZW5kZXIgPSAoKSA9PiB7XHJcblx0XHRpZiAoIXRoaXMuc3RhdGUuZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdHJldHVybiA8cD5Ecm9wIG11c2ljITwvcD47XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRsZXQgZmlsZUVsZW1lbnRzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZ1bmN0aW9uIG9uY2xpY2soKSB7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUoZmlsZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiA8bGkgXHJcblx0XHRcdFx0Y2xhc3NOYW1lPXtmaWxlLmF1ZGlvLnBsYXlpbmcgPyBcInBsYXlpbmdcIiA6IFwiXCJ9XHJcblx0XHRcdFx0b25DbGljaz17b25jbGlja31cclxuXHRcdFx0XHRrZXk9e1wiZmlsZS1rZXktXCIraW5kZXh9XHJcblx0XHRcdFx0ZGF0YS1pZD17aW5kZXh9XHJcblx0XHRcdFx0ZHJhZ2dhYmxlPVwidHJ1ZVwiXHJcblx0XHRcdFx0b25EcmFnRW5kPXtwYXJlbnRQbGF5bGlzdC5kcmFnRW5kfVxyXG5cdFx0XHRcdG9uRHJhZ1N0YXJ0PXtwYXJlbnRQbGF5bGlzdC5kcmFnU3RhcnR9XHJcblx0XHRcdD5cclxuXHRcdFx0XHR7ZmlsZS5kYXRhLm5hbWV9XHJcblx0XHRcdDwvbGk+XHJcblx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiB0b2dnbGVSZXBlYXRBbGwoKSB7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtyZXBlYXRBbGw6ICFwYXJlbnRQbGF5bGlzdC5zdGF0ZS5yZXBlYXRBbGx9KTtcclxuXHRcdFx0cGFyZW50UGxheWxpc3QuZm9yY2VVcGRhdGUoKTtcclxuXHRcdH1cclxuXHRcdGZ1bmN0aW9uIHRvZ2dsZVJlcGVhdEN1cnJlbnQoKSB7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtyZXBlYXRDdXJyZW50OiAhcGFyZW50UGxheWxpc3Quc3RhdGUucmVwZWF0Q3VycmVudH0pO1xyXG5cdFx0XHRwYXJlbnRQbGF5bGlzdC5mb3JjZVVwZGF0ZSgpO1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRsZXQgYWN0aXZlVHJhY2tzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoZmlsZSA9PiB7XHJcblx0XHRcdGlmIChmaWxlLmF1ZGlvLnBsYXlpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmlsZTtcclxuXHRcdFx0fVxyXG5cdFx0fSkuZmlsdGVyKGxpc3RJdGVtID0+IChsaXN0SXRlbSkpO1xyXG5cclxuXHRcdGxldCBjdXJyZW50VHJhY2sgPSBhY3RpdmVUcmFja3MubGVuZ3RoID8gYWN0aXZlVHJhY2tzWzBdIDogbnVsbDtcclxuXHJcblx0XHRmdW5jdGlvbiBwYXVzZUFsbCgpIHtcclxuXHRcdFx0aWYgKGFjdGl2ZVRyYWNrcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IGFjdGl2ZVRyYWNrc1swXX0pO1xyXG5cdFx0XHRcdGFjdGl2ZVRyYWNrcy5mb3JFYWNoKGZpbGUgPT4ge1xyXG5cdFx0XHRcdFx0ZmlsZS5hdWRpby5wYXVzZSgpXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3QuZm9yY2VVcGRhdGUoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZnVuY3Rpb24gcGxheVBhdXNlZCgpIHtcclxuXHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUocGFyZW50UGxheWxpc3Quc3RhdGUucGF1c2VkVHJhY2spO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBwbGF5cGF1c2UgPSBudWxsO1xyXG5cclxuXHRcdGlmICghYWN0aXZlVHJhY2tzLmxlbmd0aCAmJiB0aGlzLnN0YXRlLnBhdXNlZFRyYWNrID09PSBudWxsKSB7XHJcblx0XHRcdHBsYXlwYXVzZSA9IDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKSB7cGFyZW50UGxheWxpc3QucGxheU5leHRUcmFjaygpO319PlBsYXk8L2J1dHRvbj5cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRwbGF5cGF1c2UgPSAodGhpcy5zdGF0ZS5wYXVzZWRUcmFjayAhPT0gbnVsbCkgPyA8YnV0dG9uIG9uQ2xpY2s9e3BsYXlQYXVzZWR9PlBsYXk8L2J1dHRvbj4gOiA8YnV0dG9uIG9uQ2xpY2s9e3BhdXNlQWxsfT5QYXVzZTwvYnV0dG9uPjtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4oXHJcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwid2ViLXBsYXlsaXN0XCI+XHJcblxyXG5cdFx0XHRcdDx1bCBjbGFzc05hbWU9XCJ0cmFja2xpc3RcIiByZWY9XCJ0cmFja2xpc3RcIj5cclxuXHRcdFx0XHRcdHtmaWxlRWxlbWVudHN9XHJcblx0XHRcdFx0PC91bD5cclxuXHJcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9sc1wiPlxyXG5cdFx0XHRcdFx0PGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpe3BhcmVudFBsYXlsaXN0LnBsYXlQcmV2VHJhY2soY3VycmVudFRyYWNrKX19PlByZXZpb3VzPC9idXR0b24+XHJcblx0XHRcdFx0XHR7cGxheXBhdXNlfVxyXG5cdFx0XHRcdFx0PGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpe3BhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2soY3VycmVudFRyYWNrKX19Pk5leHQ8L2J1dHRvbj5cclxuXHJcblx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzTmFtZT17dGhpcy5zdGF0ZS5yZXBlYXRBbGwgPyBcInJlcGVhdC1hbGwtYnV0dG9uIGVuYWJsZWRCdXR0b25cIiA6IFwicmVwZWF0LWFsbC1idXR0b25cIn0gb25DbGljaz17dG9nZ2xlUmVwZWF0QWxsfT5SZXBlYXQgYWxsPC9idXR0b24+XHJcblx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzTmFtZT17dGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50ID8gXCJyZXBlYXQtY3VycmVudC1idXR0b24gZW5hYmxlZEJ1dHRvblwiIDogXCJyZXBlYXQtY3VycmVudC1idXR0b25cIn0gb25DbGljaz17dG9nZ2xlUmVwZWF0Q3VycmVudH0+UmVwZWF0IGN1cnJlbnQ8L2J1dHRvbj5cclxuXHJcblx0XHRcdFx0XHQ8cHJvZ3Jlc3MgcmVmPVwic2Vla2JhclwiIHZhbHVlPVwiMFwiIG1heD1cIjFcIj48L3Byb2dyZXNzPiBcclxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInRpbWVwb3NcIiByZWY9XCJ0aW1lcG9zXCI+PC9zcGFuPlxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cclxuXHRcdFx0PC9kaXY+XHJcblx0XHQpO1xyXG5cclxuXHR9XHJcbn1cclxuUmVhY3RET00ucmVuZGVyKDxXZWJQbGF5bGlzdCBkcm9wem9uZT17d2luZG93fSAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWItcGxheWxpc3Qtd3JhcFwiKSk7Il19
