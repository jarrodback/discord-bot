import { QueueRepeatMode } from "discord-player";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from "discord.js";

export default class MusicInterface {
    defaultImage =
        "https://img.freepik.com/free-vector/musical-notes-frame-with-text-space_1017-32857.jpg?w=2000";
    defaultThumbnail =
        "https://cdn.discordapp.com/attachments/655149798554337280/1092886029939265606/ApplicationFrameHost_Lqgrcw4HWh.gif";

    #control;
    #embed;
    #row;
    #loopText = "None";

    get control() {
        return this.#control;
    }
    set control(value) {
        this.#control = value;
    }

    get embed() {
        return this.#embed;
    }
    set embed(value) {
        this.#embed = value;
    }

    get row() {
        return this.#row;
    }

    constructor(controlMessage) {
        this.#control = controlMessage;
        this.reset();
    }

    /**
     * Reset interface.
     */
    reset() {
        this.#row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("playpause")
                .setLabel("▶")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("stop")
                .setLabel("×")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("skip")
                .setLabel("»")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("loop")
                .setLabel("⟳")
                .setStyle(ButtonStyle.Secondary)
        );

        this.#embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("/r Music Bot")
            .setThumbnail(this.defaultThumbnail)
            .setImage(this.defaultImage)
            .setFooter({ text: "No song playing" });
    }

    /**
     * Update interface to display new song.
     * @param {*} track The new track.
     */
    nowPlaying(track) {
        // if (queue.tracks?.length === 0) displayMessage += `\nNo songs in queue`;
        const displayMessage = `\n🎶 | Now playing **${track.title}**`;
        this.#control.edit(displayMessage);

        this.#embed.data.description = `Requested by ${track.requestedBy} - [Track](${track.url})`;
        this.#embed.data.footer.text = `Song playing | Looping: ${
            this.#loopText
        }`;
        this.#embed.data.footer.url = track.thumbnail;
        this.#embed.data.color = 0x9900ff;
        this.#embed.data.image.url = track.thumbnail;
        this.#embed.data.fields;

        this.#control.edit({ embeds: [this.#embed] });
    }

    /**
     * Update play/pause text.
     * @param {boolean} paused Is the queue paused.
     */
    togglePause(paused) {
        if (paused) {
            this.#embed.data.footer = {
                text: "Song paused",
            };
            this.#embed.data.color = 0xff0000;

            this.#control.edit({ embeds: [this.#embed] });
        } else {
            this.#embed.data.footer = {
                text: "Song playing",
            };
            this.#embed.data.color = 0x9900ff;

            this.#control.edit({ embeds: [this.#embed] });
        }
    }

    /**
     * Update interface to show stopped.
     */
    stop() {
        this.#embed.data.description = ``;
        this.#embed.data.footer.text = `No song playing | Looping: ${
            this.#loopText
        }`;
        this.#embed.data.footer.url = ``;
        this.#embed.data.color = 0xff0000;
        this.#embed.data.image.url = this.defaultImage;

        this.#control.edit("Add a song to queue using /play");
        this.#control.edit({ embeds: [this.#embed] });
    }

    /**
     * Update queue repeat text.
     * @param {QueueRepeatMode} QueueRepeatMode
     */
    updateLoopText(loopMode) {
        if (loopMode === QueueRepeatMode.OFF) this.#loopText = "None";
        else if (loopMode === QueueRepeatMode.TRACK) this.#loopText = "Track";
        else if (loopMode === QueueRepeatMode.QUEUE) this.#loopText = "Queue";

        this.#embed.data.footer.text = `Song playing | Looping: ${
            this.#loopText
        }`;
        this.#control.edit({ embeds: [this.#embed] });
    }
}
