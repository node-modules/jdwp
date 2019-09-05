'use strict';

class Location {
  constructor(vm, method, codeIndex) {
    this.vm = vm;
    this.method = method;
    this.methodRef = null;
    this.codeIndex = method && method.isNative ? -1 : codeIndex;
    this.declaringType = method && method.declaringType;

    this.baseLineInfo = null;
    this.otherLineInfo = null;
  }

  async getBaseLineInfo(stratum) {
    /* check if there is cached info to use */
    if (this.baseLineInfo) {
      return this.baseLineInfo;
    }

    /* compute the line info */
    const lineInfo = await this.method.codeIndexToLineInfo(stratum, this.codeIndex);
    /* cache it */
    this.baseLineInfo = lineInfo;
    return lineInfo;
  }

  async getMethod() {
    if (!this.method) {
      this.method = await this.declaringType.getMethod(this.methodRef);
      if (this.method.isNative) {
        this.codeIndex = -1;
      }
    }
    return this.method;
  }

  async getLineInfo(stratum) {
    /* base stratum is done slighly differently */
    if (stratum.isJava) {
      return await this.getBaseLineInfo(stratum);
    }
    throw new Error('not supported');
  }
}

module.exports = Location;
