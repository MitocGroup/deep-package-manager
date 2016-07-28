/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {FailedToRequestCloudFrontDistributionCertificateException} from
  './Exception/FailedToRequestCloudFrontDistributionCertificateException';
import {Hash} from '../../Helpers/Hash';
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
      this.ensureCertificate(domain, (error, certificateArn) => {
        if (error) {
          console.error(error);
        }

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
          //
          //distMetadata.Aliases = {
          //  Quantity: 1,
          //  Items: [domain],
          //};

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
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }

  /**
   * @param {String} domain
   * @param {Function} cb
   */
  ensureCertificate(domain, cb) {
    this.getDomainCertificateArn(domain, (certArn) => {
      if (certArn) {
        cb(null, certArn);
        return;
      }

      this.createCertificate(domain, (error, certArn) => {
        cb(error, certArn);
      });
    });
  }

  /**
   * @param {String} domain
   * @param {Function} cb
   */
  createCertificate(domain, cb) {
    let acm = this.provisioning.acm;

    let payload = {
      DomainName: domain,
      IdempotencyToken: Hash.md5(`${this.provisioning.property.identifier}|${domain}`),
    };

    acm.requestCertificate(payload, (error, data) => {
      if (error) {
        cb(new FailedToRequestCloudFrontDistributionCertificateException(error), null);
        return;
      }

      cb(null, data.CertificateArn);
    });
  }

  /**
   * @param {String} domain
   * @param {Function} cb
   */
  getDomainCertificateArn(domain, cb) {
    let listing = new ACMListing(
      this.provisioning.acm,
      new RegExp(`^${ACMService._escapeRegExp(domain)}$`, 'i')
    );

    listing.list(() => {
      let certificates = listing.extractResetStack;

      for (let certArn in certificates) {
        if (!certificates.hasOwnProperty(certArn)) {
          continue;
        }

        let certData = certificates[certArn];

        if (domain === certData.DomainName) {
          cb(certArn);
          return;
        }
      }

      cb(null);
    });
  }

  /**
   * @param {String} certArn
   * @param {Function} cb
   */
  isCertificateIssued(certArn, cb) {
    let acm = this.provisioning.acm;

    let payload = {
      CertificateArn: certArn,
    };

    acm.describeCertificate(payload, (error, data) => {
      if (error) {
        cb(error, null);
        return;
      }

      cb(null, data.Certificate.Status === 'ISSUED');
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
