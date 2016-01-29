/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {FailedToRequestCloudFrontDistributionCertificateException} from './Exception/FailedToRequestCloudFrontDistributionCertificateException';
import {Hash} from '../../Helpers/Hash';
import {CloudFrontService} from './CloudFrontService';
import {ACMDriver as ACMListing} from '../ListingDriver/ACMDriver';

/**
 * ACMService service
 */
export class ACMService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._allowRunCf = false;
  }

  /**
   * @returns {Boolean}
   */
  get allowRunCf() {
    return this._allowRunCf;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.CERTIFICATE_MANAGER;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.US_EAST_N_VIRGINIA,
    ];
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {ACMService}
   */
  _setup(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {ACMService}
   */
  _postProvision(services) {
    let domain = this._certificateDomain;

    if (domain) {
      this._ensureCertificate(services, (certificateArn) => {
        if (certificateArn) {
          // @todo: Figure out a way to avoid this!
          // Disable due to the error:
          // Failed to create CloudFront distribution:
          //      InvalidViewerCertificate:
          //          The specified SSL certificate doesn't exist, isn't valid,
          //          or doesn't include a valid certificate chain.

          //let distMetadata = services.find(CloudFrontService).distMetadata;
          //
          //distMetadata.ViewerCertificate = {
          //  Certificate: certificateArn,
          //  CertificateSource: 'acm',
          //};
          //
          //distMetadata.ViewerProtocolPolicy = 'redirect-to-https';

          this._config.certificateArn = certificateArn;
        }

        this._readyTeardown = true;

        this._allowRunCf = true;
      });

      return this;
    }

    this._allowRunCf = true;

    this._readyTeardown = true;

    return this;
  }

  /**
   * @returns {String|null}
   * @private
   */
  get _certificateDomain() {
    return this.provisioning.property.config.domain;
  }

  /**
   * @param {String} str
   * @returns {String}
   * @private
   */
  static _escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @param {Function} cb
   * @private
   */
  _ensureCertificate(services, cb) {
    let domain = this._certificateDomain;
    let domainName = `*.${domain}`;

    let listing = new ACMListing(
      this.provisioning.acm,
      new RegExp(`^${ACMService._escapeRegExp(domainName)}$`, 'i')
    );

    listing.list(() => {
      let certificates = listing.extractResetStack;

      for (let certArn in certificates) {
        if (!certificates.hasOwnProperty(certArn)) {
          continue;
        }

        let certData = certificates[certArn];

        if (domainName === certData.DomainName) {
          console.log(`Reusing certificate '${certArn}' for '${domainName}'`);
          cb(certArn);
          return;
        }
      }

      console.log(`Creating certificate for '${domainName}'`);

      this._createCertificate(services, (...args) => {
        cb(...args);
      });
    });
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @param {Function} cb
   * @private
   */
  _createCertificate(services, cb) {
    let domain = this._certificateDomain;
    let acm = this.provisioning.acm;

    let payload = {
      DomainName: `*.${domain}`,
      IdempotencyToken: Hash.md5(`${this.provisioning.property.identifier}|${domain}`),
    };

    acm.requestCertificate(payload, (error, data) => {
      if (error) {
        throw new FailedToRequestCloudFrontDistributionCertificateException(error);
      }

      cb(data.CertificateArn);
    });
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {ACMService}
   */
  _postDeployProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }
}
