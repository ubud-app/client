'use strict';

const configurationData = {
    build: {
        id: '@@CONFIGURATION_BUILD_ID' || null,
        version: '@@CONFIGURATION_BUILD_VERSION' || null,
        commit: '@@CONFIGURATION_BUILD_COMMIT' || null,
        production: !!('@@CONFIGURATION_PRODUCTION') || false,
        environment: '@@CONFIGURATION_BUILD_ENVIRONMENT' || null
    },
    endpoint: '@@CONFIGURATION_ENDPOINT' || null,
    raven: '@@CONFIGURATION_RAVEN' || null
};

export default class ConfigurationHelper {
    static getBuildId() {
        return configurationData.build.id;
    }

    static getBuildVersion() {
        return configurationData.build.version;
    }

    static getBuildCommit() {
        return configurationData.build.commit;
    }

    static getBuildEnvironment() {
        return configurationData.build.environment;
    }

    static isProduction() {
        return !!configurationData.build.production;
    }

    static getEndpoint() {
        return configurationData.endpoint;
    }

    static getRavenURL() {
        return configurationData.raven;
    }
}
