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
									this.element.pause();
									this.element.currentTime = 0;
									this.playing = false;
								}
							};
							this.play = function () {
								if (this.element !== null) {
									this.element.play();
									this.playing = true;
									parentPlaylist.setState({ pausedTrack: null });
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
				playpause,
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0FBRXZELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLFdBQVc7V0FBWCxXQUFXOztBQUNoQixVQURLLFdBQVcsR0FDRjt3QkFEVCxXQUFXOztxRUFBWCxXQUFXOztRQWdCaEIsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFB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SyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3ZCLFVBQU8sS0FBSyxDQUFDO0dBQ2I7OztRQWZJLFdBQVc7R0FBUyxLQUFLLENBQUMsU0FBUzs7QUFtUnpDLFFBQVEsQ0FBQyxNQUFNLENBQUMsb0JBQUMsV0FBVyxJQUFDLFFBQVEsRUFBRSxNQUFNLEFBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IFdPUktFUl9GSUxFUkVBREVSID0gXCIuL0ZpbGVSZWFkZXJTeW5jX3dvcmtlci5qc1wiO1xyXG5cclxuZnVuY3Rpb24gZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSB7XHJcblx0aWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcykge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIudHlwZXNbaV0gPT09IFwiRmlsZXNcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblx0fVxyXG4gICAgcmV0dXJuIGZhbHNlO1x0XHRcdFxyXG59XHJcblxyXG5sZXQgcGxhY2Vob2xkZXJMaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxucGxhY2Vob2xkZXJMaS5jbGFzc05hbWUgPSBcInBsYWNlaG9sZGVyXCI7XHJcblxyXG5jbGFzcyBXZWJQbGF5bGlzdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cclxuXHRcdHRoaXMuc3RhdGUgPSB7XHJcblx0XHRcdGZpbGVzOiBbXSxcclxuXHRcdFx0cmVwZWF0QWxsOiB0cnVlLFxyXG5cdFx0XHRyZXBlYXRDdXJyZW50OiBmYWxzZSxcclxuXHRcdFx0cGF1c2VkVHJhY2s6IG51bGwsXHJcblx0XHR9XHJcblx0fVxyXG5cdGNhbmNlbEV2ZW50KGV2ZW50KSB7XHJcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0fVxyXG5cdGJ1YmJsZUV2ZW50ID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGV2ZW50O1xyXG5cdFx0fVxyXG5cdH1cclxuXHRkcmFnU3RhcnQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwibW92ZVwiO1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0L2h0bWxcIiwgZXZlbnQuY3VycmVudFRhcmdldCk7XHJcblx0fVxyXG5cdGRyYWdFbmQgPSAoZXZlbnQpID0+IHtcclxuXHRcdHRoaXMuZHJhZ2dlZC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG5cdFx0dGhpcy5kcmFnZ2VkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXJMaSk7XHJcblxyXG5cdFx0bGV0IGZpbGVzID0gdGhpcy5zdGF0ZS5maWxlcztcclxuXHRcdGxldCBmcm9tID0gTnVtYmVyKHRoaXMuZHJhZ2dlZC5kYXRhc2V0LmlkKTtcclxuXHRcdGxldCB0byA9IE51bWJlcih0aGlzLm92ZXIuZGF0YXNldC5pZCk7XHJcblx0XHRpZiAoZnJvbSA8IHRvKSB0by0tO1xyXG5cdFx0ZmlsZXMuc3BsaWNlKHRvLCAwLCBmaWxlcy5zcGxpY2UoZnJvbSwgMSlbMF0pO1xyXG5cclxuXHRcdGZpbGVzLmZvckVhY2goKGZpbGUsIGluZGV4KSA9PiB7XHJcblx0XHRcdGZpbGUuaW5kZXggPSBpbmRleDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiBmaWxlc30pO1xyXG5cdFx0dGhpcy5mb3JjZVVwZGF0ZSgpOyAvL21heWJlIG5vdCBuZWNlc3Nhcnk7IHRoaXMuc2V0U3RhdGUgZm9yY2VVcGRhdGVzP1xyXG5cdH1cclxuXHRkcmFnT3ZlciA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpOztcclxuXHRcdH1cclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdFx0aWYgKGV2ZW50LnRhcmdldC5jbGFzc05hbWUgPT0gXCJwbGFjZWhvbGRlclwiKSByZXR1cm47XHJcblx0XHR0aGlzLm92ZXIgPSBldmVudC50YXJnZXQ7XHJcblxyXG5cdFx0bGV0IHJlbFkgPSBldmVudC5jbGllbnRZIC0gdGhpcy5vdmVyLm9mZnNldFRvcDtcclxuXHRcdGxldCBoZWlnaHQgPSB0aGlzLm92ZXIub2Zmc2V0SGVpZ2h0IC8gMjtcclxuXHRcdGxldCBwYXJlbnQgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcblx0XHRpZiAocGFyZW50ID09PSB0aGlzLnJlZnMudHJhY2tsaXN0KSB7XHJcblx0XHRcdGlmIChyZWxZID4gaGVpZ2h0KSB7XHJcblx0XHRcdFx0dGhpcy5ub2RlUGxhY2VtZW50ID0gXCJhZnRlclwiO1xyXG5cdFx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0Lm5leHRFbGVtZW50U2libGluZyk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAocmVsWSA8IGhlaWdodCkge1xyXG5cdFx0XHRcdHRoaXMubm9kZVBsYWNlbWVudCA9IFwiYmVmb3JlXCI7XHJcblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlckxpLCBldmVudC50YXJnZXQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cdGRyYWdFbnRlciA9IChldmVudCkgPT4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0ZHJhZ0xlYXZlID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcm9wID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoIWV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1x0XHRcdFxyXG5cdFx0fVxyXG5cdFx0ZXZlbnQgPSB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gXCJjb3B5XCI7XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRmb3IgKGxldCBpID0gMCwgZmlsZURhdGE7IGZpbGVEYXRhID0gZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGZpbGVEYXRhLnR5cGUuc3RhcnRzV2l0aChcImF1ZGlvL1wiKSkge1xyXG5cdFx0XHRcdGxldCBfZmlsZSA9IHtcclxuXHRcdFx0XHRcdGRhdGE6IGZpbGVEYXRhLFxyXG5cdFx0XHRcdFx0YXVkaW86IG5ldyBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50ID0gbnVsbDtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmN1cnJlbnRUaW1lID0gMDtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wbGF5ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LnBsYXkoKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucGxheWluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IG51bGx9KTtcclxuXHRcdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZWxlbWVudC5wYXVzZSgpO1xyXG5cdFx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGJ1ZmZlcjogbnVsbCxcclxuXHRcdFx0XHRcdGluZGV4OiBwYXJlbnRQbGF5bGlzdC5zdGF0ZS5maWxlcy5sZW5ndGgsXHJcblx0XHRcdFx0XHRjcmVhdGVBdWRpbzogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5idWZmZXIgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgYmxvYiA9IG5ldyBCbG9iKFt0aGlzLmJ1ZmZlcl0sIHt0eXBlOiB0aGlzLmRhdGEudHlwZX0pO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudCA9IG5ldyBBdWRpbyhbVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKV0pO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlOZXh0VHJhY2sodGhpcyk7XHJcblx0XHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHBsYXlXaGVuUmVhZHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGxldCBvbkNhblBsYXkgPSBmdW5jdGlvbihldmVudCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZSh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5hdWRpby5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQudHlwZSwgb25DYW5QbGF5KTtcclxuXHRcdFx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2FucGxheVwiLCBvbkNhblBsYXkpO1x0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0cmVhZDogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRsZXQgd29ya2VyID0gbmV3IFdvcmtlcihXT1JLRVJfRklMRVJFQURFUik7XHJcblx0XHRcdFx0XHRcdHdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5idWZmZXIgPSBtZXNzYWdlLmRhdGE7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5jcmVhdGVBdWRpbyhwbGF5V2hlblJlYWR5KTtcclxuXHRcdFx0XHRcdFx0XHR3b3JrZXIudGVybWluYXRlKCk7XHJcblx0XHRcdFx0XHRcdH0uYmluZCh0aGlzKTtcclxuXHRcdFx0XHRcdFx0d29ya2VyLnBvc3RNZXNzYWdlKHRoaXMuZGF0YSk7XHJcblx0XHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHRoaXMuc3RhdGUuZmlsZXMuY29uY2F0KFtfZmlsZV0pfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50V2lsbFVubW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cGxheU5leHRUcmFjayA9IChjdXJyZW50KSA9PiB7XHJcblx0XHRsZXQgZmlsZXMgPSB0aGlzLnN0YXRlLmZpbGVzO1xyXG5cclxuXHRcdGlmICh0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoY3VycmVudCk7XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IG5leHQgPSBmaWxlc1tjdXJyZW50LmluZGV4KzFdO1xyXG5cdFx0aWYgKG5leHQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUobmV4dCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aWYgKHRoaXMuc3RhdGUucmVwZWF0QWxsKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucGxheUZpbGUoZmlsZXNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVx0XHJcblx0cGxheUZpbGUgPSAoZmlsZVRvUGxheSkgPT4ge1xyXG5cdFx0aWYgKCFmaWxlVG9QbGF5KSByZXR1cm47XHJcblx0XHRpZiAodGhpcy5zdGF0ZS5wYXVzZWRUcmFjayA9PT0gZmlsZVRvUGxheSkge1xyXG5cdFx0XHRmaWxlVG9QbGF5LmF1ZGlvLnBsYXkoKTtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7cGF1c2VkVHJhY2s6IG51bGx9KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRmb3IgKGxldCBmaWxlIG9mIHRoaXMuc3RhdGUuZmlsZXMpIHtcclxuXHRcdFx0XHRmaWxlLmF1ZGlvLnN0b3AoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZmlsZVRvUGxheS5hdWRpby5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0ZmlsZVRvUGxheS5hdWRpby5wbGF5KCk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0ZmlsZVRvUGxheS5yZWFkKHRydWUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7XHJcblx0fVxyXG5cdHJlbmRlciA9ICgpID0+IHtcclxuXHRcdGlmICghdGhpcy5zdGF0ZS5maWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0cmV0dXJuIDxwPkRyb3AgbXVzaWMhPC9wPjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGxldCBmaWxlRWxlbWVudHMgPSB0aGlzLnN0YXRlLmZpbGVzLm1hcCgoZmlsZSwgaW5kZXgpID0+IHtcclxuXHRcdFx0ZnVuY3Rpb24gb25jbGljaygpIHtcclxuXHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZShmaWxlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIDxsaSBcclxuXHRcdFx0XHRjbGFzc05hbWU9e2ZpbGUuYXVkaW8ucGxheWluZyA/IFwicGxheWluZ1wiIDogXCJcIn1cclxuXHRcdFx0XHRvbkNsaWNrPXtvbmNsaWNrfVxyXG5cdFx0XHRcdGtleT17XCJmaWxlLWtleS1cIitpbmRleH1cclxuXHRcdFx0XHRkYXRhLWlkPXtpbmRleH1cclxuXHRcdFx0XHRkcmFnZ2FibGU9XCJ0cnVlXCJcclxuXHRcdFx0XHRvbkRyYWdFbmQ9e3BhcmVudFBsYXlsaXN0LmRyYWdFbmR9XHJcblx0XHRcdFx0b25EcmFnU3RhcnQ9e3BhcmVudFBsYXlsaXN0LmRyYWdTdGFydH1cclxuXHRcdFx0PlxyXG5cdFx0XHRcdHtmaWxlLmRhdGEubmFtZX1cclxuXHRcdFx0PC9saT5cclxuXHRcdH0pO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHRvZ2dsZVJlcGVhdEFsbCgpIHtcclxuXHRcdFx0cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3JlcGVhdEFsbDogIXBhcmVudFBsYXlsaXN0LnN0YXRlLnJlcGVhdEFsbH0pO1xyXG5cdFx0XHRwYXJlbnRQbGF5bGlzdC5mb3JjZVVwZGF0ZSgpO1xyXG5cdFx0fVxyXG5cdFx0ZnVuY3Rpb24gdG9nZ2xlUmVwZWF0Q3VycmVudCgpIHtcclxuXHRcdFx0cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3JlcGVhdEN1cnJlbnQ6ICFwYXJlbnRQbGF5bGlzdC5zdGF0ZS5yZXBlYXRDdXJyZW50fSk7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LmZvcmNlVXBkYXRlKCk7XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGxldCBhY3RpdmVUcmFja3MgPSB0aGlzLnN0YXRlLmZpbGVzLm1hcChmaWxlID0+IHtcclxuXHRcdFx0aWYgKGZpbGUuYXVkaW8ucGxheWluZykge1xyXG5cdFx0XHRcdHJldHVybiBmaWxlO1xyXG5cdFx0XHR9XHJcblx0XHR9KS5maWx0ZXIobGlzdEl0ZW0gPT4gKGxpc3RJdGVtKSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcGF1c2VBbGwoKSB7XHJcblx0XHRcdGlmIChhY3RpdmVUcmFja3MubGVuZ3RoKSB7XHJcblx0XHRcdFx0cGFyZW50UGxheWxpc3Quc2V0U3RhdGUoe3BhdXNlZFRyYWNrOiBhY3RpdmVUcmFja3NbMF19KTtcclxuXHRcdFx0XHRhY3RpdmVUcmFja3MuZm9yRWFjaChmaWxlID0+IHtcclxuXHRcdFx0XHRcdGZpbGUuYXVkaW8ucGF1c2UoKVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHBhcmVudFBsYXlsaXN0LmZvcmNlVXBkYXRlKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGZ1bmN0aW9uIHBsYXlQYXVzZWQoKSB7XHJcblx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlGaWxlKHBhcmVudFBsYXlsaXN0LnN0YXRlLnBhdXNlZFRyYWNrKTtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcGxheXBhdXNlID0gbnVsbDtcclxuXHJcblx0XHRpZiAoIWFjdGl2ZVRyYWNrcy5sZW5ndGggJiYgdGhpcy5zdGF0ZS5wYXVzZWRUcmFjayA9PT0gbnVsbCkge1xyXG5cdFx0XHRwbGF5cGF1c2UgPSA8YnV0dG9uPk5vdGhpbmcgcGxheWluZy4uLjwvYnV0dG9uPlxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHBsYXlwYXVzZSA9ICh0aGlzLnN0YXRlLnBhdXNlZFRyYWNrICE9PSBudWxsKSA/IDxidXR0b24gb25DbGljaz17cGxheVBhdXNlZH0+UGxheTwvYnV0dG9uPiA6IDxidXR0b24gb25DbGljaz17cGF1c2VBbGx9PlBhdXNlPC9idXR0b24+O1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybihcclxuXHRcdFx0PGRpdj5cclxuXHRcdFx0XHQ8YnV0dG9uIGNsYXNzTmFtZT17dGhpcy5zdGF0ZS5yZXBlYXRBbGwgPyBcImVuYWJsZWRCdXR0b25cIiA6IFwiXCJ9IG9uQ2xpY2s9e3RvZ2dsZVJlcGVhdEFsbH0+UmVwZWF0IGFsbDwvYnV0dG9uPlxyXG5cdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPXt0aGlzLnN0YXRlLnJlcGVhdEN1cnJlbnQgPyBcImVuYWJsZWRCdXR0b25cIiA6IFwiXCJ9IG9uQ2xpY2s9e3RvZ2dsZVJlcGVhdEN1cnJlbnR9PlJlcGVhdCBjdXJyZW50PC9idXR0b24+XHJcblx0XHRcdFx0e3BsYXlwYXVzZX1cclxuXHRcdFx0XHQ8dWwgcmVmPVwidHJhY2tsaXN0XCI+XHJcblx0XHRcdFx0XHR7ZmlsZUVsZW1lbnRzfVxyXG5cdFx0XHRcdDwvdWw+XHJcblx0XHRcdDwvZGl2PlxyXG5cdFx0KTtcclxuXHJcblx0fVxyXG59XHJcblJlYWN0RE9NLnJlbmRlcig8V2ViUGxheWxpc3QgZHJvcHpvbmU9e3dpbmRvd30gLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2ViLXBsYXlsaXN0LXdyYXBcIikpOyJdfQ==
