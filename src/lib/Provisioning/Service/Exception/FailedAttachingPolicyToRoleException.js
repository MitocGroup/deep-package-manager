/**
 * Created by AlexanderC on 6/8/15.
 */

"use strict";

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to attach access policy to a iam role
 */
export class FailedAttachingPolicyToRoleException extends Exception {
    /**
     * @param policyName
     * @param roleName
     * @param error
     */
    constructor(policyName, roleName, error) {
        super(`Error on attaching "${policyName}" to "${roleName}" iam role. ${error}`);
    }
}