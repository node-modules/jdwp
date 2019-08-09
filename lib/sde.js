'use strict';

const path = require('path');

const INIT_SIZE_FILE = 3;
const INIT_SIZE_LINE = 100;
const INIT_SIZE_STRATUM = 3;
const BASE_STRATUM_NAME = 'Java';

class FileTableRecord {
  constructor() {
    this.sourceName = null;
    this.sourcePath = null;
    this.isConverted = false;
  }

  async getSourcePath(refType) {
    if (!this.isConverted) {
      if (!this.sourcePath) {
        this.sourcePath = await refType.getBaseSourceDir() + this.sourceName;
      } else {
        this.sourcePath = path.join(...this.sourcePath.split('/'));
      }
      this.isConverted = true;
    }
    return this.sourcePath;
  }
}

class LineStratum {
  constructor(sti, lti, refType, jplsLine) {
    this.sti = sti;
    this.lti = lti;
    this.refType = refType;
    this.jplsLine = jplsLine;
    this.sourceName = null;
    this.sourcePath = null;
  }

  get sde() {
    return this.sti.sde;
  }

  lineNumber() {
    return this.sde.stiLineNumber(this.sti, this.lti, this.jplsLine);
  }

  async getSourceInfo() {
    if (this.sourceName) return;

    const fti = this.sde.stiFileTableIndex(this.sti, this.lti);
    if (fti === -1) {
      throw new Error(
        'Bad SourceDebugExtension, no matching source id ' +
        this.sde.lineTable[this.lti].fileId + ' jplsLine: ' + this.jplsLine);
    }
    const ftr = this.sde.fileTable[fti];
    this.sourceName = ftr.sourceName;
    this.sourcePath = await ftr.getSourcePath(this.refType);
  }

  async getSourceName() {
    await this.getSourceInfo();
    return this.sourceName;
  }

  async getSourcePath() {
    await this.getSourceInfo();
    return this.sourcePath;
  }
}

class Stratum {
  constructor(sti, sde) {
    this.sti = sti;
    this.sde = sde;
  }

  get id() {
    return this.sde.stratumTable[this.sti].id;
  }

  get isJava() {
    return this.sti === this.sde.baseStratumIndex;
  }

  sourceNames() {
    const fileIndexStart = this.sde.stratumTable[this.sti].fileIndex;
    /* one past end */
    const fileIndexEnd = this.sde.stratumTable[this.sti + 1].fileIndex;
    const result = [];
    for (let i = fileIndexStart; i < fileIndexEnd; ++i) {
      result.push(this.sde.fileTable[i].sourceName);
    }
    return result;
  }

  async sourcePaths(refType) {
    const fileIndexStart = this.sde.stratumTable[this.sti].fileIndex;
    /* one past end */
    const fileIndexEnd = this.sde.stratumTable[this.sti + 1].fileIndex;
    const result = [];
    for (let i = fileIndexStart; i < fileIndexEnd; ++i) {
      result.push(await this.sde.fileTable[i].getSourcePath(refType));
    }
    return result;
  }

  lineStratum(refType, jplsLine) {
    const lti = this.sde.stiLineTableIndex(this.sti, jplsLine);
    if (lti < 0) {
      return null;
    }
    return new LineStratum(this.sti, lti, refType, jplsLine);
  }
}

class SDE {
  constructor(sourceDebugExtension) {
    this.fileIndex = 0;
    this.lineIndex = 0;
    this.stratumIndex = 0;
    this.currentFileId = 0;
    this.defaultStratumIndex = -1;
    this.baseStratumIndex = -2;
    this.sdePos = 0;
    this.jplsFilename = null;
    this.defaultStratumId = null;
    this.isValid = false;

    this.fileTable = null;
    this.lineTable = null;
    this.stratumTable = null;

    if (sourceDebugExtension) {
      this.sourceDebugExtension = sourceDebugExtension;
      this.decode();
    } else {
      this.sourceDebugExtension = null;
      this.createProxyForAbsentSDE();
    }
  }

  createProxyForAbsentSDE() {
    this.jplsFilename = null;
    this.defaultStratumId = BASE_STRATUM_NAME;
    this.defaultStratumIndex = 0;
    this.createJavaStratum();
    this.storeStratum('*terminator*');
  }

  createJavaStratum() {
    this.baseStratumIndex = 0;
    this.storeStratum(BASE_STRATUM_NAME);
    this.storeFile(1, this.jplsFilename, null);
    this.storeLine(1, 65536, 1, 1, 65536, 1);
    this.storeStratum('Aux');
  }

  storeStratum(stratumId) {
    if (this.stratumIndex > 0) {
      if ((this.stratumTable[this.stratumIndex - 1].fileIndex === this.fileIndex) &&
        (this.stratumTable[this.stratumIndex - 1].lineIndex === this.lineIndex)) {
        /* nothing changed overwrite it */
        --this.stratumIndex;
      }
    }
    this.assureStratumTableSize();
    this.stratumTable[this.stratumIndex].id = stratumId;
    this.stratumTable[this.stratumIndex].fileIndex = this.fileIndex;
    this.stratumTable[this.stratumIndex].lineIndex = this.lineIndex;
    ++this.stratumIndex;
    this.currentFileId = 0;
  }

  storeFile(fileId, sourceName, sourcePath) {
    this.assureFileTableSize();
    this.fileTable[this.fileIndex].fileId = fileId;
    this.fileTable[this.fileIndex].sourceName = sourceName;
    this.fileTable[this.fileIndex].sourcePath = sourcePath;
    ++this.fileIndex;
  }

  storeLine(jplsStart, jplsEnd, jplsLineInc, njplsStart, njplsEnd, fileId) {
    this.assureLineTableSize();
    this.lineTable[this.lineIndex].jplsStart = jplsStart;
    this.lineTable[this.lineIndex].jplsEnd = jplsEnd;
    this.lineTable[this.lineIndex].jplsLineInc = jplsLineInc;
    this.lineTable[this.lineIndex].njplsStart = njplsStart;
    this.lineTable[this.lineIndex].njplsEnd = njplsEnd;
    this.lineTable[this.lineIndex].fileId = fileId;
    ++this.lineIndex;
  }

  stratumSection() {
    this.storeStratum(this.readLine());
  }

  fileSection() {
    this.ignoreLine();
    while (this.sdePeek() !== '*') {
      this.fileLine();
    }
  }

  lineLine() {
    let lineCount = 1;
    let lineIncrement = 1;
    const njplsStart = this.readNumber();

    /* is there a fileID? */
    if (this.sdePeek() === '#') {
      this.sdeAdvance();
      this.currentFileId = this.readNumber();
    }

    /* is there a line count? */
    if (this.sdePeek() === ',') {
      this.sdeAdvance();
      lineCount = this.readNumber();
    }

    if (this.sdeRead() !== ':') {
      this.syntax();
    }
    const jplsStart = this.readNumber();
    if (this.sdePeek() === ',') {
      this.sdeAdvance();
      lineIncrement = this.readNumber();
    }
    this.ignoreLine(); /* flush the rest */

    this.storeLine(jplsStart,
      jplsStart + (lineCount * lineIncrement) - 1,
      lineIncrement,
      njplsStart,
      njplsStart + lineCount - 1,
      this.currentFileId);
  }


  lineSection() {
    this.ignoreLine();
    while (this.sdePeek() !== '*') {
      this.lineLine();
    }
  }

  ignoreSection() {
    this.ignoreLine();
    while (this.sdePeek() !== '*') {
      this.ignoreLine();
    }
  }

  fileLine() {
    let hasAbsolute = 0; /* acts as boolean */
    let sourcePath = null;

    /* is there an absolute filename? */
    if (this.sdePeek() === '+') {
      this.sdeAdvance();
      hasAbsolute = 1;
    }
    const fileId = this.readNumber();
    const sourceName = this.readLine();
    if (hasAbsolute === 1) {
      sourcePath = this.readLine();
    }

    this.storeFile(fileId, sourceName, sourcePath);
  }

  decode() {
    const { sourceDebugExtension } = this;
    if (sourceDebugExtension.length < 4 || !sourceDebugExtension.startsWith('SMAP')) {
      return;
    }
    this.sdePos = 4;
    this.ignoreLine(); /* flush the rest */
    this.jplsFilename = this.readLine();
    this.defaultStratumId = this.readLine();
    this.createJavaStratum();
    let isEnd = false;
    while (!isEnd) {
      if (this.sdeRead() !== '*') {
        this.syntax();
      }
      switch (this.sdeRead()) {
        case 'S':
          this.stratumSection();
          break;
        case 'F':
          this.fileSection();
          break;
        case 'L':
          this.lineSection();
          break;
        case 'E':
          /* set end points */
          this.storeStratum('*terminator*');
          this.isValid = true;
          isEnd = true;
          return;
        default:
          this.ignoreSection();
          break;
      }
    }
  }

  syntax() {
    throw new Error('bad SourceDebugExtension syntax - position ' + this.sdePos);
  }

  sdePeek() {
    if (this.sdePos >= this.sourceDebugExtension.length) this.syntax();
    return this.sourceDebugExtension[this.sdePos];
  }

  sdeRead() {
    if (this.sdePos >= this.sourceDebugExtension.length) this.syntax();
    return this.sourceDebugExtension[this.sdePos++];
  }

  sdeAdvance() {
    this.sdePos++;
  }

  ignoreWhite() {
    let ch;
    while (((ch = this.sdePeek()) === ' ') || (ch === '\t')) {
      this.sdeAdvance();
    }
  }

  ignoreLine() {
    let ch;
    while (((ch = this.sdeRead()) !== '\n') && (ch !== '\r')) {
      //
    }
    /* check for CR LF */
    if ((ch === '\r') && (this.sdePeek() === '\n')) {
      this.sdeAdvance();
    }
    this.ignoreWhite(); /* leading white */
  }

  readNumber() {
    let value = 0;
    let ch;

    this.ignoreWhite();
    while (((ch = this.sdePeek()) >= '0') && (ch <= '9')) {
      this.sdeAdvance();
      value = (value * 10) + ch - '0';
    }
    this.ignoreWhite();
    return value;
  }

  readLine() {
    let str = '';
    let ch;
    this.ignoreWhite();
    while (((ch = this.sdeRead()) !== '\n') && (ch !== '\r')) {
      str += ch;
    }
    // check for CR LF
    if ((ch === '\r') && (this.sdePeek() === '\n')) {
      this.sdeRead();
    }
    this.ignoreWhite(); // leading white
    return str;
  }

  assureLineTableSize() {
    const len = this.lineTable ? this.lineTable.length : 0;
    if (this.lineIndex >= len) {
      let i;
      const newLen = len === 0 ? INIT_SIZE_LINE : len * 2;
      const newTable = [];
      for (i = 0; i < len; ++i) {
        newTable[i] = this.lineTable[i];
      }
      for (; i < newLen; ++i) {
        newTable[i] = {
          jplsStart: 0,
          jplsEnd: 0,
          jplsLineInc: 0,
          njplsStart: 0,
          njplsEnd: 0,
          fileId: 0,
        };
      }
      this.lineTable = newTable;
    }
  }

  assureFileTableSize() {
    const len = this.fileTable ? this.fileTable.length : 0;
    if (this.fileIndex >= len) {
      let i;
      const newLen = len === 0 ? INIT_SIZE_FILE : len * 2;
      const newTable = [];
      for (i = 0; i < len; ++i) {
        newTable[i] = this.fileTable[i];
      }
      for (; i < newLen; ++i) {
        newTable[i] = new FileTableRecord();
      }
      this.fileTable = newTable;
    }
  }

  assureStratumTableSize() {
    const len = this.stratumTable ? this.stratumTable.length : 0;
    if (this.stratumIndex >= len) {
      let i;
      const newLen = len === 0 ? INIT_SIZE_STRATUM : len * 2;
      const newTable = [];
      for (i = 0; i < len; ++i) {
        newTable[i] = this.stratumTable[i];
      }
      for (; i < newLen; ++i) {
        newTable[i] = {
          id: null,
          fileIndex: 0,
          lineIndex: 0,
        };
      }
      this.stratumTable = newTable;
    }
  }

  get defaultStratumTableIndex() {
    if ((this.defaultStratumIndex === -1) && (this.defaultStratumId != null)) {
      this.defaultStratumIndex = this.stratumTableIndex(this.defaultStratumId);
    }
    return this.defaultStratumIndex;
  }

  stratumTableIndex(stratumId) {
    if (!stratumId) {
      return this.defaultStratumTableIndex;
    }
    for (let i = 0; i < (this.stratumIndex - 1); ++i) {
      if (this.stratumTable[i].id === stratumId) {
        return i;
      }
    }
    return this.defaultStratumTableIndex;
  }

  stratum(stratumID) {
    const sti = this.stratumTableIndex(stratumID);
    return new Stratum(sti, this);
  }

  stiLineTableIndex(sti, jplsLine) {
    const lineIndexStart = this.stratumTable[sti].lineIndex;
    /* one past end */
    const lineIndexEnd = this.stratumTable[sti + 1].lineIndex;
    for (let i = lineIndexStart; i < lineIndexEnd; ++i) {
      if ((jplsLine >= this.lineTable[i].jplsStart) &&
        (jplsLine <= this.lineTable[i].jplsEnd)) {
        return i;
      }
    }
    return -1;
  }

  stiLineNumber(sti, lti, jplsLine) {
    return this.lineTable[lti].njplsStart +
      (((jplsLine - this.lineTable[lti].jplsStart) /
        this.lineTable[lti].jplsLineInc));
  }

  fileTableIndex(sti, fileId) {
    const fileIndexStart = this.stratumTable[sti].fileIndex;
    /* one past end */
    const fileIndexEnd = this.stratumTable[sti + 1].fileIndex;
    for (let i = fileIndexStart; i < fileIndexEnd; ++i) {
      if (this.fileTable[i].fileId === fileId) {
        return i;
      }
    }
    return -1;
  }

  stiFileTableIndex(sti, lti) {
    return this.fileTableIndex(sti, this.lineTable[lti].fileId);
  }
}

module.exports = SDE;
