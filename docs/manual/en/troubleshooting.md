# Troubleshooting

Errors appear in red in the status bar. Click one to dismiss it.

## No sound

- **Web edition:** browsers only start audio after you interact with the page. Click ▶ or press
  Space. If the status bar says **Audio off**, audio hasn't started yet.
- Check the **Output** device in [Settings](settings.md), and that the track and master faders are
  up and nothing is muted, or soloed by mistake.
- "Audio could not start": another application may be using the device exclusively, or the device
  was disconnected. Choose it again in Settings and click **Apply**.

## Clicks, crackles or dropouts

The status bar shows how many **dropouts** happened since the device was opened.

- **Desktop:** raise the **Buffer size** in Settings.
- Close other demanding applications and browser tabs.
- Use fewer effects, or record fewer tracks at once.

## Recording problems

| Message or symptom                          | What to do                                                                                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Arm a track (●) before recording."         | Click a track's ● button first.                                                                                                                                       |
| "No audio input is available."              | Choose an **Input** in Settings. In the web edition, allow microphone access when the browser asks (check the site permissions in the address bar if you blocked it). |
| The input meter doesn't move                | Check the track's **Input** in its ⋯ menu and your interface's gain knob.                                                                                             |
| "Stop recording before changing devices."   | Stop, then change the settings.                                                                                                                                       |
| "Recording fell behind and audio was lost…" | Raise the buffer size or record fewer tracks. The take is kept but has a gap.                                                                                         |
| Recordings are out of time with the click   | [Calibrate the latency](recording.md#latency-calibration).                                                                                                            |
| "No clicks were detected…" (calibration)    | Check the loopback cable goes from an output to the selected **Loopback input**, and turn the output up.                                                              |
| Only two input channels in the browser      | A browser limitation. Use the desktop edition for more channels.                                                                                                      |

## Importing and projects

| Message or symptom         | What to do                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A file doesn't import      | Use WAV, FLAC, MP3, OGG or M4A. Some rare variants of these formats may not be supported; convert the file to WAV.                                        |
| "Missing audio …"          | A project's audio file couldn't be read. Re-import the file, or import a backup `.freedaw` file.                                                          |
| "Could not save: …"        | In the web edition, the browser may be out of storage space: delete old projects or free disk space. Export the project to keep a copy.                   |
| Projects disappeared (web) | Browser site data was cleared, or you're using a different browser or profile. Projects are stored per browser; restore from an exported `.freedaw` file. |

## Tune

- **Notes look wrong or are missing:** Tune works on one voice or instrument playing one note at a
  time. Recordings with chords, a lot of reverb or background noise analyze poorly.
- **"Tune could not analyze…" or "Tune could not render…":** close and reopen the clip in Tune.
  If it keeps happening, please report it.
- **The edits sound unnatural:** lower **Pitch center** and **Vibrato** in auto-correct, and use
  A/B to compare.

## Still stuck?

[Open an issue](https://github.com/campos20/freedaw/issues) describing what you did, what you
expected and what happened. Include the FreeDAW version (ⓘ **About**) and, for audio problems,
the **Status** section of Settings.
