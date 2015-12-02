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
							var onTimeUpdate = (function () {
								parentPlaylist.refs.seekbar.value = this.element.currentTime / this.element.duration;
							}).bind(this);
							var onSeekbarClick = function onSeekbarClick(event) {
								var percentage = event.offsetX / this.offsetWidth;
								self.element.currentTime = percentage * self.element.duration;
								parentPlaylist.refs.seekbar.value = percentage / 100;
								console.log(percentage);
							};
							this.stop = function () {
								if (this.element !== null) {
									this.element.pause();
									this.element.currentTime = 0;
									this.playing = false;

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
					null,
					"Nothing playing..."
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
				null,
				React.createElement(
					"button",
					{ className: _this.state.repeatAll ? "enabledButton" : "", onClick: toggleRepeatAll },
					"Repeat all"
				),
				React.createElement(
					"button",
					{ className: _this.state.repeatCurrent ? "enabledButton" : "", onClick: toggleRepeatCurrent },
					"Repeat current"
				),
				React.createElement(
					"div",
					null,
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
					)
				),
				React.createElement("progress", { ref: "seekbar", value: "0", max: "1" }),
				React.createElement(
					"ul",
					{ ref: "tracklist" },
					fileElements
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0FBRXZELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQWdCaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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dkIsVUFBTyxLQUFLLENBQUM7R0FDYjs7O1FBZkksV0FBVztHQUFTLEtBQUssQ0FBQyxTQUFTOztBQWdVekMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxXQUFXLElBQUMsUUFBUSxFQUFFLE1BQU0sQUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgV09SS0VSX0ZJTEVSRUFERVIgPSBcIi4vRmlsZVJlYWRlclN5bmNfd29ya2VyLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpIHtcclxuXHRpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudC5kYXRhVHJhbnNmZXIudHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlc1tpXSA9PT0gXCJGaWxlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHR9XHJcbiAgICByZXR1cm4gZmFsc2U7XHRcdFx0XHJcbn1cclxuXHJcbmxldCBwbGFjZWhvbGRlckxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG5wbGFjZWhvbGRlckxpLmNsYXNzTmFtZSA9IFwicGxhY2Vob2xkZXJcIjtcclxuXHJcbmNsYXNzIFdlYlBsYXlsaXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0dGhpcy5zdGF0ZSA9IHtcclxuXHRcdFx0ZmlsZXM6IFtdLFxyXG5cdFx0XHRyZXBlYXRBbGw6IHRydWUsXHJcblx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0XHRwYXVzZWRUcmFjazogbnVsbCxcclxuXHRcdH1cclxuXHR9XHJcblx0Y2FuY2VsRXZlbnQoZXZlbnQpIHtcclxuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHJldHVybiBldmVudDtcclxuXHR9XHJcblx0YnViYmxlRXZlbnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmIChldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0XHR9XHJcblx0fVxyXG5cdGRyYWdTdGFydCA9IChldmVudCkgPT4ge1xyXG5cdFx0dGhpcy5kcmFnZ2VkID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvaHRtbFwiLCBldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuXHR9XHJcblx0ZHJhZ0VuZCA9IChldmVudCkgPT4ge1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcblx0XHR0aGlzLmRyYWdnZWQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwbGFjZWhvbGRlckxpKTtcclxuXHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0bGV0IGZyb20gPSBOdW1iZXIodGhpcy5kcmFnZ2VkLmRhdGFzZXQuaWQpO1xyXG5cdFx0bGV0IHRvID0gTnVtYmVyKHRoaXMub3Zlci5kYXRhc2V0LmlkKTtcclxuXHRcdGlmIChmcm9tIDwgdG8pIHRvLS07XHJcblx0XHRmaWxlcy5zcGxpY2UodG8sIDAsIGZpbGVzLnNwbGljZShmcm9tLCAxKVswXSk7XHJcblxyXG5cdFx0ZmlsZXMuZm9yRWFjaCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZmlsZS5pbmRleCA9IGluZGV4O1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IGZpbGVzfSk7XHJcblx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7IC8vbWF5YmUgbm90IG5lY2Vzc2FyeTsgdGhpcy5zZXRTdGF0ZSBmb3JjZVVwZGF0ZXM/XHJcblx0fVxyXG5cdGRyYWdPdmVyID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7O1xyXG5cdFx0fVxyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblx0XHRpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTmFtZSA9PSBcInBsYWNlaG9sZGVyXCIpIHJldHVybjtcclxuXHRcdHRoaXMub3ZlciA9IGV2ZW50LnRhcmdldDtcclxuXHJcblx0XHRsZXQgcmVsWSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLm92ZXIub2Zmc2V0VG9wO1xyXG5cdFx0bGV0IGhlaWdodCA9IHRoaXMub3Zlci5vZmZzZXRIZWlnaHQgLyAyO1xyXG5cdFx0bGV0IHBhcmVudCA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuXHRcdGlmIChwYXJlbnQgPT09IHRoaXMucmVmcy50cmFja2xpc3QpIHtcclxuXHRcdFx0aWYgKHJlbFkgPiBoZWlnaHQpIHtcclxuXHRcdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImFmdGVyXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQubmV4dEVsZW1lbnRTaWJsaW5nKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChyZWxZIDwgaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJiZWZvcmVcIjtcclxuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldCk7XHJcblx0XHRcdH1cclxuXHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0ZHJhZ0VudGVyID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcmFnTGVhdmUgPSAoZXZlbnQpID0+IHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdGRyb3AgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmICghZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHRcdFx0XHJcblx0XHR9XHJcblx0XHRldmVudCA9IHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcImNvcHlcIjtcclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwLCBmaWxlRGF0YTsgZmlsZURhdGEgPSBldmVudC5kYXRhVHJhbnNmZXIuZmlsZXNbaV07IGkrKykge1xyXG5cdFx0XHRpZiAoZmlsZURhdGEudHlwZS5zdGFydHNXaXRoKFwiYXVkaW8vXCIpKSB7XHJcblx0XHRcdFx0bGV0IF9maWxlID0ge1xyXG5cdFx0XHRcdFx0ZGF0YTogZmlsZURhdGEsXHJcblx0XHRcdFx0XHRhdWRpbzogbmV3IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQgPSBudWxsO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0bGV0IHNlbGYgPSB0aGlzO1xyXG5cdFx0XHRcdFx0XHRsZXQgb25UaW1lVXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrYmFyLnZhbHVlID0gdGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lIC8gdGhpcy5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdGxldCBvblNlZWtiYXJDbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHBlcmNlbnRhZ2UgPSBldmVudC5vZmZzZXRYIC8gdGhpcy5vZmZzZXRXaWR0aDtcclxuXHRcdFx0XHRcdFx0XHRzZWxmLmVsZW1lbnQuY3VycmVudFRpbWUgPSBwZXJjZW50YWdlICogc2VsZi5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnJlZnMuc2Vla2Jhci52YWx1ZSA9IHBlcmNlbnRhZ2UgLyAxMDA7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2cocGVyY2VudGFnZSk7XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lID0gMDtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCBvblRpbWVVcGRhdGUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrYmFyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvblNlZWtiYXJDbGljayk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBsYXkgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGxheSgpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtwYXVzZWRUcmFjazogbnVsbH0pO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCBvblRpbWVVcGRhdGUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvblNlZWtiYXJDbGljayk7XHJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGF1c2UoKTtcclxuXHRcdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRidWZmZXI6IG51bGwsXHJcblx0XHRcdFx0XHRpbmRleDogcGFyZW50UGxheWxpc3Quc3RhdGUuZmlsZXMubGVuZ3RoLFxyXG5cdFx0XHRcdFx0Y3JlYXRlQXVkaW86IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYnVmZmVyICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IGJsb2IgPSBuZXcgQmxvYihbdGhpcy5idWZmZXJdLCB7dHlwZTogdGhpcy5kYXRhLnR5cGV9KTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQgPSBuZXcgQXVkaW8oW1VSTC5jcmVhdGVPYmplY3RVUkwoYmxvYildKTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5TmV4dFRyYWNrKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmIChwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRsZXQgb25DYW5QbGF5ID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LnR5cGUsIG9uQ2FuUGxheSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNhbnBsYXlcIiwgb25DYW5QbGF5KTtcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdHJlYWQ6IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHdvcmtlciA9IG5ldyBXb3JrZXIoV09SS0VSX0ZJTEVSRUFERVIpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYnVmZmVyID0gbWVzc2FnZS5kYXRhO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY3JlYXRlQXVkaW8ocGxheVdoZW5SZWFkeSk7XHJcblx0XHRcdFx0XHRcdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5wb3N0TWVzc2FnZSh0aGlzLmRhdGEpO1xyXG5cdFx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB0aGlzLnN0YXRlLmZpbGVzLmNvbmNhdChbX2ZpbGVdKX0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudERpZE1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlOZXh0VHJhY2sgPSAoY3VycmVudCkgPT4ge1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGlmICghY3VycmVudCkge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0Q3VycmVudCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShjdXJyZW50KTtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgbmV4dCA9IGZpbGVzW2N1cnJlbnQuaW5kZXgrMV07XHJcblx0XHRpZiAobmV4dCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShuZXh0KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRBbGwgJiYgZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlQcmV2VHJhY2sgPSAoY3VycmVudCkgPT4ge1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGlmICghY3VycmVudCkge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRsZXQgcHJldiA9IGN1cnJlbnQuaW5kZXggPT09IDAgPyBmaWxlc1tmaWxlcy5sZW5ndGgtMV0gOiBmaWxlc1tjdXJyZW50LmluZGV4LTFdO1xyXG5cdFx0aWYgKHByZXYpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUocHJldik7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aWYgKGZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRwbGF5RmlsZSA9IChmaWxlVG9QbGF5KSA9PiB7XHJcblx0XHRpZiAoIWZpbGVUb1BsYXkpIHJldHVybjtcclxuXHRcdGlmICh0aGlzLnN0YXRlLnBhdXNlZFRyYWNrID09PSBmaWxlVG9QbGF5KSB7XHJcblx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtwYXVzZWRUcmFjazogbnVsbH0pO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGZvciAobGV0IGZpbGUgb2YgdGhpcy5zdGF0ZS5maWxlcykge1xyXG5cdFx0XHRcdGZpbGUuYXVkaW8uc3RvcCgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChmaWxlVG9QbGF5LmF1ZGlvLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRmaWxlVG9QbGF5LmF1ZGlvLnBsYXkoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRmaWxlVG9QbGF5LnJlYWQodHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHRoaXMuZm9yY2VVcGRhdGUoKTtcclxuXHR9XHJcblx0cmVuZGVyID0gKCkgPT4ge1xyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLmZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRyZXR1cm4gPHA+RHJvcCBtdXNpYyE8L3A+O1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBwYXJlbnRQbGF5bGlzdCA9IHRoaXM7XHJcblxyXG5cdFx0bGV0IGZpbGVFbGVtZW50cyA9IHRoaXMuc3RhdGUuZmlsZXMubWFwKChmaWxlLCBpbmRleCkgPT4ge1xyXG5cdFx0XHRmdW5jdGlvbiBvbmNsaWNrKCkge1xyXG5cdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlGaWxlKGZpbGUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gPGxpIFxyXG5cdFx0XHRcdGNsYXNzTmFtZT17ZmlsZS5hdWRpby5wbGF5aW5nID8gXCJwbGF5aW5nXCIgOiBcIlwifVxyXG5cdFx0XHRcdG9uQ2xpY2s9e29uY2xpY2t9XHJcblx0XHRcdFx0a2V5PXtcImZpbGUta2V5LVwiK2luZGV4fVxyXG5cdFx0XHRcdGRhdGEtaWQ9e2luZGV4fVxyXG5cdFx0XHRcdGRyYWdnYWJsZT1cInRydWVcIlxyXG5cdFx0XHRcdG9uRHJhZ0VuZD17cGFyZW50UGxheWxpc3QuZHJhZ0VuZH1cclxuXHRcdFx0XHRvbkRyYWdTdGFydD17cGFyZW50UGxheWxpc3QuZHJhZ1N0YXJ0fVxyXG5cdFx0XHQ+XHJcblx0XHRcdFx0e2ZpbGUuZGF0YS5uYW1lfVxyXG5cdFx0XHQ8L2xpPlxyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gdG9nZ2xlUmVwZWF0QWxsKCkge1xyXG5cdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cmVwZWF0QWxsOiAhcGFyZW50UGxheWxpc3Quc3RhdGUucmVwZWF0QWxsfSk7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LmZvcmNlVXBkYXRlKCk7XHJcblx0XHR9XHJcblx0XHRmdW5jdGlvbiB0b2dnbGVSZXBlYXRDdXJyZW50KCkge1xyXG5cdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cmVwZWF0Q3VycmVudDogIXBhcmVudFBsYXlsaXN0LnN0YXRlLnJlcGVhdEN1cnJlbnR9KTtcclxuXHRcdFx0cGFyZW50UGxheWxpc3QuZm9yY2VVcGRhdGUoKTtcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0bGV0IGFjdGl2ZVRyYWNrcyA9IHRoaXMuc3RhdGUuZmlsZXMubWFwKGZpbGUgPT4ge1xyXG5cdFx0XHRpZiAoZmlsZS5hdWRpby5wbGF5aW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZpbGU7XHJcblx0XHRcdH1cclxuXHRcdH0pLmZpbHRlcihsaXN0SXRlbSA9PiAobGlzdEl0ZW0pKTtcclxuXHJcblx0XHRsZXQgY3VycmVudFRyYWNrID0gYWN0aXZlVHJhY2tzLmxlbmd0aCA/IGFjdGl2ZVRyYWNrc1swXSA6IG51bGw7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcGF1c2VBbGwoKSB7XHJcblx0XHRcdGlmIChhY3RpdmVUcmFja3MubGVuZ3RoKSB7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3BhdXNlZFRyYWNrOiBhY3RpdmVUcmFja3NbMF19KTtcclxuXHRcdFx0XHRhY3RpdmVUcmFja3MuZm9yRWFjaChmaWxlID0+IHtcclxuXHRcdFx0XHRcdGZpbGUuYXVkaW8ucGF1c2UoKVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHBhcmVudFBsYXlsaXN0LmZvcmNlVXBkYXRlKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGZ1bmN0aW9uIHBsYXlQYXVzZWQoKSB7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlGaWxlKHBhcmVudFBsYXlsaXN0LnN0YXRlLnBhdXNlZFRyYWNrKTtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcGxheXBhdXNlID0gbnVsbDtcclxuXHJcblx0XHRpZiAoIWFjdGl2ZVRyYWNrcy5sZW5ndGggJiYgdGhpcy5zdGF0ZS5wYXVzZWRUcmFjayA9PT0gbnVsbCkge1xyXG5cdFx0XHRwbGF5cGF1c2UgPSA8YnV0dG9uPk5vdGhpbmcgcGxheWluZy4uLjwvYnV0dG9uPlxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHBsYXlwYXVzZSA9ICh0aGlzLnN0YXRlLnBhdXNlZFRyYWNrICE9PSBudWxsKSA/IDxidXR0b24gb25DbGljaz17cGxheVBhdXNlZH0+UGxheTwvYnV0dG9uPiA6IDxidXR0b24gb25DbGljaz17cGF1c2VBbGx9PlBhdXNlPC9idXR0b24+O1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybihcclxuXHRcdFx0PGRpdj5cclxuXHRcdFx0XHQ8YnV0dG9uIGNsYXNzTmFtZT17dGhpcy5zdGF0ZS5yZXBlYXRBbGwgPyBcImVuYWJsZWRCdXR0b25cIiA6IFwiXCJ9IG9uQ2xpY2s9e3RvZ2dsZVJlcGVhdEFsbH0+UmVwZWF0IGFsbDwvYnV0dG9uPlxyXG5cdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPXt0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQgPyBcImVuYWJsZWRCdXR0b25cIiA6IFwiXCJ9IG9uQ2xpY2s9e3RvZ2dsZVJlcGVhdEN1cnJlbnR9PlJlcGVhdCBjdXJyZW50PC9idXR0b24+XHJcblx0XHRcdFx0PGRpdj5cclxuXHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5UHJldlRyYWNrKGN1cnJlbnRUcmFjayl9fT5QcmV2aW91czwvYnV0dG9uPlxyXG5cdFx0XHRcdFx0e3BsYXlwYXVzZX1cclxuXHRcdFx0XHRcdDxidXR0b24gb25DbGljaz17ZnVuY3Rpb24oKXtwYXJlbnRQbGF5bGlzdC5wbGF5TmV4dFRyYWNrKGN1cnJlbnRUcmFjayl9fT5OZXh0PC9idXR0b24+XHJcblx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0PHByb2dyZXNzIHJlZj1cInNlZWtiYXJcIiB2YWx1ZT1cIjBcIiBtYXg9XCIxXCI+PC9wcm9ncmVzcz5cclxuXHRcdFx0XHQ8dWwgcmVmPVwidHJhY2tsaXN0XCI+XHJcblx0XHRcdFx0XHR7ZmlsZUVsZW1lbnRzfVxyXG5cdFx0XHRcdDwvdWw+XHJcblx0XHRcdDwvZGl2PlxyXG5cdFx0KTtcclxuXHJcblx0fVxyXG59XHJcblJlYWN0RE9NLnJlbmRlcig8V2ViUGxheWxpc3QgZHJvcHpvbmU9e3dpbmRvd30gLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2ViLXBsYXlsaXN0LXdyYXBcIikpOyJdfQ==
