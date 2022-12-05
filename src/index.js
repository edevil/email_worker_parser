const PostalMime = require('postal-mime');

async function streamToArrayBuffer(stream) {
	let result = new Uint8Array(0);
	const reader = stream.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}

		const newResult = new Uint8Array(result.length + value.length);
		newResult.set(result);
		newResult.set(value, result.length);
		result = newResult;
	}
	return result;
}

export default {
	async email(event, env, ctx) {
		const rawEmail = await streamToArrayBuffer(event.body);
		const parser = new PostalMime.default();
		const parsedEmail = await parser.parse(rawEmail);
		console.log("Mail subject: ", parsedEmail.subject);
		console.log("HTML version of Email: ", parsedEmail.html);
		console.log("Text version of Email: ", parsedEmail.text);
		if (parsedEmail.attachments.length == 0) {
			console.log("No attachments");
		} else {
			parsedEmail.attachments.forEach(att => {
				console.log("Attachment: ", att.filename);
				console.log("Attachment dispisition: ", att.disposition);
				console.log("Attachment mime type: ", att.mimeType);
				console.log("Attachment size: ", att.content.byteLength);
			});
		}
	},
};
