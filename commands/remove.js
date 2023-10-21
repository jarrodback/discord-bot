export default async function handleRemoveCommand(interaction, player) {
    await interaction.deferReply();

    if (!interaction.member.voice.channelId)
        return await interaction.reply({
            content: "You are not in a voice channel!",
            ephemeral: true,
        });
    if (
        interaction.guild.members.me.voice.channelId &&
        interaction.member.voice.channelId !==
            interaction.guild.members.me.voice.channelId
    )
        return await interaction.reply({
            content: "You are not in my voice channel!",
            ephemeral: true,
        });

    let queue = player.queues.get(interaction.guild.id);

    if (queue) {
        const trackNumberToRemove = interaction.options.getNumber("number") - 1;

        queue.remove(queue.tracks[trackNumberToRemove]);
    }

    return interaction.deleteReply();
}
