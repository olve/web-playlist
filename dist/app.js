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

var Test = (function (_React$Component) {
	_inherits(Test, _React$Component);

	function Test() {
		_classCallCheck(this, Test);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Test).call(this));

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
			_this.setState({ files: files });
			_this.forceUpdate();
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
						index: parentPlaylist.state.files.length,
						createAudio: function createAudio(playWhenReady) {
							if (this.buffer !== null) {
								var blob = new Blob([this.buffer], { type: this.data.type });
								this.audio = new Audio([URL.createObjectURL(blob)]);

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
				_this.setState({ active: fileToPlay.index });
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
						className: file.playing ? "playing" : "",
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

			return React.createElement(
				"div",
				null,
				React.createElement(
					"p",
					null,
					"active index: ",
					_this.state.active
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
			active: -1
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0FBRXZELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLElBQUk7V0FBSixJQUFJOztBQUNULFVBREssSUFBSSxHQUNLO3dCQURULElBQUk7O3FFQUFKLElBQUk7O1FBY1QsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFBQUss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LE1BQU0sQUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgV09SS0VSX0ZJTEVSRUFERVIgPSBcIi4vRmlsZVJlYWRlclN5bmNfd29ya2VyLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBldmVudENvbnRhaW5zRmlsZXMoZXZlbnQpIHtcclxuXHRpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudC5kYXRhVHJhbnNmZXIudHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlc1tpXSA9PT0gXCJGaWxlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHR9XHJcbiAgICByZXR1cm4gZmFsc2U7XHRcdFx0XHJcbn1cclxuXHJcbmxldCBwbGFjZWhvbGRlckxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG5wbGFjZWhvbGRlckxpLmNsYXNzTmFtZSA9IFwicGxhY2Vob2xkZXJcIjtcclxuXHJcbmNsYXNzIFRlc3QgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHJcblx0XHR0aGlzLnN0YXRlID0ge1xyXG5cdFx0XHRmaWxlczogW10sXHJcblx0XHRcdGFjdGl2ZTogLTEsXHJcblx0XHR9XHJcblx0fVxyXG5cdGNhbmNlbEV2ZW50KGV2ZW50KSB7XHJcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0fVxyXG5cdGJ1YmJsZUV2ZW50ID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGV2ZW50O1xyXG5cdFx0fVxyXG5cdH1cclxuXHRkcmFnU3RhcnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwibW92ZVwiO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0L2h0bWxcIiwgZXZlbnQuY3VycmVudFRhcmdldCk7XHJcblx0fVxyXG5cdGRyYWdFbmQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXJMaSk7XHJcblxyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGxldCBmcm9tID0gTnVtYmVyKHRoaXMuZHJhZ2dlZC5kYXRhc2V0LmlkKTtcclxuXHRcdGxldCB0byA9IE51bWJlcih0aGlzLm92ZXIuZGF0YXNldC5pZCk7XHJcblx0XHRpZiAoZnJvbSA8IHRvKSB0by0tO1xyXG5cdFx0ZmlsZXMuc3BsaWNlKHRvLCAwLCBmaWxlcy5zcGxpY2UoZnJvbSwgMSlbMF0pO1xyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IGZpbGVzfSk7XHJcblx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7XHJcblx0fVxyXG5cdGRyYWdPdmVyID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7O1xyXG5cdFx0fVxyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblx0XHRpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTmFtZSA9PSBcInBsYWNlaG9sZGVyXCIpIHJldHVybjtcclxuXHRcdHRoaXMub3ZlciA9IGV2ZW50LnRhcmdldDtcclxuXHJcblx0XHRsZXQgcmVsWSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLm92ZXIub2Zmc2V0VG9wO1xyXG5cdFx0bGV0IGhlaWdodCA9IHRoaXMub3Zlci5vZmZzZXRIZWlnaHQgLyAyO1xyXG5cdFx0bGV0IHBhcmVudCA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuXHRcdGlmIChwYXJlbnQgPT09IHRoaXMucmVmcy50cmFja2xpc3QpIHtcclxuXHRcdFx0aWYgKHJlbFkgPiBoZWlnaHQpIHtcclxuXHRcdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImFmdGVyXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQubmV4dEVsZW1lbnRTaWJsaW5nKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChyZWxZIDwgaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJiZWZvcmVcIjtcclxuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyTGksIGV2ZW50LnRhcmdldCk7XHJcblx0XHRcdH1cclxuXHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0ZHJhZ0VudGVyID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcmFnTGVhdmUgPSAoZXZlbnQpID0+IHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdGRyb3AgPSAoZXZlbnQpID0+IHtcclxuXHRcdGlmICghZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHRcdFx0XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5wcm9wcy5kcm9wKSB7XHJcblx0XHRcdHRoaXMucHJvcHMuZHJvcChldmVudCk7XHJcblx0XHR9XHJcblx0XHRldmVudCA9IHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcImNvcHlcIjtcclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwLCBmaWxlRGF0YTsgZmlsZURhdGEgPSBldmVudC5kYXRhVHJhbnNmZXIuZmlsZXNbaV07IGkrKykge1xyXG5cdFx0XHRpZiAoZmlsZURhdGEudHlwZS5zdGFydHNXaXRoKFwiYXVkaW8vXCIpKSB7XHJcblx0XHRcdFx0bGV0IF9maWxlID0ge1xyXG5cdFx0XHRcdFx0ZGF0YTogZmlsZURhdGEsXHJcblx0XHRcdFx0XHRhdWRpbzogbnVsbCxcclxuXHRcdFx0XHRcdGJ1ZmZlcjogbnVsbCxcclxuXHRcdFx0XHRcdHBsYXlpbmc6IGZhbHNlLFxyXG5cdFx0XHRcdFx0aW5kZXg6IHBhcmVudFBsYXlsaXN0LnN0YXRlLmZpbGVzLmxlbmd0aCxcclxuXHRcdFx0XHRcdGNyZWF0ZUF1ZGlvOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLmJ1ZmZlciAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBibG9iID0gbmV3IEJsb2IoW3RoaXMuYnVmZmVyXSwge3R5cGU6IHRoaXMuZGF0YS50eXBlfSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpbyA9IG5ldyBBdWRpbyhbVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKV0pO1xyXG5cclxuXHRcdFx0XHRcdFx0XHQvL3BhcmVudFBsYXlsaXN0LmZvcmNlVXBkYXRlKCk7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlGaWxlKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdHJlYWQ6IGZ1bmN0aW9uKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IHdvcmtlciA9IG5ldyBXb3JrZXIoV09SS0VSX0ZJTEVSRUFERVIpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYnVmZmVyID0gbWVzc2FnZS5kYXRhO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuY3JlYXRlQXVkaW8ocGxheVdoZW5SZWFkeSk7XHJcblx0XHRcdFx0XHRcdFx0d29ya2VyLnRlcm1pbmF0ZSgpO1xyXG5cdFx0XHRcdFx0XHR9LmJpbmQodGhpcyk7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5wb3N0TWVzc2FnZSh0aGlzLmRhdGEpO1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHRoaXMuc3RhdGUuZmlsZXMuY29uY2F0KFtfZmlsZV0pfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50V2lsbFVubW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cGxheUZpbGUgPSAoZmlsZVRvUGxheSkgPT4ge1xyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGZvciAobGV0IGZpbGUgb2YgZmlsZXMpIHtcclxuXHRcdFx0aWYgKGZpbGUucGxheWluZykge1xyXG5cdFx0XHRcdGZpbGUuYXVkaW8ucGF1c2UoKTtcclxuXHRcdFx0XHRmaWxlLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGZpbGVUb1BsYXkuYXVkaW8gIT09IG51bGwpIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHRcdGZpbGVUb1BsYXkucGxheWluZyA9IHRydWU7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe2FjdGl2ZTogZmlsZVRvUGxheS5pbmRleH0pO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGZpbGVUb1BsYXkucmVhZCh0cnVlKTtcclxuXHRcdH1cclxuXHRcdHRoaXMuZm9yY2VVcGRhdGUoKTtcclxuXHR9XHJcblx0cmVuZGVyID0gKCkgPT4ge1xyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLmZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRyZXR1cm4gPHA+RHJvcCBtdXNpYyE8L3A+O1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBwYXJlbnRQbGF5bGlzdCA9IHRoaXM7XHJcblxyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcy5tYXAoKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZ1bmN0aW9uIG9uY2xpY2soKSB7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheUZpbGUoZmlsZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiA8bGkgXHJcblx0XHRcdFx0Y2xhc3NOYW1lPXtmaWxlLnBsYXlpbmcgPyBcInBsYXlpbmdcIiA6IFwiXCJ9XHJcblx0XHRcdFx0b25DbGljaz17b25jbGlja31cclxuXHRcdFx0XHRrZXk9e1wiZmlsZS1rZXktXCIraW5kZXh9XHJcblx0XHRcdFx0ZGF0YS1pZD17aW5kZXh9XHJcblx0XHRcdFx0ZHJhZ2dhYmxlPVwidHJ1ZVwiXHJcblx0XHRcdFx0b25EcmFnRW5kPXtwYXJlbnRQbGF5bGlzdC5kcmFnRW5kfVxyXG5cdFx0XHRcdG9uRHJhZ1N0YXJ0PXtwYXJlbnRQbGF5bGlzdC5kcmFnU3RhcnR9XHJcblx0XHRcdD5cclxuXHRcdFx0XHR7ZmlsZS5kYXRhLm5hbWV9XHJcblx0XHRcdDwvbGk+XHJcblx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4oXHJcblx0XHRcdDxkaXY+XHJcblx0XHRcdFx0PHA+YWN0aXZlIGluZGV4OiB7dGhpcy5zdGF0ZS5hY3RpdmV9PC9wPlxyXG5cdFx0XHRcdDx1bCByZWY9XCJ0cmFja2xpc3RcIj5cclxuXHRcdFx0XHRcdHtmaWxlc31cclxuXHRcdFx0XHQ8L3VsPlxyXG5cdFx0XHQ8L2Rpdj5cclxuXHRcdCk7XHJcblxyXG5cdH1cclxufVxyXG5SZWFjdERPTS5yZW5kZXIoPFRlc3QgZHJvcHpvbmU9e3dpbmRvd30gLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2ViLXBsYXlsaXN0LXdyYXBcIikpOyJdfQ==
