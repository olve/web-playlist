class Test extends React.Component {
	constructor() {
		super();
	}
	cancelEvent(event) {
		event.stopPropagation();
		event.preventDefault();
		return event;
	}
	bubbleEvent = (event) => {
		if (!this.props.bubble) {
			return this.cancelEvent(event);
		}
		return event;
	}
	dragEnter = (event) => {
		if (this.props.dragEnter) {
			this.props.dragEnter(event);
		}
		return this.bubbleEvent(event);		
	}
	dragOver = (event) => {
		if (this.props.dragOver) {
			this.props.dragOver(event);
		}
		return this.bubbleEvent(event);
	}
	dragLeave = (event) => {
		if (this.props.dragLeave) {
			this.props.dragLeave(event);
		}
		return this.bubbleEvent(event);
	}
	drop = (event) => {
		if (this.props.drop) {
			this.props.drop(event);
		}
		if (!event.dataTransfer.files.length) return; //user dropped something other than files, stop handling event
		event = this.cancelEvent(event);
		event.dataTransfer.dropEffect = "copy";
		for (var i = 0, fileData; fileData = event.dataTransfer.files[i]; i++) {
			console.log(fileData);
		}
	}
	componentDidMount = () => {
		let dropzone = this.props.dropzone;
		if (dropzone) {
			dropzone.addEventListener("dragenter", this.dragEnter, false);
			dropzone.addEventListener("dragover", this.dragOver, false);
			dropzone.addEventListener("dragleave", this.dragLeave, false);
			dropzone.addEventListener("drop", this.drop, false);
		}
	}
	componentWillUnmount = () => {
		let dropzone = this.props.dropzone;
		if (dropzone) {
			dropzone.removeEventListener("dragenter", this.dragEnter, false);
			dropzone.removeEventListener("dragover", this.dragOver, false);
			dropzone.removeEventListener("dragleave", this.dragLeave, false);
			dropzone.removeEventListener("drop", this.drop, false);
		}
	}
	render() {
		return <div>drop files </div>;
	}
}
ReactDOM.render(<Test dropzone={window} />, document.getElementById("web-playlist-wrap"));