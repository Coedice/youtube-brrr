# YouTube Go Brrr

A Chrome extension that speeds up YouTube videos with customisable playback speeds based on your preset rules.

## Features

- **Default Speed**: Set a default playback speed
- **Genre Speeds**: Customise speeds by video genre
- **Channel Speeds**: Override all other speeds for specific YouTube channels
- **Priority System**: Channel → Genre → Default speed
- **Disable for specific videos**: Disable playback speed-up for specific YouTube videos

## Installation

### For End Users

1. Clone or download this repository
2. Open `chrome://extensions/` in your browser
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the project directory

### For Development

Clone and install dependencies:

```bash
git clone <repo-url>
cd youtube-brrr
make install
```

Load the extension in Chrome:

- Open `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the project directory

## Usage

### Opening the Extension

Click the YouTube Go Brrr icon in your Chrome toolbar to open the settings popup.

### Setting Default Speed

1. Enter your preferred playback speed
2. Click "Save Default"

### Managing Genre Speeds

Genre speeds override the default speed if the video belongs to that genre.

1. Enter a genre name (e.g. "Music", "Comedy")
2. Enter the desired playback speed
3. Click "Add Genre"
4. To remove a genre, click the "Delete" button next to it

### Managing Channel Speeds

Channel speeds override the default and genre speeds if the video is from that channel.

1. Enter a YouTube channel name
2. Enter the desired playback speed
3. Click "Add Channel"
4. To remove a channel, click the "Delete" button next to it

## Speed Priority

The extension applies speeds in this order:

1. **Channel Speed** (highest priority): Specific YouTube channel
2. **Genre Speed** (middle priority): Video genre/category
3. **Default Speed** (lowest priority): Applied to all videos

## Available Commands

| Command | Purpose |
| ------- | ------- |
| `make install` | Install dependencies |
| `make test` | Run unit tests with coverage |
| `make lint` | Run linter |
| `make format` | Format code with Prettier |
| `make clean` | Clean build artifacts |
| `make help` | Show help |
