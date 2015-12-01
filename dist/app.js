(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
			if (_this.props.drop) {
				_this.props.drop(event);
			}
			if (!event.dataTransfer.files.length) return; //user dropped something other than files, stop handling event
			event = _this.cancelEvent(event);
			event.dataTransfer.dropEffect = "copy";
			for (var i = 0, fileData; fileData = event.dataTransfer.files[i]; i++) {
				console.log(fileData);
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

		return _this;
	}

	_createClass(Test, [{
		key: "cancelEvent",
		value: function cancelEvent(event) {
			event.stopPropagation();
			event.preventDefault();
			return event;
		}
	}, {
		key: "render",
		value: function render() {
			return React.createElement(
				"div",
				null,
				"drop files "
			);
		}
	}]);

	return Test;
})(React.Component);

ReactDOM.render(React.createElement(Test, { dropzone: window }), document.getElementById("web-playlist-wrap"));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyY1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztJQ0FNLElBQUk7V0FBSixJQUFJOztBQUNULFVBREssSUFBSSxHQUNLO3dCQURULElBQUk7O3FFQUFKLElBQUk7O1FBU1QsV0FBVyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3hCLE9BQUksQ0FBQyxNQUFLLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDdkIsV0FBTyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQjtBQUNELFVBQU8sS0FBSyxDQUFDO0dBQ2I7O1FBQ0QsU0FBUyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3RCLE9BQUksTUFBSyxLQUFLLENBQUMsU0FBUyxFQUFFO0FBQ3pCLFVBQUssS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QjtBQUNELFVBQU8sTUFBSyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDL0I7O1FBQ0QsUUFBUSxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3JCLE9BQUksTUFBSyxLQUFLLENBQUMsUUFBUSxFQUFFO0FBQ3hCLFVBQUssS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQjtBQUNELFVBQU8sTUFBSyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDL0I7O1FBQ0QsU0FBUyxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3RCLE9BQUksTUFBSyxLQUFLLENBQUMsU0FBUyxFQUFFO0FBQ3pCLFVBQUssS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QjtBQUNELFVBQU8sTUFBSyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDL0I7O1FBQ0QsSUFBSSxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ2pCLE9BQUksTUFBSyxLQUFLLENBQUMsSUFBSSxFQUFFO0FBQ3BCLFVBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2QjtBQUNELE9BQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsT0FBTztBQUFBLEFBQzdDLFFBQUssR0FBRyxNQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoQyxRQUFLLENBQUMsWUFBWSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUM7QUFDdkMsUUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RSxXQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RCO0dBQ0Q7O1FBQ0QsaUJBQWlCLEdBQUcsWUFBTTtBQUN6QixPQUFJLFFBQVEsR0FBRyxNQUFLLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDbkMsT0FBSSxRQUFRLEVBQUU7QUFDYixZQUFRLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLE1BQUssU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzlELFlBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsTUFBSyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDNUQsWUFBUSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxNQUFLLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM5RCxZQUFRLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQUssSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BEO0dBQ0Q7O1FBQ0Qsb0JBQW9CLEdBQUcsWUFBTTtBQUM1QixPQUFJLFFBQVEsR0FBRyxNQUFLLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDbkMsT0FBSSxRQUFRLEVBQUU7QUFDYixZQUFRLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLE1BQUssU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2pFLFlBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLEVBQUUsTUFBSyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDL0QsWUFBUSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxNQUFLLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNqRSxZQUFRLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLE1BQUssSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3ZEO0dBQ0Q7OztFQTFEQTs7Y0FISSxJQUFJOzs4QkFJRyxLQUFLLEVBQUU7QUFDbEIsUUFBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3hCLFFBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN2QixVQUFPLEtBQUssQ0FBQztHQUNiOzs7MkJBc0RRO0FBQ1IsVUFBTzs7OztJQUFzQixDQUFDO0dBQzlCOzs7UUFoRUksSUFBSTtHQUFTLEtBQUssQ0FBQyxTQUFTOztBQWtFbEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxJQUFJLElBQUMsUUFBUSxFQUFFLE1BQU0sQUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY2xhc3MgVGVzdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxuXHRjYW5jZWxFdmVudChldmVudCkge1xyXG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0cmV0dXJuIGV2ZW50O1xyXG5cdH1cclxuXHRidWJibGVFdmVudCA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKCF0aGlzLnByb3BzLmJ1YmJsZSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gZXZlbnQ7XHJcblx0fVxyXG5cdGRyYWdFbnRlciA9IChldmVudCkgPT4ge1xyXG5cdFx0aWYgKHRoaXMucHJvcHMuZHJhZ0VudGVyKSB7XHJcblx0XHRcdHRoaXMucHJvcHMuZHJhZ0VudGVyKGV2ZW50KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcdFx0XHJcblx0fVxyXG5cdGRyYWdPdmVyID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAodGhpcy5wcm9wcy5kcmFnT3Zlcikge1xyXG5cdFx0XHR0aGlzLnByb3BzLmRyYWdPdmVyKGV2ZW50KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLmJ1YmJsZUV2ZW50KGV2ZW50KTtcclxuXHR9XHJcblx0ZHJhZ0xlYXZlID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAodGhpcy5wcm9wcy5kcmFnTGVhdmUpIHtcclxuXHRcdFx0dGhpcy5wcm9wcy5kcmFnTGVhdmUoZXZlbnQpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuYnViYmxlRXZlbnQoZXZlbnQpO1xyXG5cdH1cclxuXHRkcm9wID0gKGV2ZW50KSA9PiB7XHJcblx0XHRpZiAodGhpcy5wcm9wcy5kcm9wKSB7XHJcblx0XHRcdHRoaXMucHJvcHMuZHJvcChldmVudCk7XHJcblx0XHR9XHJcblx0XHRpZiAoIWV2ZW50LmRhdGFUcmFuc2Zlci5maWxlcy5sZW5ndGgpIHJldHVybjsgLy91c2VyIGRyb3BwZWQgc29tZXRoaW5nIG90aGVyIHRoYW4gZmlsZXMsIHN0b3AgaGFuZGxpbmcgZXZlbnRcclxuXHRcdGV2ZW50ID0gdGhpcy5jYW5jZWxFdmVudChldmVudCk7XHJcblx0XHRldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwiY29weVwiO1xyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGZpbGVEYXRhOyBmaWxlRGF0YSA9IGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlc1tpXTsgaSsrKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGZpbGVEYXRhKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50RGlkTW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Y29tcG9uZW50V2lsbFVubW91bnQgPSAoKSA9PiB7XHJcblx0XHRsZXQgZHJvcHpvbmUgPSB0aGlzLnByb3BzLmRyb3B6b25lO1xyXG5cdFx0aWYgKGRyb3B6b25lKSB7XHJcblx0XHRcdGRyb3B6b25lLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5kcmFnRW50ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuZHJhZ092ZXIsIGZhbHNlKTtcclxuXHRcdFx0ZHJvcHpvbmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCB0aGlzLmRyYWdMZWF2ZSwgZmFsc2UpO1xyXG5cdFx0XHRkcm9wem9uZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AsIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmVuZGVyKCkge1xyXG5cdFx0cmV0dXJuIDxkaXY+ZHJvcCBmaWxlcyA8L2Rpdj47XHJcblx0fVxyXG59XHJcblJlYWN0RE9NLnJlbmRlcig8VGVzdCBkcm9wem9uZT17d2luZG93fSAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWItcGxheWxpc3Qtd3JhcFwiKSk7Il19
