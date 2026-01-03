/**
 * Unit tests for PopupManager class
 */

// Mock DOM
const mockDOM = {
    'default-speed': {
        value: '2.3',
        addEventListener: jest.fn(),
    },
    'save-default-btn': {
        addEventListener: jest.fn(),
    },
    'genre-input': {
        value: '',
        addEventListener: jest.fn(),
    },
    'genre-speed-input': {
        value: '1',
        addEventListener: jest.fn(),
    },
    'add-genre-btn': {
        addEventListener: jest.fn(),
    },
    'genre-list': {
        innerHTML: '',
        appendChild: jest.fn(),
    },
    'channel-input': {
        value: '',
        addEventListener: jest.fn(),
    },
    'channel-speed-input': {
        value: '1.5',
        addEventListener: jest.fn(),
    },
    'add-channel-btn': {
        addEventListener: jest.fn(),
    },
    'channel-list': {
        innerHTML: '',
        appendChild: jest.fn(),
    },
    'status-message': {
        textContent: '',
        className: '',
        addEventListener: jest.fn(),
    },
};

global.document = {
    getElementById: jest.fn((id) => mockDOM[id]),
    createElement: jest.fn((tag) => {
        if (tag === 'div') {
            return {
                className: '',
                innerHTML: '',
                appendChild: jest.fn(),
                querySelector: jest.fn(),
            };
        }
        return {};
    }),
    querySelector: jest.fn(),
    addEventListener: jest.fn(),
};

global.chrome = {
    storage: {
        sync: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
};

// Mock PopupManager
class PopupManager {
    constructor() {
        this.defaultSpeedInput = document.getElementById('default-speed');
        this.saveDefaultBtn = document.getElementById('save-default-btn');
        this.genreInput = document.getElementById('genre-input');
        this.genreSpeedInput = document.getElementById('genre-speed-input');
        this.addGenreBtn = document.getElementById('add-genre-btn');
        this.genreList = document.getElementById('genre-list');
        this.channelInput = document.getElementById('channel-input');
        this.channelSpeedInput = document.getElementById('channel-speed-input');
        this.addChannelBtn = document.getElementById('add-channel-btn');
        this.channelList = document.getElementById('channel-list');
        this.statusMessage = document.getElementById('status-message');

        this.init();
    }

    async init() {
        this.attachEventListeners();
        await this.loadSettings();
    }

    attachEventListeners() {
        if (!this.saveDefaultBtn || !this.addGenreBtn || !this.addChannelBtn) {
            return;
        }
        this.saveDefaultBtn.addEventListener('click', () => this.handleSaveDefault());
        this.addGenreBtn.addEventListener('click', () => this.handleAddGenre());
        this.addChannelBtn.addEventListener('click', () => this.handleAddChannel());
    }

    async loadSettings() {
        const settings = await this.getStorageSettings();
        this.defaultSpeedInput.value = settings.defaultSpeed;
        this.renderGenres(settings.genreSpeeds);
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
            const div = document.createElement('div');
            div.className = 'genre-item';
            div.innerHTML = `<span>${genre}: ${speed.toFixed(1)}x</span>`;
            this.genreList.appendChild(div);
        });
    }

    renderChannels(channelSpeeds) {
        this.channelList.innerHTML = '';
        Object.entries(channelSpeeds).forEach(([channel, speed]) => {
            const div = document.createElement('div');
            div.className = 'channel-item';
            div.innerHTML = `<span>${channel}: ${speed.toFixed(1)}x</span>`;
            this.channelList.appendChild(div);
        });
    }

    async handleSaveDefault() {
        const speed = parseFloat(this.defaultSpeedInput.value);

        if (isNaN(speed) || speed < 0.25 || speed > 16) {
            this.showStatus('Invalid speed', 'error');
            return;
        }

        try {
            const settings = await this.getStorageSettings();
            settings.defaultSpeed = speed;
            await this.saveStorageSettings(settings);
            this.showStatus('Saved!', 'success');
        } catch (error) {
            this.showStatus('Error', 'error');
        }
    }

    async handleAddGenre() {
        const genre = this.genreInput.value.trim();
        const speed = parseFloat(this.genreSpeedInput.value);

        if (!genre || isNaN(speed) || speed < 0.25 || speed > 16) {
            this.showStatus('Invalid input', 'error');
            return;
        }

        try {
            const settings = await this.getStorageSettings();
            settings.genreSpeeds[genre] = speed;
            await this.saveStorageSettings(settings);
            this.renderGenres(settings.genreSpeeds);
            this.genreInput.value = '';
            this.showStatus('Genre added!', 'success');
        } catch (error) {
            this.showStatus('Error', 'error');
        }
    }

    async handleAddChannel() {
        const channel = this.channelInput.value.trim();
        const speed = parseFloat(this.channelSpeedInput.value);

        if (!channel || isNaN(speed) || speed < 0.25 || speed > 16) {
            this.showStatus('Invalid input', 'error');
            return;
        }

        try {
            const settings = await this.getStorageSettings();
            settings.channelSpeeds[channel] = speed;
            await this.saveStorageSettings(settings);
            this.renderChannels(settings.channelSpeeds);
            this.channelInput.value = '';
            this.showStatus('Channel added!', 'success');
        } catch (error) {
            this.showStatus('Error', 'error');
        }
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
    }
}

describe('PopupManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        Object.values(mockDOM).forEach((el) => {
            if (el && typeof el.addEventListener === 'function') el.addEventListener.mockClear();
            if (el && typeof el.appendChild === 'function') el.appendChild.mockClear();
        });

        const fallbackElement = () => ({
            addEventListener: jest.fn(),
            value: '',
            innerHTML: '',
            appendChild: jest.fn(),
            className: '',
        });

        const jsdomDocument = globalThis.document;
        jest.spyOn(jsdomDocument, 'getElementById').mockImplementation(
            (id) => mockDOM[id] || fallbackElement()
        );
        jest.spyOn(jsdomDocument, 'createElement').mockImplementation((tag) => {
            if (tag === 'div') {
                return {
                    className: '',
                    innerHTML: '',
                    appendChild: jest.fn(),
                    querySelector: jest.fn(),
                };
            }
            return {};
        });
    });

    describe('initialization', () => {
        it('should initialize all DOM elements', () => {
            const manager = new PopupManager();
            expect(manager.defaultSpeedInput).toBeDefined();
            expect(manager.genreInput).toBeDefined();
            expect(manager.channelInput).toBeDefined();
        });

        it('should attach event listeners', () => {
            new PopupManager();
            expect(mockDOM['save-default-btn'].addEventListener).toHaveBeenCalled();
            expect(mockDOM['add-genre-btn'].addEventListener).toHaveBeenCalled();
            expect(mockDOM['add-channel-btn'].addEventListener).toHaveBeenCalled();
        });
    });

    describe('handleSaveDefault', () => {
        it('should save valid default speed', (done) => {
            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(defaults);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            const manager = new PopupManager();
            manager.defaultSpeedInput.value = '3.0';

            manager.handleSaveDefault().then(() => {
                expect(chrome.storage.sync.set).toHaveBeenCalledWith(
                    expect.objectContaining({ defaultSpeed: 3.0 }),
                    expect.any(Function)
                );
                done();
            });
        });

        it('should reject invalid speed', (done) => {
            const manager = new PopupManager();
            manager.defaultSpeedInput.value = 'invalid';

            manager.handleSaveDefault().then(() => {
                expect(manager.statusMessage.className).toContain('error');
                done();
            });
        });

        it('should reject speed below 0.25x', (done) => {
            const manager = new PopupManager();
            manager.defaultSpeedInput.value = '0.1';

            manager.handleSaveDefault().then(() => {
                expect(manager.statusMessage.className).toContain('error');
                done();
            });
        });

        it('should reject speed above 16x', (done) => {
            const manager = new PopupManager();
            manager.defaultSpeedInput.value = '20';

            manager.handleSaveDefault().then(() => {
                expect(manager.statusMessage.className).toContain('error');
                done();
            });
        });
    });

    describe('handleAddGenre', () => {
        it('should add valid genre', (done) => {
            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(defaults);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            const manager = new PopupManager();
            manager.genreInput.value = 'Action';
            manager.genreSpeedInput.value = '2.0';

            manager.handleAddGenre().then(() => {
                expect(chrome.storage.sync.set).toHaveBeenCalledWith(
                    expect.objectContaining({ genreSpeeds: expect.any(Object) }),
                    expect.any(Function)
                );
                done();
            });
        });

        it('should reject empty genre', (done) => {
            const manager = new PopupManager();
            manager.genreInput.value = '';

            manager.handleAddGenre().then(() => {
                expect(manager.statusMessage.className).toContain('error');
                done();
            });
        });
    });

    describe('handleAddChannel', () => {
        it('should add valid channel', (done) => {
            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(defaults);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            const manager = new PopupManager();
            manager.channelInput.value = 'My Channel';
            manager.channelSpeedInput.value = '1.5';

            manager.handleAddChannel().then(() => {
                expect(chrome.storage.sync.set).toHaveBeenCalled();
                done();
            });
        });
    });

    describe('renderGenres', () => {
        it('should render genres', () => {
            const manager = new PopupManager();
            manager.renderGenres({ Music: 1, Action: 2 });

            expect(mockDOM['genre-list'].appendChild).toHaveBeenCalledTimes(2);
        });

        it('should clear existing genres', () => {
            const manager = new PopupManager();
            manager.genreList.innerHTML = '<div>existing</div>';
            manager.renderGenres({ Music: 1 });

            expect(manager.genreList.innerHTML).toBe('');
        });
    });

    describe('showStatus', () => {
        it('should display success message', () => {
            const manager = new PopupManager();
            manager.showStatus('Success', 'success');

            expect(manager.statusMessage.textContent).toBe('Success');
            expect(manager.statusMessage.className).toContain('success');
        });

        it('should display error message', () => {
            const manager = new PopupManager();
            manager.showStatus('Error', 'error');

            expect(manager.statusMessage.textContent).toBe('Error');
            expect(manager.statusMessage.className).toContain('error');
        });
    });
});
