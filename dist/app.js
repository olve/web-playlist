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
							this.stop = function () {
								if (this.element !== null) {
									this.element.currentTime = 0;
									this.playing = false;
								}
							};
							this.play = function () {
								if (this.element !== null) {
									this.element.play();
									this.playing = true;
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
											console.log("triggered like a tumblerina");
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0FBRXZELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQWVoQixXQUFXLEdBQUcsVUFBQyxLQUFLLEVBQUs7QUFDeEIsT0FBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUM5QixXQUFPLE1BQUssV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLE1BQ0k7QUFDSixXQUFPLEtBQUssQ0FBQztJQUNiO0dBQ0Q7O1FBQ0QsU0FBUyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3RCLFNBQUssT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7QUFDbkMsUUFB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QUFRLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBXT1JLRVJfRklMRVJFQURFUiA9IFwiLi9GaWxlUmVhZGVyU3luY193b3JrZXIuanNcIjtcclxuXHJcbmZ1bmN0aW9uIGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkge1xyXG5cdGlmIChldmVudC5kYXRhVHJhbnNmZXIudHlwZXMpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzW2ldID09PSBcIkZpbGVzXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cdH1cclxuICAgIHJldHVybiBmYWxzZTtcdFx0XHRcclxufVxyXG5cclxubGV0IHBsYWNlaG9sZGVyTGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbnBsYWNlaG9sZGVyTGkuY2xhc3NOYW1lID0gXCJwbGFjZWhvbGRlclwiO1xyXG5cclxuY2xhc3MgV2ViUGxheWxpc3QgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHJcblx0XHR0aGlzLnN0YXRlID0ge1xyXG5cdFx0XHRmaWxlczogW10sXHJcblx0XHRcdHJlcGVhdEFsbDogdHJ1ZSxcclxuXHRcdFx0cmVwZWF0Q3VycmVudDogZmFsc2UsXHJcblx0XHR9XHJcblx0fVxyXG5cdGNhbmNlbEV2ZW50KGV2ZW50KSB7XHJcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0fVxyXG5cdGJ1YmJsZUV2ZW50ID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGV2ZW50O1xyXG5cdFx0fVxyXG5cdH1cclxuXHRkcmFnU3RhcnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwibW92ZVwiO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0L2h0bWxcIiwgZXZlbnQuY3VycmVudFRhcmdldCk7XHJcblx0fVxyXG5cdGRyYWdFbmQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXJMaSk7XHJcblxyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGxldCBmcm9tID0gTnVtYmVyKHRoaXMuZHJhZ2dlZC5kYXRhc2V0LmlkKTtcclxuXHRcdGxldCB0byA9IE51bWJlcih0aGlzLm92ZXIuZGF0YXNldC5pZCk7XHJcblx0XHRpZiAoZnJvbSA8IHRvKSB0by0tO1xyXG5cdFx0ZmlsZXMuc3BsaWNlKHRvLCAwLCBmaWxlcy5zcGxpY2UoZnJvbSwgMSlbMF0pO1xyXG5cclxuXHRcdGZpbGVzLmZvckVhY2goKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZpbGUuaW5kZXggPSBpbmRleDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiBmaWxlc30pO1xyXG5cdFx0dGhpcy5mb3JjZVVwZGF0ZSgpOyAvL21heWJlIG5vdCBuZWNlc3Nhcnk7IHRoaXMuc2V0U3RhdGUgZm9yY2VVcGRhdGVzP1xyXG5cdH1cclxuXHRkcmFnT3ZlciA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpOztcclxuXHRcdH1cclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdFx0aWYgKGV2ZW50LnRhcmdldC5jbGFzc05hbWUgPT0gXCJwbGFjZWhvbGRlclwiKSByZXR1cm47XHJcblx0XHR0aGlzLm92ZXIgPSBldmVudC50YXJnZXQ7XHJcblxyXG5cdFx0bGV0IHJlbFkgPSBldmVudC5jbGllbnRZIC0gdGhpcy5vdmVyLm9mZnNldFRvcDtcclxuXHRcdGxldCBoZWlnaHQgPSB0aGlzLm92ZXIub2Zmc2V0SGVpZ2h0IC8gMjtcclxuXHRcdGxldCBwYXJlbnQgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcblx0XHRpZiAocGFyZW50ID09PSB0aGlzLnJlZnMudHJhY2tsaXN0KSB7XHJcblx0XHRcdGlmIChyZWxZID4gaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJhZnRlclwiO1xyXG5cdFx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0Lm5leHRFbGVtZW50U2libGluZyk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAocmVsWSA8IGhlaWdodCkge1xyXG5cdFx0XHRcdHRoaXMubm9kZVBsYWNlbWVudCA9IFwiYmVmb3JlXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cdGRyYWdFbnRlciA9IChldmVudCkgPT4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0ZHJhZ0xlYXZlID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcm9wID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoIWV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1x0XHRcdFxyXG5cdFx0fVxyXG5cdFx0ZXZlbnQgPSB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gXCJjb3B5XCI7XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRmb3IgKGxldCBpID0gMCwgZmlsZURhdGE7IGZpbGVEYXRhID0gZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGZpbGVEYXRhLnR5cGUuc3RhcnRzV2l0aChcImF1ZGlvL1wiKSkge1xyXG5cdFx0XHRcdGxldCBfZmlsZSA9IHtcclxuXHRcdFx0XHRcdGRhdGE6IGZpbGVEYXRhLFxyXG5cdFx0XHRcdFx0YXVkaW86IG5ldyBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50ID0gbnVsbDtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5jdXJyZW50VGltZSA9IDA7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdHRoaXMucGxheSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wbGF5KCk7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBhdXNlKCk7XHJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0YnVmZmVyOiBudWxsLFxyXG5cdFx0XHRcdFx0aW5kZXg6IHBhcmVudFBsYXlsaXN0LnN0YXRlLmZpbGVzLmxlbmd0aCxcclxuXHRcdFx0XHRcdGNyZWF0ZUF1ZGlvOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLmJ1ZmZlciAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdGxldCBibG9iID0gbmV3IEJsb2IoW3RoaXMuYnVmZmVyXSwge3R5cGU6IHRoaXMuZGF0YS50eXBlfSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50ID0gbmV3IEF1ZGlvKFtVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXSk7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50UGxheWxpc3QucGxheU5leHRUcmFjayh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHR9LmJpbmQodGhpcykpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiAocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0bGV0IG9uQ2FuUGxheSA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwidHJpZ2dlcmVkIGxpa2UgYSB0dW1ibGVyaW5hXCIpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZSh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQudHlwZSwgb25DYW5QbGF5KTtcclxuXHRcdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2FucGxheVwiLCBvbkNhblBsYXkpO1x0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0cmVhZDogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRsZXQgd29ya2VyID0gbmV3IFdvcmtlcihXT1JLRVJfRklMRVJFQURFUik7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5idWZmZXIgPSBtZXNzYWdlLmRhdGE7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5jcmVhdGVBdWRpbyhwbGF5V2hlblJlYWR5KTtcclxuXHRcdFx0XHRcdFx0XHR3b3JrZXIudGVybWluYXRlKCk7XHJcblx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0d29ya2VyLnBvc3RNZXNzYWdlKHRoaXMuZGF0YSk7XHJcblx0XHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHRoaXMuc3RhdGUuZmlsZXMuY29uY2F0KFtfZmlsZV0pfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50V2lsbFVubW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cGxheU5leHRUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cclxuXHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoY3VycmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IG5leHQgPSBmaWxlc1tjdXJyZW50LmluZGV4KzFdO1xyXG5cdFx0aWYgKG5leHQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUobmV4dCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0QWxsKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVx0XHJcblx0cGxheUZpbGUgPSAoZmlsZVRvUGxheSkgPT4ge1xyXG5cdFx0aWYgKCFmaWxlVG9QbGF5KSByZXR1cm47XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cdFx0Zm9yIChsZXQgZmlsZSBvZiBmaWxlcykge1xyXG5cdFx0XHRmaWxlLmF1ZGlvLnN0b3AoKTtcclxuXHRcdH1cclxuXHRcdGlmIChmaWxlVG9QbGF5LmF1ZGlvLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0ZmlsZVRvUGxheS5yZWFkKHRydWUpO1xyXG5cdFx0fVxyXG5cdFx0dGhpcy5mb3JjZVVwZGF0ZSgpO1xyXG5cdH1cclxuXHRyZW5kZXIgPSAoKSA9PiB7XHJcblx0XHRpZiAoIXRoaXMuc3RhdGUuZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdHJldHVybiA8cD5Ecm9wIG11c2ljITwvcD47XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzLm1hcCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZnVuY3Rpb24gb25jbGljaygpIHtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZShmaWxlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIDxsaSBcclxuXHRcdFx0XHRjbGFzc05hbWU9e2ZpbGUuYXVkaW8ucGxheWluZyA/IFwicGxheWluZ1wiIDogXCJcIn1cclxuXHRcdFx0XHRvbkNsaWNrPXtvbmNsaWNrfVxyXG5cdFx0XHRcdGtleT17XCJmaWxlLWtleS1cIitpbmRleH1cclxuXHRcdFx0XHRkYXRhLWlkPXtpbmRleH1cclxuXHRcdFx0XHRkcmFnZ2FibGU9XCJ0cnVlXCJcclxuXHRcdFx0XHRvbkRyYWdFbmQ9e3BhcmVudFBsYXlsaXN0LmRyYWdFbmR9XHJcblx0XHRcdFx0b25EcmFnU3RhcnQ9e3BhcmVudFBsYXlsaXN0LmRyYWdTdGFydH1cclxuXHRcdFx0PlxyXG5cdFx0XHRcdHtmaWxlLmRhdGEubmFtZX1cclxuXHRcdFx0PC9saT5cclxuXHRcdH0pO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHRvZ2dsZVJlcGVhdEFsbCgpIHtcclxuXHRcdFx0cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3JlcGVhdEFsbDogIXBhcmVudFBsYXlsaXN0LnN0YXRlLnJlcGVhdEFsbH0pO1xyXG5cdFx0XHRwYXJlbnRQbGF5bGlzdC5mb3JjZVVwZGF0ZSgpO1xyXG5cdFx0fVxyXG5cdFx0ZnVuY3Rpb24gdG9nZ2xlUmVwZWF0Q3VycmVudCgpIHtcclxuXHRcdFx0cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3JlcGVhdEN1cnJlbnQ6ICFwYXJlbnRQbGF5bGlzdC5zdGF0ZS5yZXBlYXRDdXJyZW50fSk7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LmZvcmNlVXBkYXRlKCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuKFxyXG5cdFx0XHQ8ZGl2PlxyXG5cdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPXt0aGlzLnN0YXRlLnJlcGVhdEFsbCA/IFwiZW5hYmxlZEJ1dHRvblwiIDogXCJcIn0gb25DbGljaz17dG9nZ2xlUmVwZWF0QWxsfT5SZXBlYXQgYWxsPC9idXR0b24+XHJcblx0XHRcdFx0PGJ1dHRvbiBjbGFzc05hbWU9e3RoaXMuc3RhdGUucmVwZWF0Q3VycmVudCA/IFwiZW5hYmxlZEJ1dHRvblwiIDogXCJcIn0gb25DbGljaz17dG9nZ2xlUmVwZWF0Q3VycmVudH0+UmVwZWF0IGN1cnJlbnQ8L2J1dHRvbj5cclxuXHRcdFx0XHQ8dWwgcmVmPVwidHJhY2tsaXN0XCI+XHJcblx0XHRcdFx0XHR7ZmlsZXN9XHJcblx0XHRcdFx0PC91bD5cclxuXHRcdFx0PC9kaXY+XHJcblx0XHQpO1xyXG5cclxuXHR9XHJcbn1cclxuUmVhY3RET00ucmVuZGVyKDxXZWJQbGF5bGlzdCBkcm9wem9uZT17d2luZG93fSAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWItcGxheWxpc3Qtd3JhcFwiKSk7Il19
