/**
 * Popup script - handles UI interactions and settings management
 */

console.log('YouTube Go Brrr popup: Script loaded');

class PopupManager {
    constructor() {
        console.log('YouTube Go Brrr popup: Constructor called');
        this.defaultSpeedInput = document.getElementById('default-speed');
        this.genreInput = document.getElementById('genre-input');
        this.genreSpeedInput = document.getElementById('genre-speed-input');
        this.addGenreBtn = document.getElementById('add-genre-btn');
        this.genreList = document.getElementById('genre-list');
        this.channelInput = document.getElementById('channel-input');
        this.channelSpeedInput = document.getElementById('channel-speed-input');
        this.addChannelBtn = document.getElementById('add-channel-btn');
        this.channelList = document.getElementById('channel-list');
        this.statusMessage = document.getElementById('status-message');
        this.videoSpeedToggle = document.getElementById('video-speed-toggle');
        this.videoSpeedControl = document.getElementById('video-speed-control');
        this.currentVideoId = null;

        console.log(
            'YouTube Go Brrr popup: Elements loaded, videoSpeedToggle:',
            this.videoSpeedToggle,
            'videoSpeedControl:',
            this.videoSpeedControl
        );

        this.init();
    }

    async init() {
        console.log('YouTube Go Brrr popup: init() called');
        this.attachEventListeners();
        await this.loadSettings();
        await this.prefillGenreFromActiveTab();
        await this.prefillChannelFromActiveTab();
        await this.loadVideoControlState();
        console.log('YouTube Go Brrr popup: init() completed');
    }

    attachEventListeners() {
        console.log('YouTube Go Brrr popup: Attaching event listeners');
        console.log('YouTube Go Brrr popup: videoSpeedToggle element:', this.videoSpeedToggle);

        this.defaultSpeedInput.addEventListener('change', () => this.handleSaveDefault());
        this.addGenreBtn.addEventListener('click', () => this.handleAddGenre());
        this.addChannelBtn.addEventListener('click', () => this.handleAddChannel());

        if (this.videoSpeedToggle) {
            this.videoSpeedToggle.addEventListener('change', (e) => {
                console.log(
                    'YouTube Go Brrr popup: Toggle change event fired, checked:',
                    e.target.checked
                );
                this.handleToggleVideoSpeed();
            });
            console.log('YouTube Go Brrr popup: Video speed toggle listener attached');
        } else {
            console.error('YouTube Go Brrr popup: videoSpeedToggle element not found!');
        }

        // Allow Enter key for inputs
        this.genreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddGenre();
        });
        this.channelInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddChannel();
        });
    }

    async loadSettings() {
        const settings = await this.getStorageSettings();

        // Load default speed
        this.defaultSpeedInput.value = this.snapSpeed(settings.defaultSpeed);

        // Load genres
        this.renderGenres(settings.genreSpeeds);

        // Load channels
        this.renderChannels(settings.channelSpeeds);
    }

    async getStorageSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(
                {
                    defaultSpeed: 2.3,
                    genreSpeeds: {
                        Music: 1,
                        Comedy: 1,
                    },
                    channelSpeeds: {},
                    disabledVideoIds: {},
                },
                resolve
            );
        });
    }

    async saveStorageSettings(settings) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(settings, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }

    renderGenres(genreSpeeds) {
        this.genreList.innerHTML = '';
        Object.entries(genreSpeeds).forEach(([genre, speed]) => {
            const safeSpeed = this.snapSpeed(speed);
            const div = document.createElement('div');
            div.className = 'genre-item';
            div.innerHTML = `
                <input type="text" class="genre-name-input" value="${this.escapeHtml(genre)}" data-original="${this.escapeHtml(genre)}">
                <input type="number" class="genre-speed-input" min="0" max="16" step="0.1" value="${safeSpeed}" data-original="${safeSpeed}">
                <span class="speed-unit">x</span>
                <div class="item-actions">
                    <button class="btn btn-delete" data-genre="${this.escapeHtml(genre)}">Delete</button>
                </div>
            `;
            const nameInput = div.querySelector('.genre-name-input');
            const speedInput = div.querySelector('.genre-speed-input');
            const deleteBtn = div.querySelector('.btn-delete');

            nameInput.addEventListener('change', () => {
                const newGenre = nameInput.value.trim();
                const newSpeed = parseFloat(speedInput.value);
                if (newGenre) {
                    this.handleUpdateGenre(genre, newGenre, newSpeed);
                } else {
                    nameInput.value = nameInput.dataset.original;
                }
            });

            speedInput.addEventListener('change', () => {
                const newGenre = nameInput.value.trim();
                const newSpeed = this.snapSpeed(parseFloat(speedInput.value));
                if (newGenre) {
                    this.handleUpdateGenre(genre, newGenre, newSpeed);
                } else {
                    speedInput.value = speedInput.dataset.original;
                }
            });

            deleteBtn.addEventListener('click', () => {
                this.handleDeleteGenre(genre);
            });

            this.genreList.appendChild(div);
        });
    }

    renderChannels(channelSpeeds) {
        this.channelList.innerHTML = '';
        Object.entries(channelSpeeds).forEach(([channel, speed]) => {
            const safeSpeed = this.snapSpeed(speed);
            const div = document.createElement('div');
            div.className = 'channel-item';
            div.innerHTML = `
                <input type="text" class="channel-name-input" value="${this.escapeHtml(channel)}" data-original="${this.escapeHtml(channel)}">
                <input type="number" class="channel-speed-input" min="0" max="16" step="0.1" value="${safeSpeed}" data-original="${safeSpeed}">
                <span class="speed-unit">x</span>
                <div class="item-actions">
                    <button class="btn btn-delete" data-channel="${this.escapeHtml(channel)}">Delete</button>
                </div>
            `;
            const nameInput = div.querySelector('.channel-name-input');
            const speedInput = div.querySelector('.channel-speed-input');
            const deleteBtn = div.querySelector('.btn-delete');

            nameInput.addEventListener('change', () => {
                const newChannel = nameInput.value.trim();
                const newSpeed = parseFloat(speedInput.value);
                if (newChannel) {
                    this.handleUpdateChannel(channel, newChannel, newSpeed);
                } else {
                    nameInput.value = nameInput.dataset.original;
                }
            });

            speedInput.addEventListener('change', () => {
                const newChannel = nameInput.value.trim();
                const newSpeed = this.snapSpeed(parseFloat(speedInput.value));
                if (newChannel) {
                    this.handleUpdateChannel(channel, newChannel, newSpeed);
                } else {
                    speedInput.value = speedInput.dataset.original;
                }
            });

            deleteBtn.addEventListener('click', () => {
                this.handleDeleteChannel(channel);
            });

            this.channelList.appendChild(div);
        });
    }

    async handleSaveDefault() {
        const speed = this.snapSpeed(parseFloat(this.defaultSpeedInput.value));

        if (isNaN(speed) || speed < 0.25 || speed > 16) {
            this.showStatus('Invalid speed. Must be between 0.25x and 16x', 'error');
            return;
        }

        try {
            const settings = await this.getStorageSettings();
            settings.defaultSpeed = speed;
            this.defaultSpeedInput.value = speed;
            await this.saveStorageSettings(settings);
            this.showStatus('Default speed saved!', 'success');
        } catch (error) {
            this.showStatus('Error saving default speed', 'error');
        }
    }

    async handleAddGenre() {
        const genre = this.genreInput.value.trim();
        const speed = this.snapSpeed(parseFloat(this.genreSpeedInput.value));
        const isEditing = !!this.editingGenreKey;

        if (!genre) {
            this.showStatus('Please enter a genre name', 'error');
            return;
        }

        if (isNaN(speed) || speed < 0.25 || speed > 16) {
            this.showStatus('Invalid speed. Must be between 0.25x and 16x', 'error');
            return;
        }

        try {
            const settings = await this.getStorageSettings();
            if (isEditing && this.editingGenreKey !== genre) {
                delete settings.genreSpeeds[this.editingGenreKey];
            }
            settings.genreSpeeds[genre] = speed;
            await this.saveStorageSettings(settings);
            this.renderGenres(settings.genreSpeeds);
            this.resetGenreForm();
            this.showStatus(`Genre "${genre}" ${isEditing ? 'updated' : 'added'}!`, 'success');
        } catch (error) {
            this.showStatus('Error adding genre', 'error');
        }
    }

    async handleUpdateGenre(oldGenre, newGenre, newSpeed) {
        if (!newGenre) {
            this.showStatus('Please enter a genre name', 'error');
            return;
        }

        if (isNaN(newSpeed) || newSpeed < 0.25 || newSpeed > 16) {
            this.showStatus('Invalid speed. Must be between 0.25x and 16x', 'error');
            return;
        }

        try {
            const settings = await this.getStorageSettings();
            if (oldGenre !== newGenre) {
                delete settings.genreSpeeds[oldGenre];
            }
            settings.genreSpeeds[newGenre] = this.snapSpeed(newSpeed);
            await this.saveStorageSettings(settings);
            this.renderGenres(settings.genreSpeeds);
            this.showStatus(`Genre "${newGenre}" updated!`, 'success');
        } catch (error) {
            this.showStatus('Error updating genre', 'error');
        }
    }

    async handleDeleteGenre(genre) {
        try {
            const settings = await this.getStorageSettings();
            delete settings.genreSpeeds[genre];
            await this.saveStorageSettings(settings);
            this.renderGenres(settings.genreSpeeds);
            this.showStatus(`Genre "${genre}" deleted!`, 'success');
        } catch (error) {
            this.showStatus('Error deleting genre', 'error');
        }
    }

    async handleAddChannel() {
        const channel = this.channelInput.value.trim();
        const speed = this.snapSpeed(parseFloat(this.channelSpeedInput.value));
        const isEditing = !!this.editingChannelKey;

        if (!channel) {
            this.showStatus('Please enter a channel name', 'error');
            return;
        }

        if (isNaN(speed) || speed < 0.25 || speed > 16) {
            this.showStatus('Invalid speed. Must be between 0.25x and 16x', 'error');
            return;
        }

        try {
            const settings = await this.getStorageSettings();
            if (isEditing && this.editingChannelKey !== channel) {
                delete settings.channelSpeeds[this.editingChannelKey];
            }
            settings.channelSpeeds[channel] = speed;
            await this.saveStorageSettings(settings);
            this.renderChannels(settings.channelSpeeds);
            this.resetChannelForm();
            this.showStatus(`Channel "${channel}" ${isEditing ? 'updated' : 'added'}!`, 'success');
        } catch (error) {
            this.showStatus('Error adding channel', 'error');
        }
    }

    async handleUpdateChannel(oldChannel, newChannel, newSpeed) {
        if (!newChannel) {
            this.showStatus('Please enter a channel name', 'error');
            return;
        }

        if (isNaN(newSpeed) || newSpeed < 0.25 || newSpeed > 16) {
            this.showStatus('Invalid speed. Must be between 0.25x and 16x', 'error');
            return;
        }

        try {
            const settings = await this.getStorageSettings();
            if (oldChannel !== newChannel) {
                delete settings.channelSpeeds[oldChannel];
            }
            settings.channelSpeeds[newChannel] = this.snapSpeed(newSpeed);
            await this.saveStorageSettings(settings);
            this.renderChannels(settings.channelSpeeds);
            this.showStatus(`Channel "${newChannel}" updated!`, 'success');
        } catch (error) {
            this.showStatus('Error updating channel', 'error');
        }
    }

    async handleDeleteChannel(channel) {
        try {
            const settings = await this.getStorageSettings();
            delete settings.channelSpeeds[channel];
            await this.saveStorageSettings(settings);
            this.renderChannels(settings.channelSpeeds);
            this.showStatus(`Channel "${channel}" deleted!`, 'success');
        } catch (error) {
            this.showStatus('Error deleting channel', 'error');
        }
    }

    async loadVideoControlState() {
        if (!chrome.tabs || !chrome.tabs.query) {
            console.log('YouTube Go Brrr popup: chrome.tabs unavailable for video control');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) {
                console.log('YouTube Go Brrr popup: No active tab');
                return;
            }

            if (!tab.url || !tab.url.includes('youtube.com')) {
                console.log('YouTube Go Brrr popup: Not on YouTube');
                return;
            }

            const response = await new Promise((resolve) => {
                chrome.tabs.sendMessage(tab.id, { action: 'getVideoId' }, (res) => {
                    if (chrome.runtime.lastError) {
                        console.log(
                            'YouTube Go Brrr popup: sendMessage error (video ID)',
                            chrome.runtime.lastError.message
                        );
                        resolve(null);
                        return;
                    }
                    resolve(res);
                });
            });

            const videoId = response && response.videoId ? response.videoId : null;
            if (!videoId) {
                console.log('YouTube Go Brrr popup: No video ID found');
                return;
            }

            this.currentVideoId = videoId;
            console.log('YouTube Go Brrr popup: Found video ID:', videoId);

            // Check if this video is disabled
            const settings = await this.getStorageSettings();
            console.log('YouTube Go Brrr popup: Full settings object:', settings);
            console.log('YouTube Go Brrr popup: disabledVideoIds:', settings.disabledVideoIds);

            // Ensure disabledVideoIds exists
            if (!settings.disabledVideoIds) {
                settings.disabledVideoIds = {};
            }

            const isDisabled = !!settings.disabledVideoIds[videoId];
            console.log('YouTube Go Brrr popup: Checking videoId:', videoId, 'in disabledVideoIds');
            console.log(
                'YouTube Go Brrr popup: settings.disabledVideoIds[videoId]:',
                settings.disabledVideoIds[videoId]
            );
            console.log('YouTube Go Brrr popup: Video disabled status:', isDisabled);
            console.log('YouTube Go Brrr popup: Setting toggle.checked to:', !isDisabled);

            // Set the toggle state BEFORE showing it
            this.videoSpeedToggle.checked = !isDisabled; // Toggle is ON when speed is ENABLED

            // Now show the control with the correct state already set
            this.videoSpeedControl.classList.add('show');
            console.log('YouTube Go Brrr popup: Control shown with correct state');
        } catch (error) {
            console.log('YouTube Go Brrr popup: loadVideoControlState error', error);
        }
    }

    async handleToggleVideoSpeed() {
        console.log('YouTube Go Brrr popup: Toggle clicked, currentVideoId:', this.currentVideoId);

        if (!this.currentVideoId) {
            console.log('YouTube Go Brrr popup: No currentVideoId, aborting toggle');
            return;
        }

        try {
            const settings = await this.getStorageSettings();
            console.log('YouTube Go Brrr popup: Current settings:', settings);

            // Ensure disabledVideoIds exists
            if (!settings.disabledVideoIds) {
                settings.disabledVideoIds = {};
            }

            const isCurrentlyDisabled = !!settings.disabledVideoIds[this.currentVideoId];
            console.log('YouTube Go Brrr popup: Video currently disabled:', isCurrentlyDisabled);
            console.log('YouTube Go Brrr popup: Toggle checked:', this.videoSpeedToggle.checked);

            // If toggle is ON, speed should be ENABLED (disabled = false)
            // If toggle is OFF, speed should be DISABLED (disabled = true)
            if (this.videoSpeedToggle.checked) {
                delete settings.disabledVideoIds[this.currentVideoId];
                console.log('YouTube Go Brrr popup: Enabling speed for video');
            } else {
                settings.disabledVideoIds[this.currentVideoId] = true;
                console.log('YouTube Go Brrr popup: Disabling speed for video');
            }

            await this.saveStorageSettings(settings);
            console.log('YouTube Go Brrr popup: Settings saved');

            // Send message to content script to reapply speed immediately
            // Include the new disabled state so content script doesn't have to read from storage
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id) {
                const newDisabledState = !!settings.disabledVideoIds[this.currentVideoId];
                console.log(
                    'YouTube Go Brrr popup: Sending reapplySpeed message to tab:',
                    tab.id,
                    'disabled:',
                    newDisabledState
                );
                chrome.tabs.sendMessage(
                    tab.id,
                    { action: 'reapplySpeed', isDisabled: newDisabledState },
                    () => {
                        if (chrome.runtime.lastError) {
                            console.log(
                                'YouTube Go Brrr popup: sendMessage error (reapplySpeed)',
                                chrome.runtime.lastError.message
                            );
                        } else {
                            console.log(
                                'YouTube Go Brrr popup: reapplySpeed message sent successfully'
                            );
                        }
                    }
                );
            }
        } catch (error) {
            console.error('YouTube Go Brrr popup: Error toggling video speed', error);
            // Revert the toggle on error
            this.videoSpeedToggle.checked = !this.videoSpeedToggle.checked;
        }
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;

        setTimeout(() => {
            this.statusMessage.className = 'status-message';
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    snapSpeed(value) {
        const min = 0.25;
        const max = 16;
        const step = 0.1;
        if (!Number.isFinite(value)) return NaN;
        const clamped = Math.min(Math.max(value, min), max);
        const snapped = Math.round(clamped / step) * step;
        return Number(snapped.toFixed(2));
    }

    resetGenreForm() {
        this.genreInput.value = '';
        this.genreSpeedInput.value = '1';
    }

    resetChannelForm() {
        this.channelInput.value = '';
        this.channelSpeedInput.value = '1.5';
    }

    async prefillGenreFromActiveTab() {
        if (!chrome.tabs || !chrome.tabs.query) {
            console.log('YouTube Go Brrr popup: chrome.tabs unavailable for genre prefill');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('YouTube Go Brrr popup: active tab for genre', tab && tab.url);
            if (!tab || !tab.id) return;

            const response = await new Promise((resolve) => {
                chrome.tabs.sendMessage(tab.id, { action: 'getGenreInfo' }, (res) => {
                    if (chrome.runtime.lastError) {
                        console.log(
                            'YouTube Go Brrr popup: sendMessage error (genre)',
                            chrome.runtime.lastError.message
                        );
                        resolve(null);
                        return;
                    }
                    resolve(res);
                });
            });

            const genres = response && Array.isArray(response.genres) ? response.genres : [];
            const firstGenre = genres.find((g) => !!g) || '';
            const titleCasedGenre =
                firstGenre &&
                firstGenre.replace(
                    /\w\S*/g,
                    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                );
            console.log('YouTube Go Brrr popup: genre prefill response', genres);
            if (titleCasedGenre && !this.genreInput.value) {
                this.genreInput.value = titleCasedGenre;
            } else if (!firstGenre) {
                console.log('YouTube Go Brrr popup: no genre returned');
            } else {
                console.log('YouTube Go Brrr popup: genre input already populated');
            }
        } catch (error) {
            console.log('YouTube Go Brrr popup: genre prefill error', error);
        }
    }

    async prefillChannelFromActiveTab() {
        if (!chrome.tabs || !chrome.tabs.query) {
            console.log('YouTube Go Brrr popup: chrome.tabs unavailable');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('YouTube Go Brrr popup: active tab', tab && tab.url);
            if (!tab || !tab.id) return;

            const response = await new Promise((resolve) => {
                chrome.tabs.sendMessage(tab.id, { action: 'getChannelInfo' }, (res) => {
                    if (chrome.runtime.lastError) {
                        console.log(
                            'YouTube Go Brrr popup: sendMessage error',
                            chrome.runtime.lastError.message
                        );
                        resolve(null);
                        return;
                    }
                    resolve(res);
                });
            });

            const channelName = response && response.channel ? response.channel.trim() : '';
            console.log('YouTube Go Brrr popup: channel prefill response', channelName);
            if (channelName && !this.channelInput.value) {
                this.channelInput.value = channelName;
            } else if (!channelName) {
                console.log('YouTube Go Brrr popup: no channel name returned');
            } else {
                console.log('YouTube Go Brrr popup: channel input already populated');
            }
        } catch (error) {
            console.log('YouTube Go Brrr popup: prefill error', error);
        }
    }
}

// Initialize popup when DOM is ready
console.log('YouTube Go Brrr popup: Setting up DOMContentLoaded listener');
document.addEventListener('DOMContentLoaded', () => {
    console.log('YouTube Go Brrr popup: DOMContentLoaded fired, creating PopupManager');
    new PopupManager();
});
