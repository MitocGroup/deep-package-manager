/**
 * Created by AlexanderC on 5/27/15.
 */

"use strict";

import {AbstractService} from './AbstractService';
import Core from '@mitocgroup/deep-core';


/**
 * SNS service
 */
export class SNSService extends AbstractService {
    /**
     * @param {Array} args
     */
    constructor(...args) {
        super(...args);
    }

    /**
     * @returns {String}
     */
    name() {
        return Core.AWS.Service.SIMPLE_NOTIFICATION_SERVICE;
    }

    /**
     * @returns {String[]}
     */
    static get AVAILABLE_REGIONS() {
        return [
            Core.AWS.Region.all()
        ];
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {SNSService}
     */
    _setup(services) {
        this._ready = true;

        return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {SNSService}
     */
    _postProvision(services) {
        this._readyTeardown = true;

        return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {CloudFrontService}
     */
    _postDeployProvision(services) {
        this._ready = true;

        return this;
    }
}