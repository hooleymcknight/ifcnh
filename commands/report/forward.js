const buildReportMessage = (content) => {
    let body = `# REPORT RECEIVED\n\n`;
    body += `**User being reported:** ${content.who}\n\n`;
    body += content.from ? `-# Report from: <@${content.from}>\n\n` : '-# Submitted anonymously\n\n';
    body += `## What happened:\n\n`;
    body += content.what;

    return {
        content: body,
        files: content.pics?.map((x) => x.url) || [],
        allowedMentions: { users: content.from ? [content.from] : [] },
    };
};

const describeMissing = (pics) =>
    [...pics.values()]
        .map((p) => `- ${p.name} (${Math.round(p.size / 1024)}kb)`)
        .join('\n');

const forwardReport = async (client, fields, userId) => {
    const reportContent = {
        who: fields.getTextInputValue('userToReportInput'),
        what: fields.getTextInputValue('contentInput'),
        pics: fields.getUploadedFiles('screenshot'),
        from: userId,
    };

    const channel = await client.channels.fetch(process.env.REPORTS_CHANNEL_ID);
    const payload = buildReportMessage(reportContent);

    try {
        await channel.send(payload);
        return { ok: true, filesAttached: payload.files.length };
    } catch (err) {
        if (!payload.files.length) throw err;

        console.error('Report send failed with attachments:', err);

        await channel.send({
            ...payload,
            files: [],
            content:
                `${payload.content}\n\n` +
                `-# Attachments failed to upload and are lost. Originals were:\n` +
                describeMissing(reportContent.pics),
        });

        return { ok: true, filesAttached: 0, degraded: true };
    }
};

module.exports = { forwardReport };