const WORKER_FILEREADER = "./FileReaderSync_worker.js";

class Test extends React.Component {
	constructor() {
		super();
		this.state = {
			files: [],
		}
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
		if (!event.dataTransfer.files.length) return; //user dropped something other than files, stop handling event
		if (this.props.drop) {
			this.props.drop(event);
		}
		event = this.cancelEvent(event);
		event.dataTransfer.dropEffect = "copy";

		let parentPlaylist = this;

		for (let i = 0, fileData; fileData = event.dataTransfer.files[i]; i++) {
			if (fileData.type.startsWith("audio/")) {
				let _file = {
					data: fileData,
					audio: null,
					buffer: null,
					playing: false,
					createAudio: function(playWhenReady) {
						if (this.buffer !== null) {
							let blob = new Blob([this.buffer], {type: this.data.type});
							this.audio = new Audio([URL.createObjectURL(blob)]);

							parentPlaylist.forceUpdate();
							if (playWhenReady) {
								parentPlaylist.playFile(this);
							}
						}
					},
					read: function(playWhenReady) {
						let worker = new Worker(WORKER_FILEREADER);
						worker.onmessage = function(message) {
							this.buffer = message.data;
							this.createAudio(playWhenReady);
							worker.terminate();
						}.bind(this);
						worker.postMessage(this.data);
					},
				}
				this.setState({files: this.state.files.concat([_file])});
			}
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
	playFile = (fileToPlay) => {
		var files = this.state.files;
		for (let file of files) {
			if (file.playing) {
				file.audio.pause();
				file.playing = false;
			}
		}
		if (fileToPlay.audio !== null) {
			fileToPlay.audio.play();
			fileToPlay.playing = true;
		}
		else {
			fileToPlay.read(true);
		}
		this.forceUpdate();
	}
	render = () => {
		if (!this.state.files.length) {
			return <p>Drop music!</p>;
		}

		var parentPlaylist = this;

		let files = this.state.files.map((file, index) => {
			function onclick() {
				parentPlaylist.playFile(file);
			}

			return <li className={file.playing ? "playing" : ""} onClick={onclick} key={"file-key-"+index}>{file.data.name}</li>
		});

		return(
			<ul>
				{files}
			</ul>
		);

	}
}
ReactDOM.render(<Test dropzone={window} />, document.getElementById("web-playlist-wrap"));