/**
 * Unit tests for StorageManager class
 */

// Mock chrome API
global.chrome = {
    storage: {
        sync: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
    runtime: {
        lastError: null,
    },
};

// Import after mocking
const StorageManager = require('../src/storage.js');

describe('StorageManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.chrome.runtime.lastError = null;
    });

    describe('getSettings', () => {
        it('should return default settings when storage is empty', (done) => {
            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(defaults);
            });

            StorageManager.getSettings().then((settings) => {
                expect(settings.defaultSpeed).toBe(2.3);
                expect(settings.genreSpeeds).toHaveProperty('Music', 1);
                expect(settings.genreSpeeds).toHaveProperty('Comedy', 1);
                expect(settings.channelSpeeds).toEqual({});
                done();
            });
        });

        it('should return saved settings', (done) => {
            const savedSettings = {
                defaultSpeed: 1.5,
                genreSpeeds: { Music: 1, Action: 2 },
                channelSpeeds: { 'Example Channel': 1.8 },
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(savedSettings);
            });

            StorageManager.getSettings().then((settings) => {
                expect(settings.defaultSpeed).toBe(1.5);
                expect(settings.genreSpeeds.Action).toBe(2);
                expect(settings.channelSpeeds['Example Channel']).toBe(1.8);
                done();
            });
        });
    });

    describe('setDefaultSpeed', () => {
        it('should update default speed', (done) => {
            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback({ ...defaults, defaultSpeed: 2.3 });
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            StorageManager.setDefaultSpeed(3.0).then((settings) => {
                expect(settings.defaultSpeed).toBe(3.0);
                done();
            });
        });

        it('should parse string speed as float', (done) => {
            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(defaults);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            StorageManager.setDefaultSpeed('2.5').then((settings) => {
                expect(settings.defaultSpeed).toBe(2.5);
                expect(typeof settings.defaultSpeed).toBe('number');
                done();
            });
        });
    });

    describe('addGenre', () => {
        it('should add a new genre', (done) => {
            const initialSettings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1 },
                channelSpeeds: {},
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(initialSettings);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            StorageManager.addGenre('Action', 2.5).then((settings) => {
                expect(settings.genreSpeeds).toHaveProperty('Action', 2.5);
                expect(settings.genreSpeeds).toHaveProperty('Music', 1);
                done();
            });
        });

        it('should overwrite existing genre speed', (done) => {
            const initialSettings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1 },
                channelSpeeds: {},
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(initialSettings);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            StorageManager.addGenre('Music', 1.5).then((settings) => {
                expect(settings.genreSpeeds.Music).toBe(1.5);
                done();
            });
        });
    });

    describe('removeGenre', () => {
        it('should remove a genre', (done) => {
            const initialSettings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1, Action: 2 },
                channelSpeeds: {},
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(initialSettings);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            StorageManager.removeGenre('Action').then((settings) => {
                expect(settings.genreSpeeds).not.toHaveProperty('Action');
                expect(settings.genreSpeeds).toHaveProperty('Music');
                done();
            });
        });
    });

    describe('addChannel', () => {
        it('should add a new channel', (done) => {
            const initialSettings = {
                defaultSpeed: 2.3,
                genreSpeeds: {},
                channelSpeeds: {},
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(initialSettings);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            StorageManager.addChannel('TechChannel', 1.5).then((settings) => {
                expect(settings.channelSpeeds).toHaveProperty('TechChannel', 1.5);
                done();
            });
        });
    });

    describe('removeChannel', () => {
        it('should remove a channel', (done) => {
            const initialSettings = {
                defaultSpeed: 2.3,
                genreSpeeds: {},
                channelSpeeds: { TechChannel: 1.5 },
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(initialSettings);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                callback();
            });

            StorageManager.removeChannel('TechChannel').then((settings) => {
                expect(settings.channelSpeeds).not.toHaveProperty('TechChannel');
                done();
            });
        });
    });

    describe('getSpeedForVideo', () => {
        it('should return channel speed with highest priority', (done) => {
            const settings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1 },
                channelSpeeds: { MusicChannel: 1.5 },
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(settings);
            });

            StorageManager.getSpeedForVideo({
                channel: 'MusicChannel',
                genres: ['Music'],
            }).then((speed) => {
                expect(speed).toBe(1.5);
                done();
            });
        });

        it('should return genre speed when channel not found', (done) => {
            const settings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1 },
                channelSpeeds: {},
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(settings);
            });

            StorageManager.getSpeedForVideo({
                channel: 'OtherChannel',
                genres: ['Music'],
            }).then((speed) => {
                expect(speed).toBe(1);
                done();
            });
        });

        it('should return default speed when no other match', (done) => {
            const settings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1 },
                channelSpeeds: {},
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(settings);
            });

            StorageManager.getSpeedForVideo({
                channel: null,
                genres: [],
            }).then((speed) => {
                expect(speed).toBe(2.3);
                done();
            });
        });

        it('is case-sensitive for channel lookups', (done) => {
            const settings = {
                defaultSpeed: 2.3,
                genreSpeeds: {},
                channelSpeeds: { ExactCase: 1.75 },
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(settings);
            });

            StorageManager.getSpeedForVideo({
                channel: 'exactcase',
                genres: [],
            }).then((speed) => {
                expect(speed).toBe(2.3);
                done();
            });
        });

        it('is case-sensitive for genre lookups', (done) => {
            const settings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1.25 },
                channelSpeeds: {},
            };

            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(settings);
            });

            StorageManager.getSpeedForVideo({
                channel: null,
                genres: ['music'],
            }).then((speed) => {
                expect(speed).toBe(2.3);
                done();
            });
        });
    });

    describe('error handling', () => {
        it('should reject on save error', (done) => {
            chrome.storage.sync.get.mockImplementation((defaults, callback) => {
                callback(defaults);
            });
            chrome.storage.sync.set.mockImplementation((data, callback) => {
                global.chrome.runtime.lastError = { message: 'Storage error' };
                callback();
            });

            StorageManager.saveSettings({}).catch((error) => {
                expect(error.message).toBe('Storage error');
                done();
            });
        });
    });
});
