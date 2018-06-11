'use strict';

const _          = require('lodash');
const NodeHelper = require('node_helper');
const bodyParser = require('body-parser');
const moment     = require('moment');

let ajv = require('ajv')({
    allErrors:   true,
    format:      'full',
    coerceTypes: true
});

module.exports = NodeHelper.create({

    config: {},

    /**
     * The JSON Validation schema that a notification is checked against.
     */
    notificationSchema: {
        $schema:  'http://json-schema.org/draft-04/schema#',
        id:       'notification',
        required: ['message'],
        properties: {
            message: {
                type:      'string',
                minLength: 1
            },
            displaySeconds: {
                type:    'integer',
                minimum: 1
            },
            size: {
                type: 'string'
            },
            fadeSpeed: {
                type:    'integer',
                minimum: 1
            },
            lightSequence: {
                type:      'string',
                minLength: 1,
                maxLength: 255
            },
            imagePath: {
                type:      'string'
            }
        }
    },

    /**
     * node_helper start method
     */
    start: function() {
        this.log('Starting node_helper');

        this.expressApp.use(bodyParser.json());
        this.expressApp.use(bodyParser.urlencoded({extended: true}));

        this.expressApp.post('/IFTTT', (req, res) => {
            this.log('Incoming: ' + JSON.stringify(req.body), true);

            this.validateNotification(req.body)
                .then((data) => {
                    this.sendSocketNotification('IFTTT_NOTIFICATION', data);

                    res.status(200)
                        .send({
                            status: 200
                        });
                })
                .catch((err) => {
                    this.log('Validation Error: ' + err.message);

                    res.status(400)
                        .send({
                            status: 400,
                            error:  err.message
                        });
                });
        });
    },

    /**
     *
     * @param {String} notification
     * @param {*}      payload
     */
    socketNotificationReceived: function (notification, payload) {
        if (notification === 'START') {
            this.config = payload;
        }
    },

    /**
     * Checks the incoming notification against the validation schema
     *
     * @param   {Object} payload
     * @returns {Promise}
     */
    validateNotification: function (payload) {
        return new Promise((resolve, reject) => {
            if (!payload) {
                reject(new Error('Payload is falsy'));
            } else {
                let validate;
                try {
                    validate = ajv.compile(this.notificationSchema);
                } catch (err) {
                    reject(err);
                }

                let valid = validate(payload);

                if (valid && !validate.errors) {
                    resolve(_.cloneDeep(payload));
                } else {
                    let message = ajv.errorsText(validate.errors);
                    let final_error = new Error(message);
                    reject(final_error);
                }
            }
        });
    },

    /**
     * Outputs log messages
     *
     * @param {String}  message
     * @param {Boolean} [debug_only]
     */
    log: function (message, debug_only) {
        if (!debug_only || (debug_only && typeof this.config.debug !== 'undefined' && this.config.debug)) {
            console.log('[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] [MMM-IFTTT] ' + message);
        }
    }
});
