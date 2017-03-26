deep-package-manager
====================

[![NPM Version](https://img.shields.io/npm/v/deep-package-manager.svg)](https://npmjs.org/package/deep-package-manager)
[![Build Status](https://travis-ci.com/MitocGroup/deep-package-manager.svg?token=K6deyi9kwkfxRyXwcv6c)](https://travis-ci.com/MitocGroup/deep-package-manager)
[![Test Coverage](https://codeclimate.com/repos/5789fdc03a2d0a0079006680/badges/392fd8f92c5b59a95be2/coverage.svg)](https://codeclimate.com/repos/5789fdc03a2d0a0079006680/coverage)
[![API Docs](http://docs.deep.mg/badge.svg)](http://docs.deep.mg)

deep-package-manager is the software development tool-chain that abstracts package management and associated development operations. This CLI
(aka Command Line Interface) is a Node.js library that works in combination with [DEEP Framework](https://github.com/MitocGroup/deep-framework).


## Getting Started

### Step 1. Pre-requisites

- [x] [Create an Amazon Web Services account](https://www.youtube.com/watch?v=WviHsoz8yHk)
- [x] [Configure AWS Command Line Interface](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)
- [x] [Get Started - Installing Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [x] [JDK 8 and JRE 8 Installation Start Here](https://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html)
- [x] [Install nvm](https://github.com/creationix/nvm#install-script) and [use node v6.10+](https://github.com/creationix/nvm#usage)
- [ ] Install DEEP CLI, also known as `deepify`:

```bash
npm install deepify -g
```

> If you want to use `deepify` on Windows, please follow the steps from
[Windows Configuration](https://github.com/MitocGroup/deep-framework/blob/master/docs/windows.md)
before running `npm install deepify -g` and make sure all `npm` and `deepify` commands are executed
inside Git Bash.

### Step 2. Install Microservice(s) Locally

```bash
deepify install github://MitocGroup/deep-microservices-helloworld ~/deep-microservices-helloworld
```

> Path parameter in all `deepify` commands is optional and if not specified, assumes current
working directory. Therefore you can skip `~/deep-microservices-helloworld` by executing
`mkdir ~/deep-microservices-helloworld && cd ~/deep-microservices-helloworld` before `deepify install`.

### Step 3. Run Microservice(s) in Development

```bash
deepify server ~/deep-microservices-helloworld -o
```

> When this step is finished, you can open in your browser the link *http://localhost:8000*
and enjoy the deep-microservices-helloworld running locally.

### Step 4. Deploy Microservice(s) to Production

```bash
deepify deploy ~/deep-microservices-helloworld
```

> Amazon CloudFront distribution takes up to 20 minutes to provision, therefore don’t worry
if it returns an HTTP error in the first couple of minutes.

### Step 5. Remove Microservice(s) from Production

```bash
deepify undeploy ~/deep-microservices-helloworld
```

> Amazon CloudFront distribution takes up to 20 minutes to unprovision. That's why `deepify`
command checks every 30 seconds if it's disabled and when successful, removes it from your account.


## Developer Resources

Having questions related to deep-package-manager?

- Ask questions: https://stackoverflow.com/questions/tagged/deep-framework
- Chat with us: https://mitocgroup.slack.com/messages/general
- Send an email: feedback@mitocgroup.com

Interested in contributing to deep-package-manager?

- Contributing: https://github.com/MitocGroup/deep-package-manager/blob/master/CONTRIBUTING.md
- Issue tracker: https://github.com/MitocGroup/deep-package-manager/issues
- Releases: https://github.com/MitocGroup/deep-package-manager/releases
- Roadmap: https://github.com/MitocGroup/deep-package-manager/blob/master/ROADMAP.md

Looking for web applications that use (or are similar to) deep-package-manager?

- Hello World: https://hello.deep.mg | https://github.com/MitocGroup/deep-microservices-helloworld
- Todo App: https://todo.deep.mg | https://github.com/MitocGroup/deep-microservices-todomvc
- AdTechMedia: https://www.adtechmedia.io | https://github.com/AdTechMedia/adtechmedia-website


## Sponsors

This repository is being sponsored by:
- [Mitoc Group](https://www.mitocgroup.com)
- [AdTechMedia](https://www.adtechmedia.io)

This code can be used under MIT license:
> See [LICENSE](https://github.com/MitocGroup/deep-package-manager/blob/master/LICENSE) for more details.
