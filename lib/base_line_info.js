'use strict';

class BaseLineInfo {
  constructor(lineNumber, declaringType) {
    this.lineNumber = lineNumber;
    this.declaringType = declaringType;
  }

  get liStratum() {
    return 'Java';
  }

  get liLineNumber() {
    return this.lineNumber;
  }

  async getLiSourceName() {
    return await this.declaringType.getBaseSourceName();
  }

  async getLiSourcePath() {
    return await this.declaringType.getBaseSourcePath();
  }
}

module.exports = BaseLineInfo;
