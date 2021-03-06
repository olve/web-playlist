const WORKER_FILEREADER = "static/js/FileReaderSync_worker.js";

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

class WebPlaylist extends React.Component {
	constructor() {
		super();

		this.state = {
			files: [],
			repeatAll: true,
			repeatCurrent: false,
			currentTrack: null,
			volume: 1,
			mutedVolume: 1, //sound-level to return to after unmuting. The volume was at this level when the player was muted.
			shuffle: false,
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
	};
	dragStart = (event) => {
		this.dragged = event.currentTarget;
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/html", event.currentTarget);
	};
	dragEnd = (event) => {
		this.dragged.style.display = "flex";
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
	};
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

	};
	dragEnter = (event) => this.bubbleEvent(event);
	dragLeave = (event) => this.bubbleEvent(event);
	addFile = (fileData) => {
		if (!fileData.type.startsWith("audio/")) {
			return;
		}
		let parentPlaylist = this;
		let file = {
			data: fileData,
			audio: new function() {
				this.element = null;
				this.playing = false;
				let self = this;
				function secondsToPaddedMinutes(number) {
					let minutes = Math.floor(number / 60);
					let seconds = ("0" + Math.round(number - minutes*60)).slice(-2);
					return `${minutes}:${seconds}`;
				}
				let onTimeUpdate = function() {
					parentPlaylist.refs.timepos.textContent = secondsToPaddedMinutes(this.element.currentTime);
					parentPlaylist.refs.seekBar.value = this.element.currentTime / this.element.duration;
				}.bind(this);
				let onSeekBarClick = function(event) {
					let percentage = event.offsetX / this.offsetWidth;
					self.element.currentTime = percentage * self.element.duration;
					parentPlaylist.refs.seekBar.value = percentage / 100;
				};
				this.stop = function() {
					if (this.element !== null) {
						this.element.pause();
						this.element.currentTime = 0;
						this.playing = false;
						parentPlaylist.refs.timepos.textContent = "";

						this.element.removeEventListener("timeupdate", onTimeUpdate);
						parentPlaylist.refs.seekBar.removeEventListener("click", onSeekBarClick);
					}
				};
				this.play = function() {
					if (this.element !== null) {
						this.element.play();
						this.playing = true;
						this.paused = false;

						this.element.addEventListener("timeupdate", onTimeUpdate);
						parentPlaylist.refs.seekBar.addEventListener("click", onSeekBarClick);
					}
				};
				this.pause = function() {
					if (this.element !== null) {
						this.element.pause();
						this.paused = true;
					}
				};
			},
			buffer: null,
			index: parentPlaylist.state.files.length,
			createAudio: function(playWhenReady) {
				if (this.buffer !== null) {
					let blob = new Blob([this.buffer], {type: this.data.type});
					this.audio.element = new Audio([URL.createObjectURL(blob)]);
					this.audio.element.volume = parentPlaylist.state.volume;
					this.audio.element.addEventListener("ended", function() {
						this.playing = false;
						parentPlaylist.playNextTrack(this);
						parentPlaylist.refs.seekBar.value = 0;
					}.bind(this));

					if (playWhenReady) {
						let onCanPlay = function(event) {
							parentPlaylist.playFile(this);
							this.audio.element.removeEventListener(event.type, onCanPlay);
						}.bind(this);
						this.audio.element.addEventListener("canplay", onCanPlay);
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
		this.setState({files: this.state.files.concat([file])});
	};
	addMultipleFiles = (files) => {
		for (let i = 0, fileData; fileData = files[i]; i++) {
				this.addFile(fileData);
		}
	};
	drop = (event) => {
		if (!eventContainsFiles(event)) {
			return this.cancelEvent(event);
		}
		event = this.cancelEvent(event);
		event.dataTransfer.dropEffect = "copy";
		this.addMultipleFiles(event.dataTransfer.files);
	};
	keyDown = (event) => {
		if (event.keyCode === 32) { //spacebar
			this.cancelEvent(event);
			return false;
		}
	};
	keyUp = (event) => {
		if (event.keyCode === 32) { //spacebar
			if (!this.state.files.length) return event;
			this.cancelEvent(event);
			this.playPause();
			return false;
		}
	};
	componentDidMount = () => {
		let dropzone = this.props.dropzone;
		if (dropzone) {
			dropzone.addEventListener("dragenter", this.dragEnter, false);
			dropzone.addEventListener("dragover", this.dragOver, false);
			dropzone.addEventListener("dragleave", this.dragLeave, false);
			dropzone.addEventListener("drop", this.drop, false);
			dropzone.addEventListener("keydown", this.keyDown, false);
			dropzone.addEventListener("keyup", this.keyUp, false);
		}
	};
	componentWillUnmount = () => {
		let dropzone = this.props.dropzone;
		if (dropzone) {
			dropzone.removeEventListener("dragenter", this.dragEnter, false);
			dropzone.removeEventListener("dragover", this.dragOver, false);
			dropzone.removeEventListener("dragleave", this.dragLeave, false);
			dropzone.removeEventListener("drop", this.drop, false);
			dropzone.removeEventListener("keydown", this.keyDown, false);
			dropzone.removeEventListener("keyup", this.keyDown, false);
		}
	};
	playPause = () => {
		if (this.state.currentTrack === null) {
			this.playNextTrack();
		}
		else {
			if (this.state.currentTrack.audio.paused) {
				this.playFile(this.state.currentTrack);
			}
			else {
				this.pauseCurrent();
			}
		}
	};
	playNextTrack = (current) => {
		let files = this.state.files;

		if (this.state.shuffle) {
			//consider adding a play queue, so we can generate a shuffled playlist (Fisher-Yates shuffle). This will let back/next step through the shuffled list
			return this.playFile(files[Math.floor(Math.random() * files.length)])
		}

		if (!current) {
			if (files.length) {
				return this.playFile(files[0]);
			}
		}

		if (this.state.repeatCurrent) {
			return this.playFile(current);
		}

		let next = files[current.index+1];
		if (next) {
			return this.playFile(next);
		}
		else {
			if (this.state.repeatAll && files.length) {
				return this.playFile(files[0]);
			}
		}
	};
	playPrevTrack = (current) => {
		let files = this.state.files;
		if (!current) {
			if (files.length) {
				return this.playFile(files[0]);
			}
		}
		let prev = current.index === 0 ? files[files.length-1] : files[current.index-1];
		if (prev) {
			return this.playFile(prev);
		}
		else {
			if (files.length) {
				return this.playFile(files[0]);
			}
		}
	};
	playFile = (fileToPlay) => {
		if (!fileToPlay) return;
		if (fileToPlay === this.state.currentTrack && fileToPlay.audio.playing && fileToPlay.audio.paused) {
			fileToPlay.audio.play();
			this.forceUpdate();
		}
		else {
			if (this.state.currentTrack !== null) {
				this.state.currentTrack.audio.stop();
				this.setState({currentTrack: null});
			}
			if (fileToPlay.audio.element !== null) {
				fileToPlay.audio.play();
				this.setState({currentTrack: fileToPlay});
			}
			else {
				fileToPlay.read(true);
			}
		}
	};
	pauseCurrent = () => {
		if (this.state.currentTrack !== null) {
			this.state.currentTrack.audio.pause();
			this.forceUpdate();
		}
	};
	removeFile = (fileToRemove) => {
		let files = this.state.files;

		files.splice(fileToRemove.index, 1);
		fileToRemove.audio.stop();
		fileToRemove.audio.element = null;
		fileToRemove.buffer = null;

		files.forEach((file, index) => {
			file.index = index;
		});

		this.setState({files: files});
	};
	toggleRepeat = () => {
		if (this.state.repeatAll) {
			this.setState({
				repeatAll: false,
				repeatCurrent: true,
			})
		}
		else if (this.state.repeatCurrent) {
			this.setState({
				repeatAll: false,
				repeatCurrent: false,
			})
		}
		else if (!this.state.repeatAll && !this.state.repeatCurrent) {
			this.setState({
				repeatAll: true,
				repeatCurrent: false,
			})
		}
	};
	setVolume = (volume) => {
		this.refs.volumeBar.value = volume;
		this.state.files.forEach(file => {
			if (file.audio.element !== null) {
				file.audio.element.volume = volume;
			}
		});
		this.setState({volume: volume});
	};
	toggleMute = () => {
		if (this.state.volume > 0) {
			this.setState({
				mutedVolume: this.state.volume,
			});
			this.setVolume(0);
		}
		else {
			this.setVolume(this.state.mutedVolume);
		}
	};
	addFilesFromInput = () => {
		this.addMultipleFiles(this.refs.fileInput.files);
	};
	render = () => {

		if (!this.state.files.length) {
			return (
				<div className="filedrop-prompt">
					<i className="mdi mdi-file-music"></i>
					<span>Add or drag & drop some music!</span>
					<input ref="fileInput" onChange={this.addFilesFromInput} type="file" multiple></input>
				</div>
			);
		}

		let parentPlaylist = this;

		let tracks = this.state.files.map((file, index) => {
			return <li
				className={file.audio.playing ? "playing" : ""}
				key={"file-key-"+index}
				data-id={index}
				draggable="true"
				onDragEnd={parentPlaylist.dragEnd}
				onDragStart={parentPlaylist.dragStart}
			>
				<div className="track-wrap" onClick={function() {parentPlaylist.playFile(file);}}>
					<span>{file.data.name}</span>
				</div>
				<i alt="remove from playlist" title="remove from playlist" onClick={function(){parentPlaylist.removeFile(file);}} className="mdi mdi-playlist-remove remove-from-playlist-button"></i>
			</li>
		});


		function getPlayPauseIcon() {
			if (parentPlaylist.state.currentTrack === null || (parentPlaylist.state.currentTrack && parentPlaylist.state.currentTrack.audio.paused)) {
				return "mdi mdi-play-circle playpause";
			}
			return "mdi mdi-pause-circle playpause";
		}

		function getSpeakerIcon() {
			if (parentPlaylist.state.volume > 0.5) {
				return "mdi-volume-high";
			}
			if (parentPlaylist.state.volume > 0.25) {
				return "mdi-volume-medium";
			}
			if (parentPlaylist.state.volume > 0) {
				return "mdi-volume-low";
			}
			return "mdi-volume-off";
		}

		let repeatButtonProps = function getRepeatButtonProps() {
			if (parentPlaylist.state.repeatAll) return {alt: "repeat is on", icon: "mdi mdi-repeat"};
			else if (parentPlaylist.state.repeatCurrent) return {alt: "repeating current", icon: "mdi mdi-repeat-once"};
			return {alt: "repeat is off", icon: "mdi mdi-repeat inactive"};
		}();

		return(
			<div className="web-playlist">

				<div className="tracklist-wrap">
					<ul className="tracklist" ref="tracklist">
						{tracks}
					</ul>
				</div>


				<div className="seekbar-wrap">
					<progress className="seekbar" ref="seekBar" value="0" max="1"></progress>
				</div>

				<div className="controls">

					<div className="timepos-wrap">
						<span className="timepos" ref="timepos">0:00</span>
					</div>

					<div className="controls-playback">
						<button onClick={parentPlaylist.toggleRepeat} className="repeat-button" alt={repeatButtonProps.alt} title={repeatButtonProps.alt}>
							<i className={repeatButtonProps.icon}></i>
						</button>
						<button onClick={function(){parentPlaylist.playPrevTrack(parentPlaylist.state.currentTrack)}}><i className="mdi mdi-skip-previous"></i></button>
						<button onClick={parentPlaylist.playPause}><i className={getPlayPauseIcon()}></i></button>
						<button onClick={function(){parentPlaylist.playNextTrack(parentPlaylist.state.currentTrack)}}><i className="mdi mdi-skip-next"></i></button>
						<button
							onClick={function() {parentPlaylist.setState({shuffle: !parentPlaylist.state.shuffle});}}
							alt="toggle shuffle"
							title="toggle shuffle"
							className="shuffle-button"
							>
								<i className={"mdi mdi-shuffle"+((parentPlaylist.state.shuffle) ? "" : " inactive")}></i>
						</button>
					</div>

					<div className="controls-volume">
						<div className="volumebar-wrap" onClick={function(event) {parentPlaylist.setVolume((event.pageX - event.target.offsetLeft) / event.target.offsetWidth);}}>
							<div className="volumebar-height-wrap">
								<progress className="volumebar" ref="volumeBar" value={parentPlaylist.state.volume} max="1"></progress>
							</div>
						</div>
						<button alt="toggle mute" title="toggle mute" className="toggle-mute-button" onClick={parentPlaylist.toggleMute}><i className={"mdi "+getSpeakerIcon()}></i></button>
					</div>


				</div>

			</div>
		);

	};
}
ReactDOM.render(<WebPlaylist dropzone={window} />, document.getElementById("web-playlist-wrap"));
