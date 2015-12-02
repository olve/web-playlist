self.onmessage = function(message) {
	let reader = new FileReaderSync();
	let buffer = reader.readAsArrayBuffer(message.data);
	postMessage(buffer);
};	