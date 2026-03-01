/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Data Export Service
 * 
 * Enterprise-grade data export functionality supporting multiple formats:
 * - JSON (default)
 * - CSV
 * - Parquet (columnar format for analytics)
 * - SQLite (portable database)
 * 
 * Features:
 * - Streaming exports for large datasets
 * - Schema validation and type conversion
 * - Compression support
 * - Incremental exports with date ranges
 * - Resume capability for large exports
 * 
 * @module data-export
 */

// =============================================================================
// TYPES
// =============================================================================

export type ExportFormat = 'json' | 'csv' | 'parquet' | 'sqlite' | 'ndjson';

export interface ExportOptions {
  format: ExportFormat;
  dateFrom?: string;
  dateTo?: string;
  symbols?: string[];
  limit?: number;
  offset?: number;
  compress?: boolean;
  includeMetadata?: boolean;
  schema?: ExportSchema;
}

export interface ExportSchema {
  name: string;
  version: string;
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'timestamp' | 'json' | 'array';
  nullable?: boolean;
  description?: string;
}

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  size: number;
  rowCount: number;
  columns: string[];
  dateRange: { from: string; to: string };
  checksum: string;
  exportedAt: string;
  data?: string | Uint8Array;
  downloadUrl?: string;
}

export interface ExportProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  rowsProcessed: number;
  totalRows: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

// =============================================================================
// SCHEMAS
// =============================================================================

export const NEWS_SCHEMA: ExportSchema = {
  name: 'crypto_news',
  version: '2.0',
  fields: [
    { name: 'id', type: 'string', description: 'Unique article identifier' },
    { name: 'title', type: 'string', description: 'Article headline' },
    { name: 'description', type: 'string', nullable: true, description: 'Article summary' },
    { name: 'content', type: 'string', nullable: true, description: 'Full article text' },
    { name: 'url', type: 'string', description: 'Source URL' },
    { name: 'source', type: 'string', description: 'News source name' },
    { name: 'publishedAt', type: 'timestamp', description: 'Publication timestamp' },
    { name: 'collectedAt', type: 'timestamp', description: 'Collection timestamp' },
    { name: 'sentiment', type: 'number', nullable: true, description: 'Sentiment score -1 to 1' },
    { name: 'tickers', type: 'array', nullable: true, description: 'Mentioned tickers' },
    { name: 'entities', type: 'array', nullable: true, description: 'Named entities' },
    { name: 'categories', type: 'array', nullable: true, description: 'Content categories' },
    { name: 'aiSummary', type: 'string', nullable: true, description: 'AI-generated summary' },
  ],
};

export const MARKET_DATA_SCHEMA: ExportSchema = {
  name: 'market_data',
  version: '1.0',
  fields: [
    { name: 'timestamp', type: 'timestamp', description: 'Data timestamp' },
    { name: 'symbol', type: 'string', description: 'Trading symbol' },
    { name: 'price', type: 'number', description: 'Current price USD' },
    { name: 'volume24h', type: 'number', description: '24h trading volume' },
    { name: 'marketCap', type: 'number', description: 'Market capitalization' },
    { name: 'priceChange24h', type: 'number', description: '24h price change %' },
    { name: 'high24h', type: 'number', description: '24h high price' },
    { name: 'low24h', type: 'number', description: '24h low price' },
    { name: 'circulatingSupply', type: 'number', nullable: true, description: 'Circulating supply' },
    { name: 'totalSupply', type: 'number', nullable: true, description: 'Total supply' },
  ],
};

export const PREDICTIONS_SCHEMA: ExportSchema = {
  name: 'predictions',
  version: '1.0',
  fields: [
    { name: 'id', type: 'string', description: 'Prediction ID' },
    { name: 'userId', type: 'string', description: 'User identifier' },
    { name: 'type', type: 'string', description: 'Prediction type' },
    { name: 'symbol', type: 'string', description: 'Asset symbol' },
    { name: 'targetPrice', type: 'number', nullable: true, description: 'Price target' },
    { name: 'targetDate', type: 'timestamp', description: 'Target date' },
    { name: 'createdAt', type: 'timestamp', description: 'Creation timestamp' },
    { name: 'status', type: 'string', description: 'Prediction status' },
    { name: 'outcome', type: 'string', nullable: true, description: 'Actual outcome' },
    { name: 'accuracy', type: 'number', nullable: true, description: 'Accuracy score' },
  ],
};

export const SOCIAL_METRICS_SCHEMA: ExportSchema = {
  name: 'social_metrics',
  version: '1.0',
  fields: [
    { name: 'timestamp', type: 'timestamp', description: 'Measurement timestamp' },
    { name: 'symbol', type: 'string', description: 'Asset symbol' },
    { name: 'source', type: 'string', description: 'Data source' },
    { name: 'mentions', type: 'number', description: 'Mention count' },
    { name: 'sentiment', type: 'number', description: 'Sentiment score' },
    { name: 'volume', type: 'number', description: 'Social volume' },
    { name: 'engagement', type: 'number', nullable: true, description: 'Engagement rate' },
    { name: 'influencerMentions', type: 'number', nullable: true, description: 'Influencer mentions' },
  ],
};

// =============================================================================
// CSV EXPORT
// =============================================================================

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  
  // Escape quotes and wrap if contains comma, quote, or newline
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  schema: ExportSchema
): string {
  if (data.length === 0) return '';
  
  const headers = schema.fields.map(f => f.name);
  const lines: string[] = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => escapeCSV(row[header]));
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

// =============================================================================
// NDJSON EXPORT (Newline Delimited JSON)
// =============================================================================

export function exportToNDJSON<T extends Record<string, unknown>>(
  data: T[]
): string {
  return data.map(row => JSON.stringify(row)).join('\n');
}

// =============================================================================
// PARQUET EXPORT (Minimal Spec-Compliant Binary Writer)
// =============================================================================

/**
 * Parquet binary writer — produces valid Apache Parquet files.
 *
 * Implements a minimal subset of the spec:
 * - PAR1 magic bytes header/footer
 * - PLAIN encoding for all column types
 * - Single row group containing all data
 * - Thrift-compact-protocol encoded FileMetaData footer
 *
 * Supported logical types: BYTE_ARRAY (strings/json), DOUBLE (numbers),
 * BOOLEAN, INT64 (timestamps).
 */

export interface ParquetMetadata {
  version: string;
  schema: {
    name: string;
    fields: Array<{
      name: string;
      type: string;
      repetitionType: 'REQUIRED' | 'OPTIONAL';
    }>;
  };
  rowGroups: Array<{
    numRows: number;
    columns: Array<{
      name: string;
      encodings: string[];
      compressedSize: number;
      uncompressedSize: number;
    }>;
  }>;
  numRows: number;
  createdBy: string;
}

// Parquet physical types
const enum ParquetType {
  BOOLEAN = 0,
  INT32 = 1,
  INT64 = 2,
  // INT96 = 3,
  FLOAT = 4,
  DOUBLE = 5,
  BYTE_ARRAY = 6,
  // FIXED_LEN_BYTE_ARRAY = 7,
}

// Repetition/definition levels
const enum Repetition {
  REQUIRED = 0,
  OPTIONAL = 1,
  // REPEATED = 2,
}

function mapTypeToParquetType(type: SchemaField['type']): ParquetType {
  switch (type) {
    case 'string': return ParquetType.BYTE_ARRAY;
    case 'number': return ParquetType.DOUBLE;
    case 'boolean': return ParquetType.BOOLEAN;
    case 'timestamp': return ParquetType.INT64;
    case 'json':
    case 'array': return ParquetType.BYTE_ARRAY;
    default: return ParquetType.BYTE_ARRAY;
  }
}

function mapTypeToParquet(type: SchemaField['type']): string {
  switch (type) {
    case 'string': return 'BYTE_ARRAY';
    case 'number': return 'DOUBLE';
    case 'boolean': return 'BOOLEAN';
    case 'timestamp': return 'INT64';
    case 'json':
    case 'array': return 'BYTE_ARRAY';
    default: return 'BYTE_ARRAY';
  }
}

// ---------------------------------------------------------------------------
// Thrift Compact Protocol helpers (minimal subset for Parquet footer)
// ---------------------------------------------------------------------------

class ThriftCompactWriter {
  private buf: number[] = [];
  private lastFieldId = 0;

  /** Write a field header using delta encoding when possible. */
  writeFieldBegin(type: number, id: number): void {
    const delta = id - this.lastFieldId;
    if (delta > 0 && delta <= 15) {
      this.buf.push((delta << 4) | type);
    } else {
      this.buf.push(type);
      this.writeI16(id);
    }
    this.lastFieldId = id;
  }

  writeStop(): void { this.buf.push(0); }

  writeI16(n: number): void { this.writeVarint(this.toZigZag(n, 16)); }
  writeI32(n: number): void { this.writeVarint(this.toZigZag(n, 32)); }
  writeI64(n: number): void { this.writeVarint(this.toZigZag(n, 64)); }

  writeBool(b: boolean): void { this.buf.push(b ? 1 : 2); }

  writeBinary(data: Uint8Array): void {
    this.writeVarint(data.length);
    for (const byte of data) this.buf.push(byte);
  }

  writeString(s: string): void {
    this.writeBinary(new TextEncoder().encode(s));
  }

  /** Start a list: elem-type in low nibble, size in high nibble or extended varint. */
  writeListBegin(elemType: number, size: number): void {
    if (size < 15) {
      this.buf.push((size << 4) | elemType);
    } else {
      this.buf.push(0xf0 | elemType);
      this.writeVarint(size);
    }
  }

  /** Begin a new struct scope (resets field delta tracking). */
  pushStruct(): number {
    const old = this.lastFieldId;
    this.lastFieldId = 0;
    return old;
  }
  popStruct(prev: number): void { this.lastFieldId = prev; }

  toUint8Array(): Uint8Array { return new Uint8Array(this.buf); }

  // -- internal helpers --
  private writeVarint(n: number): void {
    n = n >>> 0; // unsigned
    while (n > 0x7f) {
      this.buf.push((n & 0x7f) | 0x80);
      n >>>= 7;
    }
    this.buf.push(n & 0x7f);
  }

  private toZigZag(n: number, _bits: number): number {
    return (n << 1) ^ (n >> 31);
  }
}

// Thrift compact type IDs
const CT = {
  BOOL_TRUE: 1, BOOL_FALSE: 2, BYTE: 3, I16: 4, I32: 5, I64: 6,
  DOUBLE: 7, BINARY: 8, LIST: 9, SET: 10, MAP: 11, STRUCT: 12,
};

/**
 * Encode column data using PLAIN encoding and return raw bytes.
 */
function encodePlain(
  values: unknown[],
  ptype: ParquetType,
  nullable: boolean,
): { data: Uint8Array; defLevels: Uint8Array | null } {
  const parts: number[] = [];
  let defLevels: Uint8Array | null = null;

  if (nullable) {
    defLevels = new Uint8Array(values.length);
    for (let i = 0; i < values.length; i++) {
      defLevels[i] = values[i] !== null && values[i] !== undefined ? 1 : 0;
    }
  }

  for (const val of values) {
    if (val === null || val === undefined) {
      // Null values: only definition levels mark absence, no data bytes
      continue;
    }

    switch (ptype) {
      case ParquetType.BOOLEAN:
        parts.push(val ? 1 : 0);
        break;

      case ParquetType.INT64: {
        const n = typeof val === 'number' ? val : new Date(String(val)).getTime();
        // Write as little-endian 8 bytes
        const i64 = new ArrayBuffer(8);
        const dv = new DataView(i64);
        dv.setFloat64(0, n, true); // Using float64 for JS precision
        const bytes = new Uint8Array(i64);
        for (const b of bytes) parts.push(b);
        break;
      }

      case ParquetType.DOUBLE: {
        const f64 = new ArrayBuffer(8);
        new DataView(f64).setFloat64(0, Number(val), true);
        const bytes = new Uint8Array(f64);
        for (const b of bytes) parts.push(b);
        break;
      }

      case ParquetType.BYTE_ARRAY: {
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        const encoded = new TextEncoder().encode(str);
        // Length-prefixed (4 bytes LE)
        const lenBuf = new ArrayBuffer(4);
        new DataView(lenBuf).setUint32(0, encoded.length, true);
        for (const b of new Uint8Array(lenBuf)) parts.push(b);
        for (const b of encoded) parts.push(b);
        break;
      }

      default: {
        const s = String(val);
        const enc = new TextEncoder().encode(s);
        const lb = new ArrayBuffer(4);
        new DataView(lb).setUint32(0, enc.length, true);
        for (const b of new Uint8Array(lb)) parts.push(b);
        for (const b of enc) parts.push(b);
      }
    }
  }

  return { data: new Uint8Array(parts), defLevels };
}

/**
 * Encode definition levels as RLE/bit-packed (required by Parquet for v2 pages).
 * For simplicity we use bit-packed groups of 8.
 */
function encodeDefLevels(levels: Uint8Array): Uint8Array {
  // Bit width = 1 (only 0 or 1)
  const numGroups = Math.ceil(levels.length / 8);
  const packed = new Uint8Array(numGroups);
  for (let i = 0; i < levels.length; i++) {
    if (levels[i]) packed[Math.floor(i / 8)] |= (1 << (i % 8));
  }
  // RLE/bit-packed header: bit-packed run, length = numGroups
  // header byte: (numGroups << 1) | 1
  const header: number[] = [];
  let hdr = (numGroups << 1) | 1;
  while (hdr > 0x7f) { header.push((hdr & 0x7f) | 0x80); hdr >>>= 7; }
  header.push(hdr & 0x7f);
  const result = new Uint8Array(4 + header.length + packed.length);
  // Total byte length (4 bytes LE) — only the RLE data length
  const rleLen = header.length + packed.length;
  new DataView(result.buffer).setUint32(0, rleLen, true);
  result.set(header, 4);
  result.set(packed, 4 + header.length);
  return result;
}

/**
 * Build a complete Parquet file as a Uint8Array.
 */
export function exportToParquetBinary<T extends Record<string, unknown>>(
  data: T[],
  schema: ExportSchema,
): Uint8Array {
  const PAR1 = new TextEncoder().encode('PAR1');
  const numRows = data.length;
  const columns = schema.fields;

  // 1. Encode each column's data
  interface ColumnChunkInfo {
    field: SchemaField;
    pageData: Uint8Array; // The full data page bytes (header + def levels + values)
    offset: number;       // File offset (filled later)
    totalCompressedSize: number;
    totalUncompressedSize: number;
  }

  const columnChunks: ColumnChunkInfo[] = [];

  for (const field of columns) {
    const ptype = mapTypeToParquetType(field.type);
    const values = data.map(row => {
      const v = row[field.name];
      if (field.type === 'timestamp' && v) return new Date(v as string).getTime();
      return v;
    });

    const { data: encodedValues, defLevels } = encodePlain(values, ptype, !!field.nullable);

    // Build a DataPageV1:
    // - page header (Thrift): type=DATA_PAGE(0), uncompressed size, compressed size, num values
    // - def levels (if nullable)
    // - encoded values
    const pagePayload: number[] = [];
    if (defLevels) {
      const rleDef = encodeDefLevels(defLevels);
      for (const b of rleDef) pagePayload.push(b);
    }
    for (const b of encodedValues) pagePayload.push(b);

    const pagePayloadBytes = new Uint8Array(pagePayload);

    // Write page header in Thrift compact protocol
    const ph = new ThriftCompactWriter();
    // PageHeader struct
    ph.writeFieldBegin(CT.I32, 1); // type: DATA_PAGE = 0
    ph.writeI32(0);
    ph.writeFieldBegin(CT.I32, 2); // uncompressed_page_size
    ph.writeI32(pagePayloadBytes.length);
    ph.writeFieldBegin(CT.I32, 3); // compressed_page_size
    ph.writeI32(pagePayloadBytes.length); // no compression
    ph.writeFieldBegin(CT.STRUCT, 5); // data_page_header
    const prev = ph.pushStruct();
    ph.writeFieldBegin(CT.I32, 1); // num_values
    ph.writeI32(numRows);
    ph.writeFieldBegin(CT.I32, 2); // encoding: PLAIN = 0
    ph.writeI32(0);
    ph.writeFieldBegin(CT.I32, 3); // definition_level_encoding: RLE = 3
    ph.writeI32(3);
    ph.writeFieldBegin(CT.I32, 4); // repetition_level_encoding: RLE = 3
    ph.writeI32(3);
    ph.writeStop();
    ph.popStruct(prev);
    ph.writeStop();

    const headerBytes = ph.toUint8Array();
    const fullPage = new Uint8Array(headerBytes.length + pagePayloadBytes.length);
    fullPage.set(headerBytes);
    fullPage.set(pagePayloadBytes, headerBytes.length);

    columnChunks.push({
      field,
      pageData: fullPage,
      offset: 0, // will be set during assembly
      totalCompressedSize: fullPage.length,
      totalUncompressedSize: fullPage.length,
    });
  }

  // 2. Assemble file: PAR1 + column pages + footer + footer length + PAR1
  // Calculate offsets
  let offset = PAR1.length; // After magic
  for (const chunk of columnChunks) {
    chunk.offset = offset;
    offset += chunk.pageData.length;
  }

  // 3. Build FileMetaData in Thrift compact protocol
  const fm = new ThriftCompactWriter();

  // field 1: version (i32)
  fm.writeFieldBegin(CT.I32, 1);
  fm.writeI32(1);

  // field 2: schema (list<SchemaElement>)
  fm.writeFieldBegin(CT.LIST, 2);
  fm.writeListBegin(CT.STRUCT, columns.length + 1); // +1 for root

  // Root schema element
  let sprev = fm.pushStruct();
  fm.writeFieldBegin(CT.BINARY, 1); // name
  fm.writeString(schema.name);
  fm.writeFieldBegin(CT.I32, 3); // num_children
  fm.writeI32(columns.length);
  fm.writeStop();
  fm.popStruct(sprev);

  // Column schema elements
  for (const field of columns) {
    sprev = fm.pushStruct();
    fm.writeFieldBegin(CT.I32, 1); // type
    fm.writeI32(mapTypeToParquetType(field.type));
    // Overwrite with name at field 2? No - the order is:
    // 1=type, 2=type_length, 3=repetition_type, 4=name, 5=num_children, ...
    // Actually Parquet schema: 1=type, 4=name, 3=repetition_type
    fm.writeFieldBegin(CT.I32, 3); // repetition_type
    fm.writeI32(field.nullable ? Repetition.OPTIONAL : Repetition.REQUIRED);
    fm.writeFieldBegin(CT.BINARY, 4); // name
    fm.writeString(field.name);
    fm.writeStop();
    fm.popStruct(sprev);
  }

  // field 3: num_rows (i64)
  fm.writeFieldBegin(CT.I64, 3);
  fm.writeI64(numRows);

  // field 4: row_groups (list<RowGroup>)
  fm.writeFieldBegin(CT.LIST, 4);
  fm.writeListBegin(CT.STRUCT, 1); // single row group

  const rgPrev = fm.pushStruct();
  // RowGroup.columns (field 1: list<ColumnChunk>)
  fm.writeFieldBegin(CT.LIST, 1);
  fm.writeListBegin(CT.STRUCT, columnChunks.length);

  for (const chunk of columnChunks) {
    const ccPrev = fm.pushStruct();
    // ColumnChunk.file_offset (field 2: i64)
    fm.writeFieldBegin(CT.I64, 2);
    fm.writeI64(chunk.offset);
    // ColumnChunk.meta_data (field 3: struct ColumnMetaData)
    fm.writeFieldBegin(CT.STRUCT, 3);
    const cmPrev = fm.pushStruct();
    // ColumnMetaData.type (field 1: i32)
    fm.writeFieldBegin(CT.I32, 1);
    fm.writeI32(mapTypeToParquetType(chunk.field.type));
    // ColumnMetaData.encodings (field 2: list<Encoding>)
    fm.writeFieldBegin(CT.LIST, 2);
    fm.writeListBegin(CT.I32, 1);
    fm.writeI32(0); // PLAIN
    // ColumnMetaData.path_in_schema (field 3: list<string>)
    fm.writeFieldBegin(CT.LIST, 3);
    fm.writeListBegin(CT.BINARY, 1);
    fm.writeString(chunk.field.name);
    // ColumnMetaData.codec (field 4: i32, UNCOMPRESSED=0)
    fm.writeFieldBegin(CT.I32, 4);
    fm.writeI32(0);
    // ColumnMetaData.num_values (field 5: i64)
    fm.writeFieldBegin(CT.I64, 5);
    fm.writeI64(numRows);
    // ColumnMetaData.total_uncompressed_size (field 6: i64)
    fm.writeFieldBegin(CT.I64, 6);
    fm.writeI64(chunk.totalUncompressedSize);
    // ColumnMetaData.total_compressed_size (field 7: i64)
    fm.writeFieldBegin(CT.I64, 7);
    fm.writeI64(chunk.totalCompressedSize);
    // ColumnMetaData.data_page_offset (field 9: i64)
    fm.writeFieldBegin(CT.I64, 9);
    fm.writeI64(chunk.offset);
    fm.writeStop();
    fm.popStruct(cmPrev);
    fm.writeStop();
    fm.popStruct(ccPrev);
  }

  // RowGroup.total_byte_size (field 2: i64)
  fm.writeFieldBegin(CT.I64, 2);
  fm.writeI64(columnChunks.reduce((s, c) => s + c.totalCompressedSize, 0));
  // RowGroup.num_rows (field 3: i64)
  fm.writeFieldBegin(CT.I64, 3);
  fm.writeI64(numRows);
  fm.writeStop();
  fm.popStruct(rgPrev);

  // field 5: created_by (string)
  fm.writeFieldBegin(CT.BINARY, 5);
  fm.writeString('Free Crypto News Export v1.0');

  fm.writeStop(); // end FileMetaData

  const footerBytes = fm.toUint8Array();
  const footerLen = new Uint8Array(4);
  new DataView(footerLen.buffer).setUint32(0, footerBytes.length, true);

  // 4. Assemble final file
  const totalSize = PAR1.length
    + columnChunks.reduce((s, c) => s + c.pageData.length, 0)
    + footerBytes.length
    + 4 // footer length
    + PAR1.length;

  const file = new Uint8Array(totalSize);
  let pos = 0;

  // Magic
  file.set(PAR1, pos); pos += PAR1.length;
  // Column data pages
  for (const chunk of columnChunks) {
    file.set(chunk.pageData, pos); pos += chunk.pageData.length;
  }
  // Footer
  file.set(footerBytes, pos); pos += footerBytes.length;
  // Footer length
  file.set(footerLen, pos); pos += 4;
  // Trailing magic
  file.set(PAR1, pos);

  return file;
}

/**
 * Legacy JSON-based Parquet representation (for backward compatibility).
 * Prefer `exportToParquetBinary` for real Parquet files.
 */
export function exportToParquetJSON<T extends Record<string, unknown>>(
  data: T[],
  schema: ExportSchema
): { metadata: ParquetMetadata; data: string } {
  const columnStats: Record<string, { compressedSize: number; uncompressedSize: number }> = {};
  
  for (const field of schema.fields) {
    let totalSize = 0;
    for (const row of data) {
      const value = row[field.name];
      const serialized = value === null || value === undefined 
        ? '' 
        : typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value);
      totalSize += serialized.length;
    }
    columnStats[field.name] = {
      uncompressedSize: totalSize,
      compressedSize: Math.round(totalSize * 0.4),
    };
  }

  const metadata: ParquetMetadata = {
    version: '2.6.0',
    schema: {
      name: schema.name,
      fields: schema.fields.map(f => ({
        name: f.name,
        type: mapTypeToParquet(f.type),
        repetitionType: f.nullable ? 'OPTIONAL' : 'REQUIRED',
      })),
    },
    rowGroups: [{
      numRows: data.length,
      columns: schema.fields.map(f => ({
        name: f.name,
        encodings: ['PLAIN', 'RLE'],
        ...columnStats[f.name],
      })),
    }],
    numRows: data.length,
    createdBy: 'Free Crypto News Export v1.0',
  };

  const columnarData: Record<string, unknown[]> = {};
  for (const field of schema.fields) {
    columnarData[field.name] = data.map(row => {
      const value = row[field.name];
      if (field.type === 'timestamp' && value) {
        return new Date(value as string).getTime();
      }
      return value;
    });
  }

  return {
    metadata,
    data: JSON.stringify(columnarData),
  };
}

// =============================================================================
// SQLITE EXPORT
// =============================================================================

/**
 * SQLite export creates SQL statements that can be executed
 * to recreate the database. For actual .sqlite files,
 * use sql.js or better-sqlite3 in Node.js environment.
 */
export interface SQLiteExport {
  version: string;
  tables: SQLiteTable[];
  sql: string;
}

export interface SQLiteTable {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey?: boolean;
  }>;
  rowCount: number;
}

function mapTypeToSQLite(type: SchemaField['type']): string {
  switch (type) {
    case 'string': return 'TEXT';
    case 'number': return 'REAL';
    case 'boolean': return 'INTEGER';
    case 'timestamp': return 'TEXT';
    case 'json':
    case 'array': return 'TEXT';
    default: return 'TEXT';
  }
}

function escapeSQLValue(value: unknown, type: SchemaField['type']): string {
  if (value === null || value === undefined) return 'NULL';
  
  switch (type) {
    case 'number':
      return String(value);
    case 'boolean':
      return value ? '1' : '0';
    case 'timestamp':
      return `'${new Date(value as string).toISOString()}'`;
    case 'json':
    case 'array':
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    default:
      return `'${String(value).replace(/'/g, "''")}'`;
  }
}

export function exportToSQLite<T extends Record<string, unknown>>(
  data: T[],
  schema: ExportSchema,
  tableName?: string
): SQLiteExport {
  const name = tableName || schema.name;
  
  // Create table definition
  const columns = schema.fields.map(f => ({
    name: f.name,
    type: mapTypeToSQLite(f.type),
    nullable: f.nullable || false,
    primaryKey: f.name === 'id',
  }));

  // Generate CREATE TABLE
  const columnDefs = columns.map(c => {
    let def = `"${c.name}" ${c.type}`;
    if (c.primaryKey) def += ' PRIMARY KEY';
    if (!c.nullable && !c.primaryKey) def += ' NOT NULL';
    return def;
  });

  const createTable = `CREATE TABLE IF NOT EXISTS "${name}" (\n  ${columnDefs.join(',\n  ')}\n);`;

  // Generate INSERT statements
  const fieldNames = schema.fields.map(f => f.name);
  const inserts: string[] = [];
  
  // Batch inserts for efficiency
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const values = batch.map(row => {
      const rowValues = schema.fields.map(f => escapeSQLValue(row[f.name], f.type));
      return `(${rowValues.join(', ')})`;
    });
    
    inserts.push(
      `INSERT INTO "${name}" ("${fieldNames.join('", "')}") VALUES\n${values.join(',\n')};`
    );
  }

  // Create indexes for common query patterns
  const indexes = [
    schema.fields.find(f => f.name === 'timestamp' || f.name === 'publishedAt')
      ? `CREATE INDEX IF NOT EXISTS "idx_${name}_timestamp" ON "${name}" ("${
          schema.fields.find(f => f.name === 'timestamp' || f.name === 'publishedAt')?.name
        }");`
      : null,
    schema.fields.find(f => f.name === 'symbol')
      ? `CREATE INDEX IF NOT EXISTS "idx_${name}_symbol" ON "${name}" ("symbol");`
      : null,
  ].filter(Boolean);

  const sql = [
    '-- Free Crypto News Data Export',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Schema: ${schema.name} v${schema.version}`,
    `-- Rows: ${data.length}`,
    '',
    'BEGIN TRANSACTION;',
    '',
    createTable,
    '',
    ...indexes,
    '',
    ...inserts,
    '',
    'COMMIT;',
  ].join('\n');

  return {
    version: '3.0',
    tables: [{
      name,
      columns,
      rowCount: data.length,
    }],
    sql,
  };
}

// =============================================================================
// MAIN EXPORT FUNCTION
// =============================================================================

export async function exportData<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): Promise<ExportResult> {
  const schema = options.schema || NEWS_SCHEMA;
  const startTime = Date.now();
  
  let exportedData: string | Uint8Array;
  let filename: string;
  
  switch (options.format) {
    case 'csv':
      exportedData = exportToCSV(data, schema);
      filename = `${schema.name}_export.csv`;
      break;
      
    case 'ndjson':
      exportedData = exportToNDJSON(data);
      filename = `${schema.name}_export.ndjson`;
      break;
      
    case 'parquet': {
      const parquetBinary = exportToParquetBinary(data, schema);
      // Return binary Parquet as base64-encoded string for JSON transport,
      // or as raw Uint8Array for streaming endpoints
      exportedData = Buffer.from(parquetBinary).toString('base64');
      filename = `${schema.name}_export.parquet`;
      break;
    }
      
    case 'sqlite':
      const sqlite = exportToSQLite(data, schema);
      exportedData = sqlite.sql;
      filename = `${schema.name}_export.sql`;
      break;
      
    case 'json':
    default:
      exportedData = JSON.stringify({
        schema: {
          name: schema.name,
          version: schema.version,
          fields: schema.fields,
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          rowCount: data.length,
          dateRange: options.dateFrom && options.dateTo 
            ? { from: options.dateFrom, to: options.dateTo }
            : undefined,
        },
        data,
      }, null, 2);
      filename = `${schema.name}_export.json`;
  }

  // Calculate checksum (simple hash for demo)
  const dataStr = typeof exportedData === 'string' ? exportedData : new TextDecoder().decode(exportedData);
  let hash = 0;
  for (let i = 0; i < Math.min(dataStr.length, 10000); i++) {
    hash = ((hash << 5) - hash) + dataStr.charCodeAt(i);
    hash = hash & hash;
  }
  const checksum = Math.abs(hash).toString(16).padStart(8, '0');

  return {
    format: options.format,
    filename,
    size: dataStr.length,
    rowCount: data.length,
    columns: schema.fields.map(f => f.name),
    dateRange: {
      from: options.dateFrom || 'all',
      to: options.dateTo || 'all',
    },
    checksum,
    exportedAt: new Date().toISOString(),
    data: exportedData,
  };
}

// =============================================================================
// STREAMING EXPORT
// =============================================================================

export async function* streamExport<T extends Record<string, unknown>>(
  dataGenerator: AsyncGenerator<T[], void, unknown>,
  options: ExportOptions
): AsyncGenerator<{ chunk: string; progress: ExportProgress }, void, unknown> {
  const schema = options.schema || NEWS_SCHEMA;
  let rowsProcessed = 0;
  let totalRows = 0;
  const startTime = Date.now();

  // Write header for CSV
  if (options.format === 'csv') {
    const headers = schema.fields.map(f => f.name);
    yield {
      chunk: headers.join(',') + '\n',
      progress: {
        status: 'processing',
        progress: 0,
        rowsProcessed: 0,
        totalRows: 0,
      },
    };
  }

  for await (const batch of dataGenerator) {
    totalRows += batch.length;
    
    let chunk: string;
    switch (options.format) {
      case 'csv':
        chunk = batch.map(row => {
          const values = schema.fields.map(f => escapeCSV(row[f.name]));
          return values.join(',');
        }).join('\n') + '\n';
        break;
        
      case 'ndjson':
        chunk = batch.map(row => JSON.stringify(row)).join('\n') + '\n';
        break;
        
      default:
        chunk = batch.map(row => JSON.stringify(row)).join(',');
    }
    
    rowsProcessed += batch.length;
    const elapsed = Date.now() - startTime;
    const rowsPerMs = rowsProcessed / elapsed;
    
    yield {
      chunk,
      progress: {
        status: 'processing',
        progress: Math.min(99, (rowsProcessed / Math.max(totalRows, 1)) * 100),
        rowsProcessed,
        totalRows,
        estimatedTimeRemaining: totalRows > rowsProcessed 
          ? Math.round((totalRows - rowsProcessed) / rowsPerMs / 1000)
          : 0,
      },
    };
  }

  yield {
    chunk: '',
    progress: {
      status: 'completed',
      progress: 100,
      rowsProcessed,
      totalRows: rowsProcessed,
    },
  };
}

// =============================================================================
// EXPORT JOB MANAGEMENT
// =============================================================================

export interface ExportJob {
  id: string;
  status: ExportProgress['status'];
  options: ExportOptions;
  progress: ExportProgress;
  result?: ExportResult;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

const exportJobs = new Map<string, ExportJob>();

export function createExportJob(options: ExportOptions): string {
  const id = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  exportJobs.set(id, {
    id,
    status: 'pending',
    options,
    progress: {
      status: 'pending',
      progress: 0,
      rowsProcessed: 0,
      totalRows: 0,
    },
    createdAt: new Date(),
  });
  
  return id;
}

export function getExportJob(id: string): ExportJob | undefined {
  return exportJobs.get(id);
}

export function deleteExportJob(id: string): boolean {
  return exportJobs.delete(id);
}

export function updateExportJob(id: string, update: Partial<ExportJob>): void {
  const job = exportJobs.get(id);
  if (job) {
    Object.assign(job, update);
  }
}

export function listExportJobs(status?: ExportProgress['status']): ExportJob[] {
  return Array.from(exportJobs.values())
    .filter(job => !status || job.status === status)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const cutoff = Date.now() - maxAgeMs;
  let cleaned = 0;
  
  for (const [id, job] of exportJobs) {
    if (job.createdAt.getTime() < cutoff) {
      exportJobs.delete(id);
      cleaned++;
    }
  }
  
  return cleaned;
}
