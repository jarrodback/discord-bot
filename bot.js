// Require the necessary discord.js classes
import dotenv from "dotenv";
import { Player, QueueRepeatMode } from "discord-player";
import { Client, GatewayIntentBits } from "discord.js";
import { env } from "node:process";

import MusicInterface from "./utilities/interface.js";
import handlePlayCommand from "./commands/play.js";
import handleRemoveCommand from "./commands/remove.js";

import * as utils from "minecraft-server-util";
import moment from "moment/moment.js";

dotenv.config();
env.DP_FORCE_YTDL_MOD = "ytdl-core";
const musicChannelId = "1032738450694217759";

let musicInterface;
let onlinePlayers = {};

// Create a new client instance.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

// Create the player instance.
const player = new Player(client, { connectionTimeout: 60000 });

player.events.on("playerStart", (queue, track) => {});

// Login to Discord with the token.
client.login(process.env.DISCORD_TOKEN);

/**
 * Client events.
 */

// On ready.
client.once("ready", () => {
    console.log("Bot has started!");

    const channel = client.channels.cache.find(
        (channel) => channel.id === musicChannelId
    );

    if (channel) {
        console.log("Loading music!");
        channel.messages.fetch().then((messages) => {
            messages.forEach((message) => {
                message.delete();
            });
        });

        channel.send("Add a song to queue using /play").then((message) => {
            musicInterface = new MusicInterface(message);

            message.edit({
                components: [musicInterface.row],
                embeds: [musicInterface.embed],
            });

            message.awaitReactions({});
        });
    }

    // const gameChannel = client.channels.cache.find(
    //     (channel) => channel.name === "game" || channel.name === "work-chat"
    // );

    // const minecraftThread = gameChannel.threads.cache.find(
    //     (x) => x.name === "minecraft"
    // );

    setInterval(() => {
        client.guilds.cache.forEach((guild) => {
            const gameChannel = guild.channels.cache.find(
                (channel) =>
                    channel.name.includes("game") ||
                    channel.name === "work-chat" ||
                    channel.name === "badman-topics"
            );
            const minecraftThread = gameChannel?.threads.cache.find(
                (x) => x.name === "minecraft"
            );

            if (minecraftThread) {
                console.log("Found the minecraft thread! - ", guild.name);

                utils
                    .queryFull("77.98.188.52")
                    .then((queryResponse) => {
                        let newOnlinePlayers = queryResponse.players.list;
                        let joined = [];
                        let left = [];

                        console.log("New player list: ", newOnlinePlayers);
                        console.log(
                            "Previous player list: ",
                            onlinePlayers["/r"]?.map((player) => player.player)
                        );

                        newOnlinePlayers.forEach((player) => {
                            if (
                                !onlinePlayers[guild.name]
                                    ?.map((x) => x.player)
                                    .includes(player)
                            ) {
                                const newPlayer = {
                                    player: player,
                                    joinedTime: moment(),
                                };
                                console.log(newPlayer.player, " has joined.");

                                joined.push(newPlayer);
                                if (!onlinePlayers[guild.name]) {
                                    onlinePlayers[guild.name] = [];
                                }
                                onlinePlayers[guild.name].push(newPlayer);
                            }
                        });

                        let updatedOnlinePlayers = null;

                        onlinePlayers[guild.name]?.forEach((player) => {
                            if (!newOnlinePlayers.includes(player.player)) {
                                // const onlinePlayer = onlinePlayers[
                                // guild.name
                                // ].find((x) => x.player === player.player);
                                const timeLeft = moment();
                                const hours = moment
                                    .utc(timeLeft.diff(player.joinedTime))
                                    .format("HH");
                                const minutes = moment
                                    .utc(timeLeft.diff(player.joinedTime))
                                    .format("mm");
                                const timePlayed = `${hours}h${minutes}m`; //[hours, minutes].join(":");

                                const leftPlayer = {
                                    player: player.player,
                                    timePlayed: timePlayed,
                                };
                                console.log(leftPlayer.player, " has left.");

                                left.push(leftPlayer);

                                updatedOnlinePlayers = onlinePlayers[
                                    guild.name
                                ].filter((onlinePlayer) => {
                                    return (
                                        onlinePlayer.player !== player.player
                                    );
                                });
                            }
                        });

                        if (updatedOnlinePlayers != null) {
                            onlinePlayers[guild.name] = updatedOnlinePlayers;
                        }

                        if (joined.length > 0) {
                            let msg = ``;
                            joined.forEach((player) => {
                                msg += player.player;

                                if (
                                    joined.indexOf(player) !==
                                    joined.length - 1
                                ) {
                                    msg += ", ";
                                }
                            });
                            msg += ` has joined the server.\n${queryResponse.players.online}/${queryResponse.players.max} online players | IP: 77.98.188.52`;
                            minecraftThread.send(msg);
                        }

                        if (left.length > 0) {
                            let msg = ``;
                            left.forEach((player) => {
                                msg += `${player.player} (${player.timePlayed})`;

                                if (left.indexOf(player) !== left.length - 1) {
                                    msg += ", ";
                                }
                            });
                            msg += ` has left the server.\n${queryResponse.players.online}/${queryResponse.players.max} online players | IP: 77.98.188.52`;
                            minecraftThread.send(msg);
                        }

                        // onlinePlayers[guild.name] = newOnlinePlayers;
                    })
                    .catch((error) => {
                        console.log("Failed to query server: ", error);
                    });
            }
        });
    }, 300000);
});

// On chat command execution (interaction).
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "play") {
        return handlePlayCommand(interaction, player, musicInterface);
    } else if (interaction.commandName === "remove") {
        return handleRemoveCommand(interaction, player);
    } else {
        const command = interaction.client.commands.get(
            interaction.commandName
        );
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        }
    }
});

// On button command execution.
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    let queue = player.queues.get(interaction.message.guild.id);

    if (interaction.customId === "playpause") {
        try {
            if (queue?.node.isPlaying()) {
                queue.node.setPaused(true);
                musicInterface.togglePause(true);
            } else if (!queue?.node.isPlaying() && queue?.tracks?.size > 0) {
                queue.node.setPaused(false);
                musicInterface.togglePause(false);
            }
        } catch (exception) {
            console.log("Error: No song playing.", exception);
        }

        return interaction.deferUpdate();
    } else if (interaction.customId === "stop") {
        try {
            queue.clear();
            queue.node.skip();

            musicInterface.stop();
        } catch (exception) {
            console.log("Error: No queue to destroy.", exception);
        }
        return interaction.deferUpdate();
    } else if (interaction.customId === "skip") {
        try {
            queue.node.skip();
            if (!queue.playing) queue.node.setPaused(false);

            if (queue.tracks.size === 0) {
                musicInterface.stop();
            }
        } catch (exception) {
            console.log("Error: No song to skip.", exception);
        }
        return interaction.deferUpdate();
    } else if (interaction.customId === "loop") {
        try {
            let loopMode;
            if (queue.repeatMode == QueueRepeatMode.OFF) {
                loopMode = QueueRepeatMode.TRACK;
            } else if (queue.repeatMode == QueueRepeatMode.TRACK) {
                loopMode = QueueRepeatMode.QUEUE;
            } else if (queue.repeatMode == QueueRepeatMode.QUEUE) {
                loopMode = QueueRepeatMode.OFF;
            }

            queue.setRepeatMode(loopMode);
            musicInterface.updateLoopText(loopMode);
        } catch (exception) {
            console.log("Error: Cannot loop.", exception);
        }
        return interaction.deferUpdate();
    }
});

/**
 * Player events.
 */

// Track start.
player.on("trackStart", (queue, track) => {
    musicInterface.nowPlaying(track);
});

player.on("queueEnd", (queue, track) => {
    musicInterface.stop();
});

player.on("trackEnd", (queue, track) => {
    musicInterface.stop();
});
