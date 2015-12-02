const WORKER_FILEREADER = "./FileReaderSync_worker.js";

function eventContainsFiles(event) {
	if (event.dataTransfer.types) {
        for (let i = 0; i < event.dataTransfer.types.length; i++) {
            if (event.dataTransfer.types[i] === "Files") {
                return true;
            }
        }
	}
    return false;			
}

let placeholderLi = document.createElement("li");
placeholderLi.className = "placeholder";

class Test extends React.Component {
	constructor() {
		super();

		this.state = {
			files: [],
			repeatAll: true,
			repeatCurrent: false,
		}
	}
	cancelEvent(event) {
		event.stopPropagation();
		event.preventDefault();
		return event;
	}
	bubbleEvent = (event) => {
		if (eventContainsFiles(event)) {
			return this.cancelEvent(event);
		}
		else {
			return event;
		}
	}
	dragStart = (event) => {
		this.dragged = event.currentTarget;
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/html", event.currentTarget);
	}
	dragEnd = (event) => {
		this.dragged.style.display = "block";
		this.dragged.parentNode.removeChild(placeholderLi);

		let files = this.state.files;
		let from = Number(this.dragged.dataset.id);
		let to = Number(this.over.dataset.id);
		if (from < to) to--;
		files.splice(to, 0, files.splice(from, 1)[0]);

		files.forEach((file, index) => {
			file.index = index;
		});

		this.setState({files: files});
		this.forceUpdate(); //maybe not necessary; this.setState forceUpdates?
	}
	dragOver = (event) => {
		if (eventContainsFiles(event)) {
			return this.cancelEvent(event);;
		}
		event.preventDefault();
		this.dragged.style.display = "none";
		if (event.target.className == "placeholder") return;
		this.over = event.target;

		let relY = event.clientY - this.over.offsetTop;
		let height = this.over.offsetHeight / 2;
		let parent = event.target.parentNode;

		if (parent === this.refs.tracklist) {
			if (relY > height) {
				this.nodePlacement = "after";
				parent.insertBefore(placeholderLi, event.target.nextElementSibling);
			}
			else if (relY < height) {
				this.nodePlacement = "before";
				parent.insertBefore(placeholderLi, event.target);
			}
			parent.insertBefore(placeholderLi, event.target);
		}

	}
	dragEnter = (event) => this.bubbleEvent(event);
	dragLeave = (event) => this.bubbleEvent(event);
	drop = (event) => {
		if (!eventContainsFiles(event)) {
			return this.cancelEvent(event);			
		}
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
					index: parentPlaylist.state.files.length,
					createAudio: function(playWhenReady) {
						if (this.buffer !== null) {
							let blob = new Blob([this.buffer], {type: this.data.type});
							this.audio = new Audio([URL.createObjectURL(blob)]);
							this.audio.addEventListener("ended", function() {
								this.playing = false;
								parentPlaylist.playNextTrack();
							});

							//parentPlaylist.forceUpdate();
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
	playNextTrack = () => {
		let files = this.state.files;

		let current = null;
		files.forEach(file => {
			if (file.playing) {
				current = file;
			}
		});

		if (this.state.repeatCurrent) {
			return this.playFile(current);
		}

		let next = files[current.index+1];
		if (next) {
			return this.playFile(next);
		}
		else {
			if (this.state.repeatAll) {
				return this.playFile(files[0]);
			}
		}
	}	
	playFile = (fileToPlay) => {
		if (!fileToPlay) return;
		let files = this.state.files;
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

		let parentPlaylist = this;

		let files = this.state.files.map((file, index) => {
			function onclick() {
				parentPlaylist.playFile(file);
			}

			return <li 
				className={file.playing ? "playing" : ""}
				onClick={onclick}
				key={"file-key-"+index}
				data-id={index}
				draggable="true"
				onDragEnd={parentPlaylist.dragEnd}
				onDragStart={parentPlaylist.dragStart}
			>
				{file.data.name}
			</li>
		});

		function toggleRepeatAll() {
			this.setState({repeatAll: !this.state.repeatAll});
		}
		function toggleRepeatCurrent() {
			this.setState({repeatCurrent: !this.state.repeatCurrent});
		}

		return(
			<div>
				<button onClick={toggleRepeatAll}>Repeat all</button>
				<button onClick={toggleRepeatCurrent}>Repeat current</button>
				<ul ref="tracklist">
					{files}
				</ul>
			</div>
		);

	}
}
ReactDOM.render(<Test dropzone={window} />, document.getElementById("web-playlist-wrap"));