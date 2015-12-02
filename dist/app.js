(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WORKER_FILEREADER = "./FileReaderSync_worker.js";

var Test = (function (_React$Component) {
	_inherits(Test, _React$Component);

	function Test() {
		_classCallCheck(this, Test);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Test).call(this));

		_this.bubbleEvent = function (event) {
			if (!_this.props.bubble) {
				return _this.cancelEvent(event);
			}
			return event;
		};

		_this.dragEnter = function (event) {
			if (_this.props.dragEnter) {
				_this.props.dragEnter(event);
			}
			return _this.bubbleEvent(event);
		};

		_this.dragOver = function (event) {
			if (_this.props.dragOver) {
				_this.props.dragOver(event);
			}
			return _this.bubbleEvent(event);
		};

		_this.dragLeave = function (event) {
			if (_this.props.dragLeave) {
				_this.props.dragLeave(event);
			}
			return _this.bubbleEvent(event);
		};

		_this.drop = function (event) {
			if (!event.dataTransfer.files.length) return; //user dropped something other than files, stop handling event
			if (_this.props.drop) {
				_this.props.drop(event);
			}
			event = _this.cancelEvent(event);
			event.dataTransfer.dropEffect = "copy";

			var parentPlaylist = _this;

			for (var i = 0, fileData; fileData = event.dataTransfer.files[i]; i++) {
				if (fileData.type.startsWith("audio/")) {
					var _file = {
						data: fileData,
						audio: null,
						buffer: null,
						playing: false,
						createAudio: function createAudio(playWhenReady) {
							if (this.buffer !== null) {
								var blob = new Blob([this.buffer], { type: this.data.type });
								this.audio = new Audio([URL.createObjectURL(blob)]);

								parentPlaylist.forceUpdate();
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

		_this.playFile = function (fileToPlay) {
			var files = _this.state.files;
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var file = _step.value;

					if (file.playing) {
						file.audio.pause();
						file.playing = false;
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

			if (fileToPlay.audio !== null) {
				fileToPlay.audio.play();
				fileToPlay.playing = true;
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
					{ className: file.playing ? "playing" : "", onClick: onclick, key: "file-key-" + index },
					file.data.name
				);
			});

			return React.createElement(
				"ul",
				null,
				files
			);
		};

		_this.state = {
			files: []
		};
		return _this;
	}

	_createClass(Test, [{
		key: "cancelEvent",
		value: function cancelEvent(event) {
			event.stopPropagation();
			event.preventDefault();
			return event;
		}
	}]);

	return Test;
})(React.Component);

ReactDOM.render(React.createElement(Test, { dropzone: window }), document.getElementById("web-playlist-wrap"));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0lBRWpELElBQUk7V0FBSixJQUFJOztBQUNULFVBREssSUFBSSxHQUNLO3dCQURULElBQUk7O3FFQUFKLElBQUk7O1FBWVQsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksQ0FBQyxNQUFLLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDdkIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQjtBQUNELFVBQU8sS0FBSyxDQUFDO0dBQ2I7O1FBQ0QsU0FBUyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3RCLE9BQUksTUFBSyxLQUFLLENBQUMsU0FBUyxFQUFFO0FBQ3pCLFVBQUssS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QjtBQUNELFVBQU8sTUFBSyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDL0I7O1FBQ0QsUUFBUSxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3JCLE9BQUksTUFBSyxLQUFLLENBQUMsUUFBUSxFQUFFO0FBQ3hCLFVBQUssS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQjtBQUNELFVBQU8sTUFBSyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDL0I7O1FBQ0QsU0FBUyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3RCLE9BQUksTUFBSyxLQUFLLENBQUMsU0FBUyxFQUFFO0FBQ3pCLFVBQUssS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QjtBQUNELFVBQU8sTUFBSyxXQUFXLENBQUMsS0FBSyxDQUFDLENB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QUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFO0FBQzdCLFdBQU87Ozs7S0FBa0IsQ0FBQztJQUMxQjs7QUFFRCxPQUFJLGNBQWMsUUFBTyxDQUFDOztBQUUxQixPQUFJLEtBQUssR0FBRyxNQUFLLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUMsSUFBSSxFQUFFLEtBQUssRUFBSztBQUNqRCxhQUFTLE9BQU8sR0FBRztBQUNsQixtQkFBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5Qjs7QUFFRCxXQUFPOztPQUFJLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsR0FBRyxFQUFFLEFBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxBQUFDLEVBQUMsR0FBRyxFQUFFLFdBQVcsR0FBQyxLQUFLLEFBQUM7S0FBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7S0FBTSxDQUFBO0lBQ3BILENBQUMsQ0FBQzs7QUFFSCxVQUNDOzs7SUFDRSxLQUFLO0lBQ0YsQ0FDSjtHQUVGOztBQW5JQSxRQUFLLEtBQUssR0FBRztBQUNaLFFBQUssRUFBRSxFQUFFO0dBQ1QsQ0FBQTs7RUFDRDs7Y0FOSSxJQUFJOzs4QkFPRyxLQUFLLEVBQUU7QUFDbEIsUUFBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3hCLFFBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN2QixVQUFPLEtBQUssQ0FBQztHQUNiOzs7UUFYSSxJQUFJO0dBQVMsS0FBSyxDQUFDLFNBQVM7O0FBd0lsQyxRQUFRLENBQUMsTUFBTSxDQUFDLG9CQUFDLElBQUksSUFBQyxRQUFRLEVBQUUsTUFBTSxBQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBXT1JLRVJfRklMRVJFQURFUiA9IFwiLi9GaWxlUmVhZGVyU3luY193b3JrZXIuanNcIjtcclxuXHJcbmNsYXNzIFRlc3QgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHRcdHRoaXMuc3RhdGUgPSB7XHJcblx0XHRcdGZpbGVzOiBbXSxcclxuXHRcdH1cclxuXHR9XHJcblx0Y2FuY2VsRXZlbnQoZXZlbnQpIHtcclxuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHJldHVybiBldmVudDtcclxuXHR9XHJcblx0YnViYmxlRXZlbnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmICghdGhpcy5wcm9wcy5idWJibGUpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGV2ZW50O1xyXG5cdH1cclxuXHRkcmFnRW50ZXIgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmICh0aGlzLnByb3BzLmRyYWdFbnRlcikge1xyXG5cdFx0XHR0aGlzLnByb3BzLmRyYWdFbnRlcihldmVudCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHRcdFxyXG5cdH1cclxuXHRkcmFnT3ZlciA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKHRoaXMucHJvcHMuZHJhZ092ZXIpIHtcclxuXHRcdFx0dGhpcy5wcm9wcy5kcmFnT3ZlcihldmVudCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0fVxyXG5cdGRyYWdMZWF2ZSA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKHRoaXMucHJvcHMuZHJhZ0xlYXZlKSB7XHJcblx0XHRcdHRoaXMucHJvcHMuZHJhZ0xlYXZlKGV2ZW50KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHR9XHJcblx0ZHJvcCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKCFldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMubGVuZ3RoKSByZXR1cm47IC8vdXNlciBkcm9wcGVkIHNvbWV0aGluZyBvdGhlciB0aGFuIGZpbGVzLCBzdG9wIGhhbmRsaW5nIGV2ZW50XHJcblx0XHRpZiAodGhpcy5wcm9wcy5kcm9wKSB7XHJcblx0XHRcdHRoaXMucHJvcHMuZHJvcChldmVudCk7XHJcblx0XHR9XHJcblx0XHRldmVudCA9IHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcImNvcHlcIjtcclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwLCBmaWxlRGF0YTsgZmlsZURhdGEgPSBldmVudC5kYXRhVHJhbnNmZXIuZmlsZXNbaV07IGkrKykge1xyXG5cdFx0XHRpZiAoZmlsZURhdGEudHlwZS5zdGFydHNXaXRoKFwiYXVkaW8vXCIpKSB7XHJcblx0XHRcdFx0bGV0IF9maWxlID0ge1xyXG5cdFx0XHRcdFx0ZGF0YTogZmlsZURhdGEsXHJcblx0XHRcdFx0XHRhdWRpbzogbnVsbCxcclxuXHRcdFx0XHRcdGJ1ZmZlcjogbnVsbCxcclxuXHRcdFx0XHRcdHBsYXlpbmc6IGZhbHNlLFxyXG5cdFx0XHRcdFx0Y3JlYXRlQXVkaW86IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYnVmZmVyICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0bGV0IGJsb2IgPSBuZXcgQmxvYihbdGhpcy5idWZmZXJdLCB7dHlwZTogdGhpcy5kYXRhLnR5cGV9KTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmF1ZGlvID0gbmV3IEF1ZGlvKFtVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LmZvcmNlVXBkYXRlKCk7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlGaWxlKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdHJlYWQ6IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHdvcmtlciA9IG5ldyBXb3JrZXIoV09SS0VSX0ZJTEVSRUFERVIpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYnVmZmVyID0gbWVzc2FnZS5kYXRhO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY3JlYXRlQXVkaW8ocGxheVdoZW5SZWFkeSk7XHJcblx0XHRcdFx0XHRcdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5wb3N0TWVzc2FnZSh0aGlzLmRhdGEpO1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHRoaXMuc3RhdGUuZmlsZXMuY29uY2F0KFtfZmlsZV0pfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50V2lsbFVubW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cGxheUZpbGUgPSAoZmlsZVRvUGxheSkgPT4ge1xyXG5cdFx0dmFyIGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGZvciAobGV0IGZpbGUgb2YgZmlsZXMpIHtcclxuXHRcdFx0aWYgKGZpbGUucGxheWluZykge1xyXG5cdFx0XHRcdGZpbGUuYXVkaW8ucGF1c2UoKTtcclxuXHRcdFx0XHRmaWxlLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGZpbGVUb1BsYXkuYXVkaW8gIT09IG51bGwpIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHRcdGZpbGVUb1BsYXkucGxheWluZyA9IHRydWU7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5yZWFkKHRydWUpO1xyXG5cdFx0fVxyXG5cdFx0dGhpcy5mb3JjZVVwZGF0ZSgpO1xyXG5cdH1cclxuXHRyZW5kZXIgPSAoKSA9PiB7XHJcblx0XHRpZiAoIXRoaXMuc3RhdGUuZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdHJldHVybiA8cD5Ecm9wIG11c2ljITwvcD47XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzLm1hcCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZnVuY3Rpb24gb25jbGljaygpIHtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZShmaWxlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIDxsaSBjbGFzc05hbWU9e2ZpbGUucGxheWluZyA/IFwicGxheWluZ1wiIDogXCJcIn0gb25DbGljaz17b25jbGlja30ga2V5PXtcImZpbGUta2V5LVwiK2luZGV4fT57ZmlsZS5kYXRhLm5hbWV9PC9saT5cclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybihcclxuXHRcdFx0PHVsPlxyXG5cdFx0XHRcdHtmaWxlc31cclxuXHRcdFx0PC91bD5cclxuXHRcdCk7XHJcblxyXG5cdH1cclxufVxyXG5SZWFjdERPTS5yZW5kZXIoPFRlc3QgZHJvcHpvbmU9e3dpbmRvd30gLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2ViLXBsYXlsaXN0LXdyYXBcIikpOyJdfQ==
