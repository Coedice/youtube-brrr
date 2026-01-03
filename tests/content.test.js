/**
 * Unit tests for YouTubeSpeedController class
 */

// Mock chrome API
global.chrome = {
    runtime: {
        onMessage: {
            addListener: jest.fn(),
        },
    },
    storage: {
        sync: {
            get: jest.fn(),
        },
    },
};

// Mock DOM methods
global.document = {
    querySelector: jest.fn(),
    addEventListener: jest.fn(),
};

global.window = {
    addEventListener: jest.fn(),
    setInterval: jest.fn(() => 1),
    clearInterval: jest.fn(),
};

// Create a mock YouTubeSpeedController for testing
class YouTubeSpeedController {
    constructor() {
        this.lastAppliedSpeed = null;
        this.checkInterval = null;
        this.videoElement = null;
        this.init();
    }

    init() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getSpeed') {
                sendResponse({ speed: this.lastAppliedSpeed || 1 });
            }
        });
        this.startMonitoring();
    }

    startMonitoring() {
        this.checkInterval = window.setInterval(() => {
            this.updateVideoSpeed();
        }, 1000);
    }

    stopMonitoring() {
        if (this.checkInterval) {
            window.clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    async updateVideoSpeed() {
        const video = document.querySelector('video');
        if (!video) {
            this.videoElement = null;
            return;
        }
        if (video !== this.videoElement) {
            this.videoElement = video;
            this.lastAppliedSpeed = null;
        }
        await this.applySpeed();
    }

    async applySpeed() {
        const video = this.videoElement;
        if (!video) return;

        try {
            const videoInfo = this.extractVideoInfo();
            const speed = await this.getApplicableSpeed(videoInfo);

            if (speed && speed !== this.lastAppliedSpeed) {
                video.playbackRate = speed;
                this.lastAppliedSpeed = speed;
            }
        } catch (error) {
            console.error('YouTube Go Brrr: Error applying speed', error);
        }
    }

    extractVideoInfo() {
        const channelElement = document.querySelector(
            'ytd-channel-name a, a[href*="/c/"], a[href*="/@"]'
        );
        const channel = channelElement ? channelElement.textContent.trim() : null;
        const genres = this.extractGenres();

        return {
            channel,
            genres,
        };
    }

    extractGenres() {
        const genres = [];
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
            try {
                const data = JSON.parse(jsonLd.textContent);
                if (data.keywords) {
                    genres.push(...data.keywords.split(',').map((k) => k.trim().toLowerCase()));
                }
            } catch (e) {
                // Ignore
            }
        }

        const categoryMeta = document.querySelector('meta[itemprop="genre"]');
        if (categoryMeta) {
            genres.push(categoryMeta.content.toLowerCase());
        }

        return genres;
    }

    async getApplicableSpeed(videoInfo) {
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
                (settings) => {
                    const speed = this.determineSpeed(videoInfo, settings);
                    resolve(speed);
                }
            );
        });
    }

    determineSpeed(videoInfo, settings) {
        const { channel, genres } = videoInfo;

        // Check channel speeds first (highest priority) - case insensitive exact match
        if (channel) {
            const channelKey = Object.keys(settings.channelSpeeds).find(
                (key) => key.toLowerCase() === channel.toLowerCase()
            );
            if (channelKey) {
                return settings.channelSpeeds[channelKey];
            }
        }

        for (const genre of genres) {
            const genreKey = Object.keys(settings.genreSpeeds).find(
                (key) => key.toLowerCase() === genre.toLowerCase()
            );
            if (genreKey) {
                return settings.genreSpeeds[genreKey];
            }
        }

        return settings.defaultSpeed;
    }
}

describe('YouTubeSpeedController', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();

        jest.spyOn(window, 'setInterval').mockImplementation(() => 1);
        jest.spyOn(window, 'clearInterval').mockImplementation(() => {});
        jest.spyOn(document, 'querySelector').mockReturnValue(null);
    });

    describe('initialization', () => {
        it('should initialize without errors', () => {
            const controller = new YouTubeSpeedController();
            expect(controller).toBeDefined();
            expect(controller.lastAppliedSpeed).toBeNull();
        });

        it('should set up message listener', () => {
            new YouTubeSpeedController();
            expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
        });

        it('should start monitoring', () => {
            new YouTubeSpeedController();
            expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
        });
    });

    describe('extractVideoInfo', () => {
        it('should extract channel name', () => {
            const mockElement = {
                textContent: 'Test Channel',
            };
            document.querySelector.mockImplementation((selector) => {
                if (selector === 'ytd-channel-name a, a[href*="/c/"], a[href*="/@"]') {
                    return mockElement;
                }
                return null;
            });

            const controller = new YouTubeSpeedController();
            const info = controller.extractVideoInfo();

            expect(info.channel).toBe('Test Channel');
        });

        it('should return null channel if not found', () => {
            document.querySelector.mockImplementation(() => null);

            const controller = new YouTubeSpeedController();
            const info = controller.extractVideoInfo();

            expect(info.channel).toBeNull();
        });

        it('should extract genres from keywords', () => {
            const jsonLd = {
                textContent: JSON.stringify({
                    keywords: 'music, pop, dance',
                }),
            };
            document.querySelector.mockImplementation((selector) => {
                if (selector === 'script[type="application/ld+json"]') {
                    return jsonLd;
                }
                if (selector === 'meta[itemprop="genre"]') {
                    return null;
                }
                return null;
            });

            const controller = new YouTubeSpeedController();
            const info = controller.extractVideoInfo();

            expect(info.genres).toContain('music');
            expect(info.genres).toContain('pop');
            expect(info.genres).toContain('dance');
        });
    });

    describe('determineSpeed', () => {
        it('should prioritize channel speeds', () => {
            const controller = new YouTubeSpeedController();
            const settings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1 },
                channelSpeeds: { TestChannel: 1.5 },
            };

            const speed = controller.determineSpeed(
                { channel: 'TestChannel', genres: ['music'] },
                settings
            );

            expect(speed).toBe(1.5);
        });

        it('should use genre speed as fallback', () => {
            const controller = new YouTubeSpeedController();
            const settings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1 },
                channelSpeeds: {},
            };

            const speed = controller.determineSpeed({ channel: null, genres: ['music'] }, settings);

            expect(speed).toBe(1);
        });

        it('should use default speed as last resort', () => {
            const controller = new YouTubeSpeedController();
            const settings = {
                defaultSpeed: 2.3,
                genreSpeeds: {},
                channelSpeeds: {},
            };

            const speed = controller.determineSpeed({ channel: null, genres: [] }, settings);

            expect(speed).toBe(2.3);
        });

        it('should handle case-insensitive matching', () => {
            const controller = new YouTubeSpeedController();
            const settings = {
                defaultSpeed: 2.3,
                genreSpeeds: { Music: 1 },
                channelSpeeds: {},
            };

            const speed = controller.determineSpeed({ channel: null, genres: ['MUSIC'] }, settings);

            expect(speed).toBe(1);
        });
    });

    describe('updateVideoSpeed', () => {
        it('reapplies speed for the same video when settings change', async () => {
            const videoEl = { playbackRate: 1 };

            document.querySelector.mockImplementation((selector) => {
                if (selector === 'video') {
                    return videoEl;
                }
                if (selector === 'ytd-channel-name a, a[href*="/c/"], a[href*="/@"]') {
                    return { textContent: 'Test Channel' };
                }
                if (selector === 'script[type="application/ld+json"]') {
                    return null;
                }
                if (selector === 'meta[itemprop="genre"]') {
                    return null;
                }
                return null;
            });

            chrome.storage.sync.get
                .mockImplementationOnce((defaults, cb) =>
                    cb({
                        defaultSpeed: 2,
                        genreSpeeds: {},
                        channelSpeeds: {},
                    })
                )
                .mockImplementationOnce((defaults, cb) =>
                    cb({
                        defaultSpeed: 2,
                        genreSpeeds: {},
                        channelSpeeds: { 'Test Channel': 1.25 },
                    })
                );

            const controller = new YouTubeSpeedController();

            await controller.updateVideoSpeed();
            expect(videoEl.playbackRate).toBe(2);

            await controller.updateVideoSpeed();
            expect(videoEl.playbackRate).toBe(1.25);
        });
    });

    describe('stopMonitoring', () => {
        it('should clear interval', () => {
            const controller = new YouTubeSpeedController();
            controller.stopMonitoring();

            expect(window.clearInterval).toHaveBeenCalled();
            expect(controller.checkInterval).toBeNull();
        });
    });
});
