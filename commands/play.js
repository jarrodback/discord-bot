import { QueryType } from "discord-player";

export default async function handlePlayCommand(
    interaction,
    player,
    musicInterface
) {
    if (!interaction.member.voice.channelId)
        return await interaction.reply({
            content: "You are not in a voice channel!",
            ephemeral: true,
        });

    // If not in a voice channel.
    if (
        interaction.guild.members.me.voice.channelId &&
        interaction.member.voice.channelId !==
            interaction.guild.members.me.voice.channelId
    )
        return await interaction.reply({
            content: "You are not in my voice channel!",
            ephemeral: true,
        });

    // Get query.
    const query = interaction.options.getString("query");

    const queue = player.nodes.create(interaction.guild, {
        metadata: {
            channel: interaction.channel,
            requestedBy: interaction.user,
        },
        selfDeaf: true,
        leaveOnEmpty: true,
        leaveOnStop: true,
        leaveOnEndCooldown: 300000,
        leaveOnEmptyCooldown: 300000,
    });

    // verify vc connection
    try {
        if (!queue.connection)
            await queue.connect(interaction.member.voice.channel);
    } catch {
        queue.end();
        return await interaction.reply({
            content: "Could not join your voice channel!",
            ephemeral: true,
        });
    }

    await interaction.deferReply();
    const searchResult = await player.search(query, {
        requestedBy: interaction.user,
        searchEngine: QueryType.YOUTUBE,
    });
    if (!searchResult.tracks)
        return await interaction.followUp({
            content: `❌ | Track **${query}** not found!`,
        });

    searchResult.playlist
        ? queue.addTracks(searchResult.tracks)
        : queue.addTrack(searchResult.tracks[0]);

    if (!queue.playing) queue.node.play();

    musicInterface.nowPlaying(searchResult.tracks[0]);

    return interaction.deleteReply();
}
