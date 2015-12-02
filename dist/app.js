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
						audio: {
							element: null,
							playing: false,
							stop: function stop() {
								if (this.element !== null) {
									this.element.pause();
									this.element.currentTime = this.element.seekable.start(0);
									this.playing = false;
								}
							},
							play: function play() {
								if (this.element !== null) {
									this.element.play();
									this.playing = true;
								}
							},
							pause: function pause() {
								if (this.element !== null) {
									this.element.pause();
								}
							}
						},
						buffer: null,
						index: parentPlaylist.state.files.length,
						createAudio: function createAudio(playWhenReady) {
							if (this.buffer !== null) {
								var blob = new Blob([this.buffer], { type: this.data.type });
								this.audio.element = new Audio([URL.createObjectURL(blob)]);
								this.audio.element.addEventListener("ended", (function () {
									this.playing = false;
									parentPlaylist.playNextTrack(this);
								}).bind(this));

								//parentPlaylist.forceUpdate();
								if (playWhenReady) {
									parentPlaylist.playFile(this);
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

			if (_this.state.repeatCurrent) {
				return _this.playFile(current);
			}

			var next = files[current.index + 1];
			if (next) {
				return _this.playFile(next);
			} else {
				if (_this.state.repeatAll) {
					return _this.playFile(files[0]);
				}
			}
		};

		_this.playFile = function (fileToPlay) {
			if (!fileToPlay) return;
			var files = _this.state.files;
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var file = _step.value;

					if (file.audio.playing) {
						file.audio.stop();
					}
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

			var files = _this.state.files.map(function (file, index) {
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
					"ul",
					{ ref: "tracklist" },
					files
				)
			);
		};

		_this.state = {
			files: [],
			repeatAll: true,
			repeatCurrent: false
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0FBRXZELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQWVoQixXQUFXLEdBQUcsVUFBQyxLQUFLLEVBQUs7QUFDeEIsT0FBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUM5QixXQUFPLE1BQUssV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLE1BQ0k7QUFDSixXQUFPLEtBQUssQ0FBQztJQUNiO0dBQ0Q7O1FBQ0QsU0FBUyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3RCLFNBQUssT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7QUFDbkMsUUFB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LENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBQyxDQUFDLENBQUM7QUFDOUUsa0JBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM3Qjs7QUFFRCxVQUNDOzs7SUFDQzs7T0FBUSxTQUFTLEVBQUUsTUFBSyxLQUFLLENBQUMsU0FBUyxHQUFHLGVBQWUsR0FBRyxFQUFFLEFBQUMsRUFBQyxPQUFPLEVBQUUsZUFBZSxBQUFDOztLQUFvQjtJQUM3Rzs7T0FBUSxTQUFTLEVBQUUsTUFBSyxLQUFLLENBQUMsYUFBYSxHQUFHLGVBQWUsR0FBRyxFQUFFLEFBQUMsRUFBQyxPQUFPLEVBQUUsbUJBQW1CLEFBQUM7O0tBQXdCO0lBQ3pIOztPQUFJLEdBQUcsRUFBQyxXQUFXO0tBQ2pCLEtBQUs7S0FDRjtJQUNBLENBQ0w7R0FFRjs7QUF2T0EsUUFBSyxLQUFLLEdBQUc7QUFDWixRQUFLLEVBQUUsRUFBRTtBQUNULFlBQVMsRUFBRSxJQUFJO0FBQ2YsZ0JBQWEsRUFBRSxLQUFLO0dBQ3BCLENBQUE7O0VBQ0Q7O2NBVEksV0FBVzs7OEJBVUosS0FBSyxFQUFFO0FBQ2xCLFFBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN4QixRQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdkIsVUFBTyxLQUFLLENBQUM7R0FDYjs7O1FBZEksV0FBVztHQUFTLEtBQUssQ0FBQyxTQUFTOztBQTZPekMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxXQUFXLElBQUMsUUFBUSxFQUFFLE1BQU0sQUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgV09SS0VSX0ZJTEVSRUFERVIgPSBcIi4vRmlsZVJlYWRlclN5bmNfd29ya2VyLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpIHtcclxuXHRpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudC5kYXRhVHJhbnNmZXIudHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlc1tpXSA9PT0gXCJGaWxlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHR9XHJcbiAgICByZXR1cm4gZmFsc2U7XHRcdFx0XHJcbn1cclxuXHJcbmxldCBwbGFjZWhvbGRlckxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG5wbGFjZWhvbGRlckxpLmNsYXNzTmFtZSA9IFwicGxhY2Vob2xkZXJcIjtcclxuXHJcbmNsYXNzIFdlYlBsYXlsaXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0dGhpcy5zdGF0ZSA9IHtcclxuXHRcdFx0ZmlsZXM6IFtdLFxyXG5cdFx0XHRyZXBlYXRBbGw6IHRydWUsXHJcblx0XHRcdHJlcGVhdEN1cnJlbnQ6IGZhbHNlLFxyXG5cdFx0fVxyXG5cdH1cclxuXHRjYW5jZWxFdmVudChldmVudCkge1xyXG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0cmV0dXJuIGV2ZW50O1xyXG5cdH1cclxuXHRidWJibGVFdmVudCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJldHVybiBldmVudDtcclxuXHRcdH1cclxuXHR9XHJcblx0ZHJhZ1N0YXJ0ID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIjtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9odG1sXCIsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xyXG5cdH1cclxuXHRkcmFnRW5kID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuXHRcdHRoaXMuZHJhZ2dlZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBsYWNlaG9sZGVyTGkpO1xyXG5cclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblx0XHRsZXQgZnJvbSA9IE51bWJlcih0aGlzLmRyYWdnZWQuZGF0YXNldC5pZCk7XHJcblx0XHRsZXQgdG8gPSBOdW1iZXIodGhpcy5vdmVyLmRhdGFzZXQuaWQpO1xyXG5cdFx0aWYgKGZyb20gPCB0bykgdG8tLTtcclxuXHRcdGZpbGVzLnNwbGljZSh0bywgMCwgZmlsZXMuc3BsaWNlKGZyb20sIDEpWzBdKTtcclxuXHJcblx0XHRmaWxlcy5mb3JFYWNoKChmaWxlLCBpbmRleCkgPT4ge1xyXG5cdFx0XHRmaWxlLmluZGV4ID0gaW5kZXg7XHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLnNldFN0YXRlKHtmaWxlczogZmlsZXN9KTtcclxuXHRcdHRoaXMuZm9yY2VVcGRhdGUoKTsgLy9tYXliZSBub3QgbmVjZXNzYXJ5OyB0aGlzLnNldFN0YXRlIGZvcmNlVXBkYXRlcz9cclxuXHR9XHJcblx0ZHJhZ092ZXIgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmIChldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTs7XHJcblx0XHR9XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHRcdGlmIChldmVudC50YXJnZXQuY2xhc3NOYW1lID09IFwicGxhY2Vob2xkZXJcIikgcmV0dXJuO1xyXG5cdFx0dGhpcy5vdmVyID0gZXZlbnQudGFyZ2V0O1xyXG5cclxuXHRcdGxldCByZWxZID0gZXZlbnQuY2xpZW50WSAtIHRoaXMub3Zlci5vZmZzZXRUb3A7XHJcblx0XHRsZXQgaGVpZ2h0ID0gdGhpcy5vdmVyLm9mZnNldEhlaWdodCAvIDI7XHJcblx0XHRsZXQgcGFyZW50ID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XHJcblxyXG5cdFx0aWYgKHBhcmVudCA9PT0gdGhpcy5yZWZzLnRyYWNrbGlzdCkge1xyXG5cdFx0XHRpZiAocmVsWSA+IGhlaWdodCkge1xyXG5cdFx0XHRcdHRoaXMubm9kZVBsYWNlbWVudCA9IFwiYWZ0ZXJcIjtcclxuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldC5uZXh0RWxlbWVudFNpYmxpbmcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHJlbFkgPCBoZWlnaHQpIHtcclxuXHRcdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImJlZm9yZVwiO1xyXG5cdFx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldCk7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHRkcmFnRW50ZXIgPSAoZXZlbnQpID0+IHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdGRyYWdMZWF2ZSA9IChldmVudCkgPT4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0ZHJvcCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKCFldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcdFx0XHRcclxuXHRcdH1cclxuXHRcdGV2ZW50ID0gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwiY29weVwiO1xyXG5cclxuXHRcdGxldCBwYXJlbnRQbGF5bGlzdCA9IHRoaXM7XHJcblxyXG5cdFx0Zm9yIChsZXQgaSA9IDAsIGZpbGVEYXRhOyBmaWxlRGF0YSA9IGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlc1tpXTsgaSsrKSB7XHJcblx0XHRcdGlmIChmaWxlRGF0YS50eXBlLnN0YXJ0c1dpdGgoXCJhdWRpby9cIikpIHtcclxuXHRcdFx0XHRsZXQgX2ZpbGUgPSB7XHJcblx0XHRcdFx0XHRkYXRhOiBmaWxlRGF0YSxcclxuXHRcdFx0XHRcdGF1ZGlvOiB7XHJcblx0XHRcdFx0XHRcdGVsZW1lbnQ6IG51bGwsXHJcblx0XHRcdFx0XHRcdHBsYXlpbmc6IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRzdG9wOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQucGF1c2UoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSA9IHRoaXMuZWxlbWVudC5zZWVrYWJsZS5zdGFydCgwKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdFx0cGxheTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBsYXkoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRwYXVzZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBhdXNlKCk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0YnVmZmVyOiBudWxsLFxyXG5cdFx0XHRcdFx0aW5kZXg6IHBhcmVudFBsYXlsaXN0LnN0YXRlLmZpbGVzLmxlbmd0aCxcclxuXHRcdFx0XHRcdGNyZWF0ZUF1ZGlvOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLmJ1ZmZlciAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBibG9iID0gbmV3IEJsb2IoW3RoaXMuYnVmZmVyXSwge3R5cGU6IHRoaXMuZGF0YS50eXBlfSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50ID0gbmV3IEF1ZGlvKFtVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheU5leHRUcmFjayh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcykpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHQvL3BhcmVudFBsYXlsaXN0LmZvcmNlVXBkYXRlKCk7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlGaWxlKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdHJlYWQ6IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHdvcmtlciA9IG5ldyBXb3JrZXIoV09SS0VSX0ZJTEVSRUFERVIpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYnVmZmVyID0gbWVzc2FnZS5kYXRhO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY3JlYXRlQXVkaW8ocGxheVdoZW5SZWFkeSk7XHJcblx0XHRcdFx0XHRcdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5wb3N0TWVzc2FnZSh0aGlzLmRhdGEpO1xyXG5cdFx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB0aGlzLnN0YXRlLmZpbGVzLmNvbmNhdChbX2ZpbGVdKX0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudERpZE1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlOZXh0VHJhY2sgPSAoY3VycmVudCkgPT4ge1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHJcblx0XHRpZiAodGhpcy5zdGF0ZS5yZXBlYXRDdXJyZW50KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGN1cnJlbnQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBuZXh0ID0gZmlsZXNbY3VycmVudC5pbmRleCsxXTtcclxuXHRcdGlmIChuZXh0KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKG5leHQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEFsbCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnBsYXlGaWxlKGZpbGVzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cdFxyXG5cdHBsYXlGaWxlID0gKGZpbGVUb1BsYXkpID0+IHtcclxuXHRcdGlmICghZmlsZVRvUGxheSkgcmV0dXJuO1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGZvciAobGV0IGZpbGUgb2YgZmlsZXMpIHtcclxuXHRcdFx0aWYgKGZpbGUuYXVkaW8ucGxheWluZykge1xyXG5cdFx0XHRcdGZpbGUuYXVkaW8uc3RvcCgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAoZmlsZVRvUGxheS5hdWRpby5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGZpbGVUb1BsYXkucmVhZCh0cnVlKTtcclxuXHRcdH1cclxuXHRcdHRoaXMuZm9yY2VVcGRhdGUoKTtcclxuXHR9XHJcblx0cmVuZGVyID0gKCkgPT4ge1xyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLmZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRyZXR1cm4gPHA+RHJvcCBtdXNpYyE8L3A+O1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBwYXJlbnRQbGF5bGlzdCA9IHRoaXM7XHJcblxyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZ1bmN0aW9uIG9uY2xpY2soKSB7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUoZmlsZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiA8bGkgXHJcblx0XHRcdFx0Y2xhc3NOYW1lPXtmaWxlLmF1ZGlvLnBsYXlpbmcgPyBcInBsYXlpbmdcIiA6IFwiXCJ9XHJcblx0XHRcdFx0b25DbGljaz17b25jbGlja31cclxuXHRcdFx0XHRrZXk9e1wiZmlsZS1rZXktXCIraW5kZXh9XHJcblx0XHRcdFx0ZGF0YS1pZD17aW5kZXh9XHJcblx0XHRcdFx0ZHJhZ2dhYmxlPVwidHJ1ZVwiXHJcblx0XHRcdFx0b25EcmFnRW5kPXtwYXJlbnRQbGF5bGlzdC5kcmFnRW5kfVxyXG5cdFx0XHRcdG9uRHJhZ1N0YXJ0PXtwYXJlbnRQbGF5bGlzdC5kcmFnU3RhcnR9XHJcblx0XHRcdD5cclxuXHRcdFx0XHR7ZmlsZS5kYXRhLm5hbWV9XHJcblx0XHRcdDwvbGk+XHJcblx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiB0b2dnbGVSZXBlYXRBbGwoKSB7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtyZXBlYXRBbGw6ICFwYXJlbnRQbGF5bGlzdC5zdGF0ZS5yZXBlYXRBbGx9KTtcclxuXHRcdFx0cGFyZW50UGxheWxpc3QuZm9yY2VVcGRhdGUoKTtcclxuXHRcdH1cclxuXHRcdGZ1bmN0aW9uIHRvZ2dsZVJlcGVhdEN1cnJlbnQoKSB7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LnNldFN0YXRlKHtyZXBlYXRDdXJyZW50OiAhcGFyZW50UGxheWxpc3Quc3RhdGUucmVwZWF0Q3VycmVudH0pO1xyXG5cdFx0XHRwYXJlbnRQbGF5bGlzdC5mb3JjZVVwZGF0ZSgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybihcclxuXHRcdFx0PGRpdj5cclxuXHRcdFx0XHQ8YnV0dG9uIGNsYXNzTmFtZT17dGhpcy5zdGF0ZS5yZXBlYXRBbGwgPyBcImVuYWJsZWRCdXR0b25cIiA6IFwiXCJ9IG9uQ2xpY2s9e3RvZ2dsZVJlcGVhdEFsbH0+UmVwZWF0IGFsbDwvYnV0dG9uPlxyXG5cdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPXt0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQgPyBcImVuYWJsZWRCdXR0b25cIiA6IFwiXCJ9IG9uQ2xpY2s9e3RvZ2dsZVJlcGVhdEN1cnJlbnR9PlJlcGVhdCBjdXJyZW50PC9idXR0b24+XHJcblx0XHRcdFx0PHVsIHJlZj1cInRyYWNrbGlzdFwiPlxyXG5cdFx0XHRcdFx0e2ZpbGVzfVxyXG5cdFx0XHRcdDwvdWw+XHJcblx0XHRcdDwvZGl2PlxyXG5cdFx0KTtcclxuXHJcblx0fVxyXG59XHJcblJlYWN0RE9NLnJlbmRlcig8V2ViUGxheWxpc3QgZHJvcHpvbmU9e3dpbmRvd30gLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2ViLXBsYXlsaXN0LXdyYXBcIikpOyJdfQ==
