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
import {CloudFrontService} from './CloudFrontService';
import {APIGatewayService} from './APIGatewayService';

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
    this._allowRunApg = false;
  }

  /**
   * @returns {Boolean}
   */
  get allowRunCf() {
    return this._allowRunCf;
  }
  
  /**
   * @returns {Boolean}
   */
  get allowRunApg() {
    return this._allowRunApg;
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
          this._config.certificateArn = certificateArn;
          
          this._addToCf(services, domain, certificateArn);
          this._addToApg(services, domain, certificateArn);
          
          this._readyTeardown = true;
          
          return this;
        }

        this._readyTeardown = true;
        this._allowRunCf = true;
        this._allowRunApg = true;
      });

      return this;
    }

    this._allowRunCf = true;
    this._allowRunApg = true;
    this._readyTeardown = true;

    return this;
  }
  
  /**
   * @param {*} services
   * @param {String} domain
   * @param {String} certificateArn
   * 
   * @private
   */
  _addToApg(services, domain, certificateArn) {
    services.find(APIGatewayService).certificateArn = certificateArn;
    this._allowRunApg = true;
  }
  
  /**
   * @param {*} services
   * @param {String} domain
   * @param {String} certificateArn
   * 
   * @private
   */
  _addToCf(services, domain, certificateArn) {
    let domainAliases = this._certificateDomainAliases;
    let distMetadata = services.find(CloudFrontService).distMetadata;
    
    distMetadata.ViewerCertificate = {
      ACMCertificateArn: certificateArn,
      CertificateSource: 'acm',
      CloudFrontDefaultCertificate: false,
      SSLSupportMethod: 'sni-only', // 'vip' one charges 600$/month prorated
    };
    
    // enfore https on CF distribution
    distMetadata.ViewerProtocolPolicy =  'redirect-to-https';
    
    let aliases = domainAliases && domainAliases.length > 0 
      ? domainAliases.map(alias => `${alias}.${domain}`)
      : [ domain ];
    
    distMetadata.Aliases = {
      Quantity: aliases.length,
      Items: aliases,
    };
    
    this._allowRunCf = true;
  }

  /**
   * @returns {String|null}
   * @private
   */
  get _certificateDomain() {
    return this.provisioning.property.config.domain;
  }
  
  /**
   * @returns {String[]|null}
   * @private
   */
  get _certificateDomainAliases() {
    return this.provisioning.property.config.domainAliases;
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
   * @returns {*}
   */
  ensureCertificate(domain, cb) {
    let domainRoot = this.extractDomainRoot(domain);
    
    if (!domainRoot) {
      return cb(null, domainRoot);
    }
    
    this.getDomainCertificateArn(domainRoot, (certArn) => {
      if (certArn) {
        cb(null, certArn);
        return;
      }

      console.warn(
        `Certificate for domain ${domainRoot} must be created manually. Skipping...`
      );
      
      return cb(null, null);

      // this.createCertificate(domainRoot, (error, certArn) => {
      //   cb(error, certArn);
      // });
    });
  }
  
  /**
   * @param {String} domain
   * @returns {String}
   */
  extractDomainRoot(domain) {
    let domainParts = domain.split('.');
    
    if (domainParts.length < 2) {
      return null;
    }
    
    let domainExt = domainParts.pop();
    let domainName = domainParts.pop();
    
    return `${domainName}.${domainExt}`;
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
