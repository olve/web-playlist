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

			if (relY > height) {
				_this.nodePlacement = "after";
				parent.insertBefore(placeholderLi, event.target.nextElementSibling);
			} else if (relY < height) {
				_this.nodePlacement = "before";
				parent.insertBefore(placeholderLi, event.target);
			}
			parent.insertBefore(placeholderLi, event.target);
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
					null,
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBLElBQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7O0FBRXZELFNBQVMsa0JBQWtCLENBQUMsS0FBSyxFQUFFO0FBQ2xDLEtBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxPQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6QyxXQUFPLElBQUksQ0FBQztJQUNmO0dBQ0o7RUFDUDtBQUNFLFFBQU8sS0FBSyxDQUFDO0NBQ2hCOztBQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsYUFBYSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7O0lBRWxDLElBQUk7V0FBSixJQUFJOztBQUNULFVBREssSUFBSSxHQUNLO3dCQURULElBQUk7O3FFQUFKLElBQUk7O1FBY1QsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUNJO0FBQ0osV0FBTyxLQUFLLENBQUM7SUFDYjtHQUNEOztRQUNELFNBQVMsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN0QixTQUFLLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ25DLFFBQUssQ0FBQyxZQUFZLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQztBQUMxQyxRQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0dBQzdEOztRQUNELE9BQU8sR0FBRyxVQUFDLEtBQUssRUFBSztBQUNwQixTQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUNyQyxTQUFLLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDOztBQUVuRCxPQUFJLEtBQUssR0FBRyxNQUFLLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDN0IsT0FBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQUssT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQyxPQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBSyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3RDLE9BQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztBQUNwQixRQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QyxTQUFLLFFBQVEsQ0FBQyxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0FBQzlCLFNBQUssV0FBVyxFQUFFLENBQUM7R0FDbkI7O1FBQ0QsUUFBUSxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3JCLE9BQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2hDO0FBQ0QsUUFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3ZCLFNBQUssT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0FBQ3BDLE9BQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksYUFBYSxFQUFFLE9BQU87QUFDcEQsU0FBSyxJQUFJLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQzs7QUFFekIsT0FBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFLLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDL0MsT0FBSSxNQUFNLEdBQUcsTUFBSyxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztBQUN4QyxPQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQzs7QUFFckMsT0FBSSxJQUFJLEdBQUcsTUFBTSxFQUFFO0FBQ2xCLFVBQUssYUFBYSxHQUFHLE9BQU8sQ0FBQztBQUM3QixVQUFNLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDcEUsTUFDSSxJQUFJLElBQUksR0FBRyxNQUFNLEVBQUU7QUFDdkIsVUFBSyxhQUFhLEdBQUcsUUFBUSxDQUFDO0FBQzlCLFVBQU0sQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqRDtBQUNELFNBQU0sQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztHQUVqRDs7UUFDRCxTQUFTLEdBQUcsVUFBQyxLQUFLO1VBQUssTUFBSyxXQUFXLENBQUMsS0FBSyxDQUFDO0dBQUE7O1FBQzlDLFNBQVMsR0FBRyxVQUFDLEtBQUs7VUFBSyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUM7R0FBQTs7UUFDOUMsSUFBSSxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ2pCLE9BQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUMvQixXQUFPLE1BQUssV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CO0FBQ0QsT0FBSSxNQUFLLEtBQUssQ0FBQyxJQUFJLEVBQUU7QUFDcEIsVUFBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZCO0FBQ0QsUUFBSyxHQUFHLE1BQUssV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hDLFFBQUssQ0FBQyxZQUFZLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQzs7QUFFdkMsT0FBSSxjQUFjLFFBQU8sQ0FBQzs7QUFFMUIsUUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RSxRQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3ZDLFNBQUksS0FBSyxHQUFHO0FBQ1gsVUFBSSxFQUFFLFFBQVE7QUFDZCxXQUFLLEVBQUUsSUFBSTtBQUNYLFlBQU0sRUFBRSxJQUFJO0FBQ1osYUFBTyxFQUFFLEtBQUs7QUFDZCxXQUFLLEVBQUUsY0FBYyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTTtBQUN4QyxpQkFBVyxFQUFFLHFCQUFTLGFBQWEsRUFBRTtBQUNwQyxXQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFFO0FBQ3pCLFlBQUksSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUMzRCxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7QUFBQyxBQUdwRCxZQUFJLGFBQWEsRUFBRTtBQUNsQix1QkFBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM5QjtRQUNEO09BQ0Q7QUFDRCxVQUFJLEVBQUUsY0FBUyxhQUFhLEVBQUU7QUFDN0IsV0FBSSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUMzQyxhQUFNLENBQUMsU0FBUyxHQUFHLENBQUEsVUFBUyxPQUFPLEVBQUU7QUFDcEMsWUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQzNCLFlBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDaEMsY0FBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25CLENBQUEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDYixhQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUM5QjtNQUNELENBQUE7QUFDRCxXQUFLLFFBQVEsQ0FBQyxFQUFDLEtBQUssRUFBRSxNQUFLLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7S0FDekQ7SUFDRDtHQUNEOztRQUNELGlCQUFpQixHQUFHLFlBQU07QUFDekIsT0FBSSxRQUFRLEdBQUcsTUFBSyxLQUFLLENBQUMsUUFBUSxDQUFDO0FBQ25DLE9BQUksUUFBUSxFQUFFO0FBQ2IsWUFBUSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxNQUFLLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM5RCxZQUFRLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLE1BQUssUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzVELFlBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsTUFBSyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDOUQsWUFBUSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxNQUFLLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwRDtHQUNEOztRQUNELG9CQUFvQixHQUFHLFlBQU07QUFDNUIsT0FBSSxRQUFRLEdBQUcsTUFBSyxLQUFLLENBQUMsUUFBUSxDQUFDO0FBQ25DLE9BQUksUUFBUSxFQUFFO0FBQ2IsWUFBUSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxNQUFLLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNqRSxZQUFRLENBQUMsbUJBQW1CLENBQUMsVUFBVSxFQUFFLE1BQUssUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQy9ELFlBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsTUFBSyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDakUsWUFBUSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxNQUFLLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2RDtHQUNEOztRQUNELFFBQVEsR0FBRyxVQUFDLFVBQVUsRUFBSztBQUMxQixPQUFJLEtBQUssR0FBRyxNQUFLLEtBQUssQ0FBQyxLQUFLLENBQUM7Ozs7OztBQUM3Qix5QkFBaUIsS0FBSyw4SEFBRTtTQUFmLElBQUk7O0FBQ1osU0FBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2pCLFVBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDbkIsVUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7TUFDckI7S0FDRDs7Ozs7Ozs7Ozs7Ozs7OztBQUNELE9BQUksVUFBVSxDQUFDLEtBQUssS0FBSyxJQUFJLEVBQUU7QUFDOUIsY0FBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN4QixjQUFVLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUMxQixVQUFLLFFBQVEsQ0FBQyxFQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQztJQUMxQyxNQUNJO0FBQ0osY0FBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QjtBQUNELFNBQUssV0FBVyxFQUFFLENBQUM7R0FDbkI7O1FBQ0QsTUFBTSxHQUFHLFlBQU07QUFDZCxPQUFJLENBQUMsTUFBSyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUM3QixXQUFPOzs7O0tBQWtCLENBQUM7SUFDMUI7O0FBRUQsT0FBSSxjQUFjLFFBQU8sQ0FBQzs7QUFFMUIsT0FBSSxLQUFLLEdBQUcsTUFBSyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUksRUFBRSxLQUFLLEVBQUs7QUFDakQsYUFBUyxPQUFPLEdBQUc7QUFDbEIsbUJBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDOUI7O0FBRUQsV0FBTzs7O0FBQ04sZUFBUyxFQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxHQUFHLEVBQUUsQUFBQztBQUN6QyxhQUFPLEVBQUUsT0FBTyxBQUFDO0FBQ2pCLFNBQUcsRUFBRSxXQUFXLEdBQUMsS0FBSyxBQUFDO0FBQ3ZCLGlCQUFTLEtBQUssQUFBQztBQUNmLGVBQVMsRUFBQyxNQUFNO0FBQ2hCLGVBQVMsRUFBRSxjQUFjLENBQUMsT0FBTyxBQUFDO0FBQ2xDLGlCQUFXLEVBQUUsY0FBYyxDQUFDLFNBQVMsQUFBQzs7S0FFckMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO0tBQ1gsQ0FBQTtJQUNMLENBQUMsQ0FBQzs7QUFFSCxVQUNDOzs7SUFDQzs7OztLQUFrQixNQUFLLEtBQUssQ0FBQyxNQUFNO0tBQUs7SUFDeEM7OztLQUNFLEtBQUs7S0FDRjtJQUNBLENBQ0w7R0FFRjs7QUFoTEEsUUFBSyxLQUFLLEdBQUc7QUFDWixRQUFLLEVBQUUsRUFBRTtBQUNULFNBQU0sRUFBRSxDQUFDLENBQUM7R0FDVixDQUFBOztFQUNEOztjQVJJLElBQUk7OzhCQVNHLEtBQUssRUFBRTtBQUNsQixRQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDeEIsUUFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3ZCLFVBQU8sS0FBSyxDQUFDO0dBQ2I7OztRQWJJLElBQUk7R0FBUyxLQUFLLENBQUMsU0FBUzs7QUFzTGxDLFFBQVEsQ0FBQyxNQUFNLENBQUMsb0JBQUMsSUFBSSxJQUFDLFFBQVEsRUFBRSxNQUFNLEFBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IFdPUktFUl9GSUxFUkVBREVSID0gXCIuL0ZpbGVSZWFkZXJTeW5jX3dvcmtlci5qc1wiO1xyXG5cclxuZnVuY3Rpb24gZXZlbnRDb250YWluc0ZpbGVzKGV2ZW50KSB7XHJcblx0aWYgKGV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcykge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIudHlwZXNbaV0gPT09IFwiRmlsZXNcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblx0fVxyXG4gICAgcmV0dXJuIGZhbHNlO1x0XHRcdFxyXG59XHJcblxyXG5sZXQgcGxhY2Vob2xkZXJMaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxucGxhY2Vob2xkZXJMaS5jbGFzc05hbWUgPSBcInBsYWNlaG9sZGVyXCI7XHJcblxyXG5jbGFzcyBUZXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0dGhpcy5zdGF0ZSA9IHtcclxuXHRcdFx0ZmlsZXM6IFtdLFxyXG5cdFx0XHRhY3RpdmU6IC0xLFxyXG5cdFx0fVxyXG5cdH1cclxuXHRjYW5jZWxFdmVudChldmVudCkge1xyXG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0cmV0dXJuIGV2ZW50O1xyXG5cdH1cclxuXHRidWJibGVFdmVudCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJldHVybiBldmVudDtcclxuXHRcdH1cclxuXHR9XHJcblx0ZHJhZ1N0YXJ0ID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG5cdFx0ZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIjtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9odG1sXCIsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xyXG5cdH1cclxuXHRkcmFnRW5kID0gKGV2ZW50KSA9PiB7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuXHRcdHRoaXMuZHJhZ2dlZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBsYWNlaG9sZGVyTGkpO1xyXG5cclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblx0XHRsZXQgZnJvbSA9IE51bWJlcih0aGlzLmRyYWdnZWQuZGF0YXNldC5pZCk7XHJcblx0XHRsZXQgdG8gPSBOdW1iZXIodGhpcy5vdmVyLmRhdGFzZXQuaWQpO1xyXG5cdFx0aWYgKGZyb20gPCB0bykgdG8tLTtcclxuXHRcdGZpbGVzLnNwbGljZSh0bywgMCwgZmlsZXMuc3BsaWNlKGZyb20sIDEpWzBdKTtcclxuXHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiBmaWxlc30pO1xyXG5cdFx0dGhpcy5mb3JjZVVwZGF0ZSgpO1xyXG5cdH1cclxuXHRkcmFnT3ZlciA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKGV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpOztcclxuXHRcdH1cclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHR0aGlzLmRyYWdnZWQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdFx0aWYgKGV2ZW50LnRhcmdldC5jbGFzc05hbWUgPT0gXCJwbGFjZWhvbGRlclwiKSByZXR1cm47XHJcblx0XHR0aGlzLm92ZXIgPSBldmVudC50YXJnZXQ7XHJcblxyXG5cdFx0bGV0IHJlbFkgPSBldmVudC5jbGllbnRZIC0gdGhpcy5vdmVyLm9mZnNldFRvcDtcclxuXHRcdGxldCBoZWlnaHQgPSB0aGlzLm92ZXIub2Zmc2V0SGVpZ2h0IC8gMjtcclxuXHRcdGxldCBwYXJlbnQgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcblx0XHRpZiAocmVsWSA+IGhlaWdodCkge1xyXG5cdFx0XHR0aGlzLm5vZGVQbGFjZW1lbnQgPSBcImFmdGVyXCI7XHJcblx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0Lm5leHRFbGVtZW50U2libGluZyk7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmIChyZWxZIDwgaGVpZ2h0KSB7XHJcblx0XHRcdHRoaXMubm9kZVBsYWNlbWVudCA9IFwiYmVmb3JlXCI7XHJcblx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHRcdH1cclxuXHRcdHBhcmVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXJMaSwgZXZlbnQudGFyZ2V0KTtcclxuXHJcblx0fVxyXG5cdGRyYWdFbnRlciA9IChldmVudCkgPT4gdGhpcy5idWJibGVFdmVudChldmVudCk7XHJcblx0ZHJhZ0xlYXZlID0gKGV2ZW50KSA9PiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHRkcm9wID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAoIWV2ZW50Q29udGFpbnNGaWxlcyhldmVudCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY2FuY2VsRXZlbnQoZXZlbnQpO1x0XHRcdFxyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMucHJvcHMuZHJvcCkge1xyXG5cdFx0XHR0aGlzLnByb3BzLmRyb3AoZXZlbnQpO1xyXG5cdFx0fVxyXG5cdFx0ZXZlbnQgPSB0aGlzLmNhbmNlbEV2ZW50KGV2ZW50KTtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gXCJjb3B5XCI7XHJcblxyXG5cdFx0bGV0IHBhcmVudFBsYXlsaXN0ID0gdGhpcztcclxuXHJcblx0XHRmb3IgKGxldCBpID0gMCwgZmlsZURhdGE7IGZpbGVEYXRhID0gZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGZpbGVEYXRhLnR5cGUuc3RhcnRzV2l0aChcImF1ZGlvL1wiKSkge1xyXG5cdFx0XHRcdGxldCBfZmlsZSA9IHtcclxuXHRcdFx0XHRcdGRhdGE6IGZpbGVEYXRhLFxyXG5cdFx0XHRcdFx0YXVkaW86IG51bGwsXHJcblx0XHRcdFx0XHRidWZmZXI6IG51bGwsXHJcblx0XHRcdFx0XHRwbGF5aW5nOiBmYWxzZSxcclxuXHRcdFx0XHRcdGluZGV4OiBwYXJlbnRQbGF5bGlzdC5zdGF0ZS5maWxlcy5sZW5ndGgsXHJcblx0XHRcdFx0XHRjcmVhdGVBdWRpbzogZnVuY3Rpb24ocGxheVdoZW5SZWFkeSkge1xyXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5idWZmZXIgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgYmxvYiA9IG5ldyBCbG9iKFt0aGlzLmJ1ZmZlcl0sIHt0eXBlOiB0aGlzLmRhdGEudHlwZX0pO1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYXVkaW8gPSBuZXcgQXVkaW8oW1VSTC5jcmVhdGVPYmplY3RVUkwoYmxvYildKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0Ly9wYXJlbnRQbGF5bGlzdC5mb3JjZVVwZGF0ZSgpO1xyXG5cdFx0XHRcdFx0XHRcdGlmIChwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRQbGF5bGlzdC5wbGF5RmlsZSh0aGlzKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRyZWFkOiBmdW5jdGlvbihwbGF5V2hlblJlYWR5KSB7XHJcblx0XHRcdFx0XHRcdGxldCB3b3JrZXIgPSBuZXcgV29ya2VyKFdPUktFUl9GSUxFUkVBREVSKTtcclxuXHRcdFx0XHRcdFx0d29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmJ1ZmZlciA9IG1lc3NhZ2UuZGF0YTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmNyZWF0ZUF1ZGlvKHBsYXlXaGVuUmVhZHkpO1xyXG5cdFx0XHRcdFx0XHRcdHdvcmtlci50ZXJtaW5hdGUoKTtcclxuXHRcdFx0XHRcdFx0fS5iaW5kKHRoaXMpO1xyXG5cdFx0XHRcdFx0XHR3b3JrZXIucG9zdE1lc3NhZ2UodGhpcy5kYXRhKTtcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB0aGlzLnN0YXRlLmZpbGVzLmNvbmNhdChbX2ZpbGVdKX0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudERpZE1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50ID0gKCkgPT4ge1xyXG5cdFx0bGV0IGRyb3B6b25lID0gdGhpcy5wcm9wcy5kcm9wem9uZTtcclxuXHRcdGlmIChkcm9wem9uZSkge1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuZHJhZ0VudGVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmRyYWdPdmVyLCBmYWxzZSk7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgdGhpcy5kcmFnTGVhdmUsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgdGhpcy5kcm9wLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHBsYXlGaWxlID0gKGZpbGVUb1BsYXkpID0+IHtcclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXM7XHJcblx0XHRmb3IgKGxldCBmaWxlIG9mIGZpbGVzKSB7XHJcblx0XHRcdGlmIChmaWxlLnBsYXlpbmcpIHtcclxuXHRcdFx0XHRmaWxlLmF1ZGlvLnBhdXNlKCk7XHJcblx0XHRcdFx0ZmlsZS5wbGF5aW5nID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChmaWxlVG9QbGF5LmF1ZGlvICE9PSBudWxsKSB7XHJcblx0XHRcdGZpbGVUb1BsYXkuYXVkaW8ucGxheSgpO1xyXG5cdFx0XHRmaWxlVG9QbGF5LnBsYXlpbmcgPSB0cnVlO1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHthY3RpdmU6IGZpbGVUb1BsYXkuaW5kZXh9KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRmaWxlVG9QbGF5LnJlYWQodHJ1ZSk7XHJcblx0XHR9XHJcblx0XHR0aGlzLmZvcmNlVXBkYXRlKCk7XHJcblx0fVxyXG5cdHJlbmRlciA9ICgpID0+IHtcclxuXHRcdGlmICghdGhpcy5zdGF0ZS5maWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0cmV0dXJuIDxwPkRyb3AgbXVzaWMhPC9wPjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcGFyZW50UGxheWxpc3QgPSB0aGlzO1xyXG5cclxuXHRcdGxldCBmaWxlcyA9IHRoaXMuc3RhdGUuZmlsZXMubWFwKChmaWxlLCBpbmRleCkgPT4ge1xyXG5cdFx0XHRmdW5jdGlvbiBvbmNsaWNrKCkge1xyXG5cdFx0XHRcdHBhcmVudFBsYXlsaXN0LnBsYXlGaWxlKGZpbGUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gPGxpIFxyXG5cdFx0XHRcdGNsYXNzTmFtZT17ZmlsZS5wbGF5aW5nID8gXCJwbGF5aW5nXCIgOiBcIlwifVxyXG5cdFx0XHRcdG9uQ2xpY2s9e29uY2xpY2t9XHJcblx0XHRcdFx0a2V5PXtcImZpbGUta2V5LVwiK2luZGV4fVxyXG5cdFx0XHRcdGRhdGEtaWQ9e2luZGV4fVxyXG5cdFx0XHRcdGRyYWdnYWJsZT1cInRydWVcIlxyXG5cdFx0XHRcdG9uRHJhZ0VuZD17cGFyZW50UGxheWxpc3QuZHJhZ0VuZH1cclxuXHRcdFx0XHRvbkRyYWdTdGFydD17cGFyZW50UGxheWxpc3QuZHJhZ1N0YXJ0fVxyXG5cdFx0XHQ+XHJcblx0XHRcdFx0e2ZpbGUuZGF0YS5uYW1lfVxyXG5cdFx0XHQ8L2xpPlxyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuKFxyXG5cdFx0XHQ8ZGl2PlxyXG5cdFx0XHRcdDxwPmFjdGl2ZSBpbmRleDoge3RoaXMuc3RhdGUuYWN0aXZlfTwvcD5cclxuXHRcdFx0XHQ8dWw+XHJcblx0XHRcdFx0XHR7ZmlsZXN9XHJcblx0XHRcdFx0PC91bD5cclxuXHRcdFx0PC9kaXY+XHJcblx0XHQpO1xyXG5cclxuXHR9XHJcbn1cclxuUmVhY3RET00ucmVuZGVyKDxUZXN0IGRyb3B6b25lPXt3aW5kb3d9IC8+LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIndlYi1wbGF5bGlzdC13cmFwXCIpKTsiXX0=
