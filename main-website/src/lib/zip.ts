/**
 * A dependency-free ZIP reader, just enough to import a studio export.
 *
 * The studio writes a ZIP with the "stored" method (no compression), so this
 * reader only *needs* method 0 — but it also handles method 8 (deflate) via
 * Node's `zlib` so a hand-built ZIP still imports. Nothing here uses a real
 * unzip dependency, because the import route must stay a plain Node handler.
 *
 * Only used server-side: `zlib` is a Node builtin and this module is imported
 * exclusively by `/api/lessons/import`.
 */

import { inflateRawSync } from "node:zlib";

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

const te = new TextDecoder("utf-8");

function crc32(data: Uint8Array): number {
  let c: number;
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
crc32.table = undefined as Uint32Array | undefined;

/** One file inside the archive. */
export interface ZipEntry {
  name: string;
  /** Decompressed contents. */
  data: Uint8Array;
}

/**
 * Reads a ZIP archive into a name → bytes map.
 *
 * Throws on anything malformed rather than returning a partial map: an import
 * that silently drops the clip would write a lesson that cannot play.
 */
export function unzip(bytes: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // --- End of central directory --------------------------------------------
  // Scanned from the tail because the central directory is followed only by the
  // EOCD, whose own length varies with the ZIP comment.
  let eocd = -1;
  const minEocd = Math.max(0, bytes.length - 0xffff - 22);
  for (let i = bytes.length - 22; i >= minEocd; i--) {
    if (view.getUint32(i, true) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a ZIP archive (no end-of-central-directory).");

  const entryCount = view.getUint16(eocd + 10, true);
  const cdOffset = view.getUint32(eocd + 16, true);

  const out = new Map<string, Uint8Array>();

  let at = cdOffset;
  for (let i = 0; i < entryCount; i++) {
    if (view.getUint32(at, true) !== CENTRAL) {
      throw new Error("Malformed ZIP (bad central directory entry).");
    }
    const method = view.getUint16(at + 10, true);
    const crc = view.getUint32(at + 16, true);
    const compressedSize = view.getUint32(at + 20, true);
    const nameLen = view.getUint16(at + 28, true);
    const extraLen = view.getUint16(at + 30, true);
    const commentLen = view.getUint16(at + 32, true);
    const localOffset = view.getUint32(at + 42, true);

    const name = te.decode(bytes.subarray(at + 46, at + 46 + nameLen));

    // A directory entry, or a path that tries to escape the archive. Both are
    // dropped — directories carry no data, and `../` must never reach disk.
    if (name.endsWith("/")) {
      at += 46 + nameLen + extraLen + commentLen;
      continue;
    }
    if (!isSafeName(name)) throw new Error(`Unsafe path in ZIP: "${name}".`);

    // --- Local file header ---------------------------------------------------
    const lh = localOffset;
    if (view.getUint32(lh, true) !== LOCAL) {
      throw new Error(`Malformed ZIP (bad local header for "${name}").`);
    }
    const lNameLen = view.getUint16(lh + 26, true);
    const lExtraLen = view.getUint16(lh + 28, true);
    const dataStart = lh + 30 + lNameLen + lExtraLen;

    const raw = bytes.subarray(dataStart, dataStart + compressedSize);
    let data: Uint8Array;
    if (method === 0) {
      data = raw.slice();
    } else if (method === 8) {
      data = inflateRawSync(raw);
    } else {
      throw new Error(`Unsupported compression method ${method} for "${name}".`);
    }

    // The CRC is a cheap guard against a truncated upload, not against malice —
    // but a wrong CRC on the clip would produce a lesson that plays garbage.
    if (crc !== 0 && crc32(data) !== crc) {
      throw new Error(`CRC mismatch for "${name}" — the archive is damaged.`);
    }

    out.set(name, data);
    at += 46 + nameLen + extraLen + commentLen;
  }

  return out;
}

function isSafeName(name: string): boolean {
  if (!name || name.includes("\\")) return false;
  const parts = name.split("/");
  return parts.every((p) => p.length > 0 && p !== "." && p !== "..");
}
