import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

const PostalMime = require("postal-mime");

async function streamToArrayBuffer(stream, streamSize) {
  let result = new Uint8Array(streamSize);
  let bytesRead = 0;
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result.set(value, bytesRead);
    bytesRead += value.length;
  }
  return result;
}

export default {
  async email(event, env, ctx) {
    const rawEmail = await streamToArrayBuffer(event.raw, event.rawSize);
    const parser = new PostalMime.default();
    const parsedEmail = await parser.parse(rawEmail);
    console.log("Mail subject: ", parsedEmail.subject);
    console.log("Mail message ID", parsedEmail.messageId);
    console.log("HTML version of Email: ", parsedEmail.html);
    console.log("Text version of Email: ", parsedEmail.text);
    if (parsedEmail.attachments.length == 0) {
      console.log("No attachments");
    } else {
      parsedEmail.attachments.forEach((att) => {
        console.log("Attachment: ", att.filename);
        console.log("Attachment disposition: ", att.disposition);
        console.log("Attachment mime type: ", att.mimeType);
        console.log("Attachment size: ", att.content.byteLength);
      });
    }

    const msg = createMimeMessage();
    msg.setSender({ name: "Auto-replier", addr: event.to });
    msg.setRecipient(event.from);
    msg.setSubject(`Re: ${parsedEmail.subject}`);
    msg.setHeader("In-Reply-To", parsedEmail.messageId);
    msg.addMessage({
      contentType: "text/plain",
      data: `This is an automated reply to your email with the subject ${parsedEmail.subject}.
Number of attachments: ${parsedEmail.attachments.length}.

good bye.`,
    });

    var message = new EmailMessage(event.to, event.from, msg.asRaw());
    await event.reply(message);
  },
};
