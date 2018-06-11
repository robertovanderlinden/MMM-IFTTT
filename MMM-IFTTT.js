/* global Module */

Module.register('MMM-IFTTT',{

    /**
     * Module config defaults
     */
    defaults: {
        displaySeconds: 60,
        fadeSpeed: 3000,
        size: 'large',
        debug: false
    },

    /**
     * @var {Object}
     */
    currentNotification: null,

    /**
     * @var {Integer}
     */
    currentTimeout: null,

    /**
     * Starting of the module
     */
    start: function() {
        Log.info('[' + this.name + '] Starting');
        this.sendSocketNotification('START', this.config);
    },

    /**
     * @param {String}  notification
     * @param {Object}  payload
     */
    socketNotificationReceived: function(notification, payload) {
        if (notification === 'IFTTT_NOTIFICATION') {
            let fadeSpeed = this.config.fadeSpeed;
            if (this.currentNotification && typeof this.currentNotification.fadeSpeed !== 'undefined') {
                fadeSpeed = this.currentNotification.fadeSpeed;
            }

            this.currentNotification = payload;
            this.updateDom(fadeSpeed);
            this.sendNotification('SCREEN_WAKEUP', true);
        }
    },

    /**
     * @returns {*}
     */
    getDom: function() {
        let message = '';
        let image = null;

        if (this.currentNotification !== null) {
            message = this.currentNotification.message;

            // Talk to the PiLights Module
            if (typeof this.currentNotification.pilights !== 'undefined') {
                this.sendNotification('PILIGHTS_SEQUENCE', this.currentNotification.pilights);
            }

            // Talk to the Sounds Module
            if (typeof this.currentNotification.sound !== 'undefined') {
                this.sendNotification('PLAY_SOUND', this.currentNotification.sound);
            }

            // Set timeout to hide this soon, but first clear the existing timeout
            if (this.currentTimeout) {
                clearTimeout(this.currentTimeout);
            }

            // Message
            let display_ms = (this.currentNotification.displaySeconds || this.defaults.displaySeconds) * 1000;
            let fadeSpeed  = this.currentNotification.fadeSpeed || this.config.fadeSpeed;

            this.currentTimeout = setTimeout(() => {
                this.currentTimeout = null;
            this.updateDom(fadeSpeed);
        }, display_ms);

            // image
            if (typeof this.currentNotification.imagePath !== 'undefined') {
                image = document.createElement("img");
                var getTimeStamp = new Date();
                image.src = this.currentNotification.imagePath + "?seed=" + getTimeStamp;
                image.className = "photo";
                image.style.maxWidth = "100%";
            }

            this.currentNotification = null;
        }

        let wrapper = document.createElement('div');
        wrapper.className = 'thin bright ' + this.config.size;
        wrapper.appendChild(document.createTextNode(message));
        if (image !== null) {
            wrapper.appendChild(image);
        }

        return wrapper;
    }
});
