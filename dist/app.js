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
							var onTimeUpdate = (function () {
								parentPlaylist.refs.seekbar.value = this.element.currentTime / this.element.duration;
							}).bind(this);
							this.stop = function () {
								if (this.element !== null) {
									this.element.pause();
									this.element.currentTime = 0;
									this.playing = false;

									this.element.removeEventListener("timeupdate", onTimeUpdate);
								}
							};
							this.play = function () {
								if (this.element !== null) {
									this.element.play();
									this.playing = true;
									parentPlaylist.setState({ pausedTrack: null });

									this.element.addEventListener("timeupdate", onTimeUpdate);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0FBRXZELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQWdCaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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TyxFQUFFLG1CQUFVO0FBQUMsc0JBQWMsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUE7UUFBQyxBQUFDOztNQUFjO0tBQ2pGO0lBQ04sa0NBQVUsR0FBRyxFQUFDLFNBQVMsRUFBQyxLQUFLLEVBQUMsR0FBRyxFQUFDLEdBQUcsRUFBQyxHQUFHLEdBQVk7SUFDckQ7O09BQUksR0FBRyxFQUFDLFdBQVc7S0FDakIsWUFBWTtLQUNUO0lBQ0EsQ0FDTDtHQUVGOztBQWpUQSxRQUFLLEtBQUssR0FBRztBQUNaLFFBQUssRUFBRSxFQUFFO0FBQ1QsWUFBUyxFQUFFLElBQUk7QUFDZixnQkFBYSxFQUFFLEtBQUs7QUFDcEIsY0FBVyxFQUFFLElBQUk7R0FDakIsQ0FBQTs7RUFDRDs7Y0FWSSxXQUFXOzs4QkFXSixLQUFLLEVBQUU7QUFDbEIsUUFBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3hCLFFBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN2QixVQUFPLEtBQUssQ0FBQztHQUNiOzs7UUFmSSxXQUFXO0dBQVMsS0FBSyxDQUFDLFNBQVM7O0FBdVR6QyxRQUFRLENBQUMsTUFBTSxDQUFDLG9CQUFDLFdBQVcsSUFBQyxRQUFRLEVBQUUsTUFBTSxBQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBXT1JLRVJfRklMRVJFQURFUiA9IFwiLi9GaWxlUmVhZGVyU3luY193b3JrZXIuanNcIjtcclxuXHJcbmZ1bmN0aW9uIGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkge1xyXG5cdGlmIChldmVudC5kYXRhVHJhbnNmZXIudHlwZXMpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzW2ldID09PSBcIkZpbGVzXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cdH1cclxuICAgIHJldHVybiBmYWxzZTtcdFx0XHRcclxufVxyXG5cclxubGV0IHBsYWNlaG9sZGVyTGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbnBsYWNlaG9sZGVyTGkuY2xhc3NOYW1lID0gXCJwbGFjZWhvbGRlclwiO1xyXG5cclxuY2xhc3MgV2ViUGxheWxpc3QgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHJcblx0XHR0aGlzLnN0YXRlID0ge1xyXG5cdFx0XHRmaWxlczogW10sXHJcblx0XHRcdHJlcGVhdEFsbDogdHJ1ZSxcclxuXHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHRcdHBhdXNlZFRyYWNrOiBudWxsLFxyXG5cdFx0fVxyXG5cdH1cclxuXHRjYW5jZWxFdmVudChldmVudCkge1xyXG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0cmV0dXJuIGV2ZW50O1xyXG5cdH1cclxuXHRidWJibGVFdmVudCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJldHVybiBldmVudDtcclxuXHRcdH1cclxuXHR9XHJcblx0ZHJhZ1N0YXJ0ID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIjtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9odG1sXCIsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xyXG5cdH1cclxuXHRkcmFnRW5kID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuXHRcdHRoaXMuZHJhZ2dlZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBsYWNlaG9sZGVyTGkpO1xyXG5cclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblx0XHRsZXQgZnJvbSA9IE51bWJlcih0aGlzLmRyYWdnZWQuZGF0YXNldC5pZCk7XHJcblx0XHRsZXQgdG8gPSBOdW1iZXIodGhpcy5vdmVyLmRhdGFzZXQuaWQpO1xyXG5cdFx0aWYgKGZyb20gPCB0bykgdG8tLTtcclxuXHRcdGZpbGVzLnNwbGljZSh0bywgMCwgZmlsZXMuc3BsaWNlKGZyb20sIDEpWzBdKTtcclxuXHJcblx0XHRmaWxlcy5mb3JFYWNoKChmaWxlLCBpbmRleCkgPT4ge1xyXG5cdFx0XHRmaWxlLmluZGV4ID0gaW5kZXg7XHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLnNldFN0YXRlKHtmaWxlczogZmlsZXN9KTtcclxuXHRcdHRoaXMuZm9yY2VVcGRhdGUoKTsgLy9tYXliZSBub3QgbmVjZXNzYXJ5OyB0aGlzLnNldFN0YXRlIGZvcmNlVXBkYXRlcz9cclxuXHR9XHJcblx0ZHJhZ092ZXIgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmIChldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTs7XHJcblx0XHR9XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHRcdGlmIChldmVudC50YXJnZXQuY2xhc3NOYW1lID09IFwicGxhY2Vob2xkZXJcIikgcmV0dXJuO1xyXG5cdFx0dGhpcy5vdmVyID0gZXZlbnQudGFyZ2V0O1xyXG5cclxuXHRcdGxldCByZWxZID0gZXZlbnQuY2xpZW50WSAtIHRoaXMub3Zlci5vZmZzZXRUb3A7XHJcblx0XHRsZXQgaGVpZ2h0ID0gdGhpcy5vdmVyLm9mZnNldEhlaWdodCAvIDI7XHJcblx0XHRsZXQgcGFyZW50ID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XHJcblxyXG5cdFx0aWYgKHBhcmVudCA9PT0gdGhpcy5yZWZzLnRyYWNrbGlzdCkge1xyXG5cdFx0XHRpZiAocmVsWSA+IGhlaWdodCkge1xyXG5cdFx0XHRcdHRoaXMubm9kZVBsYWNlbWVudCA9IFwiYWZ0ZXJcIjtcclxuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldC5uZXh0RWxlbWVudFNpYmxpbmcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHJlbFkgPCBoZWlnaHQpIHtcclxuXHRcdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImJlZm9yZVwiO1xyXG5cdFx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldCk7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHRkcmFnRW50ZXIgPSAoZXZlbnQpID0+IHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdGRyYWdMZWF2ZSA9IChldmVudCkgPT4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0ZHJvcCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKCFldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcdFx0XHRcclxuXHRcdH1cclxuXHRcdGV2ZW50ID0gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwiY29weVwiO1xyXG5cclxuXHRcdGxldCBwYXJlbnRQbGF5bGlzdCA9IHRoaXM7XHJcblxyXG5cdFx0Zm9yIChsZXQgaSA9IDAsIGZpbGVEYXRhOyBmaWxlRGF0YSA9IGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlc1tpXTsgaSsrKSB7XHJcblx0XHRcdGlmIChmaWxlRGF0YS50eXBlLnN0YXJ0c1dpdGgoXCJhdWRpby9cIikpIHtcclxuXHRcdFx0XHRsZXQgX2ZpbGUgPSB7XHJcblx0XHRcdFx0XHRkYXRhOiBmaWxlRGF0YSxcclxuXHRcdFx0XHRcdGF1ZGlvOiBuZXcgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudCA9IG51bGw7XHJcblx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRsZXQgb25UaW1lVXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucmVmcy5zZWVrYmFyLnZhbHVlID0gdGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lIC8gdGhpcy5lbGVtZW50LmR1cmF0aW9uO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lID0gMDtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCBvblRpbWVVcGRhdGUpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBsYXkoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IG51bGx9KTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgb25UaW1lVXBkYXRlKTtcclxuXHRcdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGJ1ZmZlcjogbnVsbCxcclxuXHRcdFx0XHRcdGluZGV4OiBwYXJlbnRQbGF5bGlzdC5zdGF0ZS5maWxlcy5sZW5ndGgsXHJcblx0XHRcdFx0XHRjcmVhdGVBdWRpbzogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5idWZmZXIgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgYmxvYiA9IG5ldyBCbG9iKFt0aGlzLmJ1ZmZlcl0sIHt0eXBlOiB0aGlzLmRhdGEudHlwZX0pO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudCA9IG5ldyBBdWRpbyhbVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKV0pO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2sodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGxldCBvbkNhblBsYXkgPSBmdW5jdGlvbihldmVudCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZSh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQudHlwZSwgb25DYW5QbGF5KTtcclxuXHRcdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2FucGxheVwiLCBvbkNhblBsYXkpO1x0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0cmVhZDogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRsZXQgd29ya2VyID0gbmV3IFdvcmtlcihXT1JLRVJfRklMRVJFQURFUik7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5idWZmZXIgPSBtZXNzYWdlLmRhdGE7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5jcmVhdGVBdWRpbyhwbGF5V2hlblJlYWR5KTtcclxuXHRcdFx0XHRcdFx0XHR3b3JrZXIudGVybWluYXRlKCk7XHJcblx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0d29ya2VyLnBvc3RNZXNzYWdlKHRoaXMuZGF0YSk7XHJcblx0XHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHRoaXMuc3RhdGUuZmlsZXMuY29uY2F0KFtfZmlsZV0pfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50V2lsbFVubW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cGxheU5leHRUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0aWYgKCFjdXJyZW50KSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGN1cnJlbnQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBuZXh0ID0gZmlsZXNbY3VycmVudC5pbmRleCsxXTtcclxuXHRcdGlmIChuZXh0KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKG5leHQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEFsbCAmJiBmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cGxheVByZXZUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0aWYgKCFjdXJyZW50KSB7XHJcblx0XHRcdGlmIChmaWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShmaWxlc1swXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGxldCBwcmV2ID0gY3VycmVudC5pbmRleCA9PT0gMCA/IGZpbGVzW2ZpbGVzLmxlbmd0aC0xXSA6IGZpbGVzW2N1cnJlbnQuaW5kZXgtMV07XHJcblx0XHRpZiAocHJldikge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wbGF5RmlsZShwcmV2KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRpZiAoZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlGaWxlID0gKGZpbGVUb1BsYXkpID0+IHtcclxuXHRcdGlmICghZmlsZVRvUGxheSkgcmV0dXJuO1xyXG5cdFx0aWYgKHRoaXMuc3RhdGUucGF1c2VkVHJhY2sgPT09IGZpbGVUb1BsYXkpIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3BhdXNlZFRyYWNrOiBudWxsfSk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Zm9yIChsZXQgZmlsZSBvZiB0aGlzLnN0YXRlLmZpbGVzKSB7XHJcblx0XHRcdFx0ZmlsZS5hdWRpby5zdG9wKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGZpbGVUb1BsYXkuYXVkaW8uZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGZpbGVUb1BsYXkucmVhZCh0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dGhpcy5mb3JjZVVwZGF0ZSgpO1xyXG5cdH1cclxuXHRyZW5kZXIgPSAoKSA9PiB7XHJcblx0XHRpZiAoIXRoaXMuc3RhdGUuZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdHJldHVybiA8cD5Ecm9wIG11c2ljITwvcD47XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRsZXQgZmlsZUVsZW1lbnRzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZ1bmN0aW9uIG9uY2xpY2soKSB7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUoZmlsZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiA8bGkgXHJcblx0XHRcdFx0Y2xhc3NOYW1lPXtmaWxlLmF1ZGlvLnBsYXlpbmcgPyBcInBsYXlpbmdcIiA6IFwiXCJ9XHJcblx0XHRcdFx0b25DbGljaz17b25jbGlja31cclxuXHRcdFx0XHRrZXk9e1wiZmlsZS1rZXktXCIraW5kZXh9XHJcblx0XHRcdFx0ZGF0YS1pZD17aW5kZXh9XHJcblx0XHRcdFx0ZHJhZ2dhYmxlPVwidHJ1ZVwiXHJcblx0XHRcdFx0b25EcmFnRW5kPXtwYXJlbnRQbGF5bGlzdC5kcmFnRW5kfVxyXG5cdFx0XHRcdG9uRHJhZ1N0YXJ0PXtwYXJlbnRQbGF5bGlzdC5kcmFnU3RhcnR9XHJcblx0XHRcdD5cclxuXHRcdFx0XHR7ZmlsZS5kYXRhLm5hbWV9XHJcblx0XHRcdDwvbGk+XHJcblx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiB0b2dnbGVSZXBlYXRBbGwoKSB7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtyZXBlYXRBbGw6ICFwYXJlbnRQbGF5bGlzdC5zdGF0ZS5yZXBlYXRBbGx9KTtcclxuXHRcdFx0cGFyZW50UGxheWxpc3QuZm9yY2VVcGRhdGUoKTtcclxuXHRcdH1cclxuXHRcdGZ1bmN0aW9uIHRvZ2dsZVJlcGVhdEN1cnJlbnQoKSB7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtyZXBlYXRDdXJyZW50OiAhcGFyZW50UGxheWxpc3Quc3RhdGUucmVwZWF0Q3VycmVudH0pO1xyXG5cdFx0XHRwYXJlbnRQbGF5bGlzdC5mb3JjZVVwZGF0ZSgpO1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRsZXQgYWN0aXZlVHJhY2tzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoZmlsZSA9PiB7XHJcblx0XHRcdGlmIChmaWxlLmF1ZGlvLnBsYXlpbmcpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmlsZTtcclxuXHRcdFx0fVxyXG5cdFx0fSkuZmlsdGVyKGxpc3RJdGVtID0+IChsaXN0SXRlbSkpO1xyXG5cclxuXHRcdGxldCBjdXJyZW50VHJhY2sgPSBhY3RpdmVUcmFja3MubGVuZ3RoID8gYWN0aXZlVHJhY2tzWzBdIDogbnVsbDtcclxuXHJcblx0XHRmdW5jdGlvbiBwYXVzZUFsbCgpIHtcclxuXHRcdFx0aWYgKGFjdGl2ZVRyYWNrcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IGFjdGl2ZVRyYWNrc1swXX0pO1xyXG5cdFx0XHRcdGFjdGl2ZVRyYWNrcy5mb3JFYWNoKGZpbGUgPT4ge1xyXG5cdFx0XHRcdFx0ZmlsZS5hdWRpby5wYXVzZSgpXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3QuZm9yY2VVcGRhdGUoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZnVuY3Rpb24gcGxheVBhdXNlZCgpIHtcclxuXHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUocGFyZW50UGxheWxpc3Quc3RhdGUucGF1c2VkVHJhY2spO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBwbGF5cGF1c2UgPSBudWxsO1xyXG5cclxuXHRcdGlmICghYWN0aXZlVHJhY2tzLmxlbmd0aCAmJiB0aGlzLnN0YXRlLnBhdXNlZFRyYWNrID09PSBudWxsKSB7XHJcblx0XHRcdHBsYXlwYXVzZSA9IDxidXR0b24+Tm90aGluZyBwbGF5aW5nLi4uPC9idXR0b24+XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cGxheXBhdXNlID0gKHRoaXMuc3RhdGUucGF1c2VkVHJhY2sgIT09IG51bGwpID8gPGJ1dHRvbiBvbkNsaWNrPXtwbGF5UGF1c2VkfT5QbGF5PC9idXR0b24+IDogPGJ1dHRvbiBvbkNsaWNrPXtwYXVzZUFsbH0+UGF1c2U8L2J1dHRvbj47XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuKFxyXG5cdFx0XHQ8ZGl2PlxyXG5cdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPXt0aGlzLnN0YXRlLnJlcGVhdEFsbCA/IFwiZW5hYmxlZEJ1dHRvblwiIDogXCJcIn0gb25DbGljaz17dG9nZ2xlUmVwZWF0QWxsfT5SZXBlYXQgYWxsPC9idXR0b24+XHJcblx0XHRcdFx0PGJ1dHRvbiBjbGFzc05hbWU9e3RoaXMuc3RhdGUucmVwZWF0Q3VycmVudCA/IFwiZW5hYmxlZEJ1dHRvblwiIDogXCJcIn0gb25DbGljaz17dG9nZ2xlUmVwZWF0Q3VycmVudH0+UmVwZWF0IGN1cnJlbnQ8L2J1dHRvbj5cclxuXHRcdFx0XHQ8ZGl2PlxyXG5cdFx0XHRcdFx0PGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpe3BhcmVudFBsYXlsaXN0LnBsYXlQcmV2VHJhY2soY3VycmVudFRyYWNrKX19PlByZXZpb3VzPC9idXR0b24+XHJcblx0XHRcdFx0XHR7cGxheXBhdXNlfVxyXG5cdFx0XHRcdFx0PGJ1dHRvbiBvbkNsaWNrPXtmdW5jdGlvbigpe3BhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2soY3VycmVudFRyYWNrKX19Pk5leHQ8L2J1dHRvbj5cclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0XHQ8cHJvZ3Jlc3MgcmVmPVwic2Vla2JhclwiIHZhbHVlPVwiMFwiIG1heD1cIjFcIj48L3Byb2dyZXNzPlxyXG5cdFx0XHRcdDx1bCByZWY9XCJ0cmFja2xpc3RcIj5cclxuXHRcdFx0XHRcdHtmaWxlRWxlbWVudHN9XHJcblx0XHRcdFx0PC91bD5cclxuXHRcdFx0PC9kaXY+XHJcblx0XHQpO1xyXG5cclxuXHR9XHJcbn1cclxuUmVhY3RET00ucmVuZGVyKDxXZWJQbGF5bGlzdCBkcm9wem9uZT17d2luZG93fSAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWItcGxheWxpc3Qtd3JhcFwiKSk7Il19
