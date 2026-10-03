// AES-CMAC (RFC 4493) com o módulo crypto do Node, para assinar requisições como o gateway.

import { createCipheriv, createHash } from "node:crypto";

const BLOCK = 16;
const RB = 0x87;

function aes(key: Buffer, block: Buffer): Buffer {
  const cipher = createCipheriv("aes-128-ecb", key, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(block), cipher.final()]);
}

function shiftLeft(input: Buffer): Buffer {
  const out = Buffer.alloc(BLOCK);
  let carry = 0;
  for (let i = BLOCK - 1; i >= 0; i--) {
    out[i] = ((input[i] << 1) | carry) & 0xff;
    carry = (input[i] >> 7) & 1;
  }
  return out;
}

function xor(a: Buffer, b: Buffer): Buffer {
  const out = Buffer.alloc(BLOCK);
  for (let i = 0; i < BLOCK; i++) out[i] = a[i] ^ b[i];
  return out;
}

export function aesCmac(key: Buffer, message: Buffer): Buffer {
  const l = aes(key, Buffer.alloc(BLOCK));
  const k1 = shiftLeft(l);
  if (l[0] & 0x80) k1[BLOCK - 1] ^= RB;
  const k2 = shiftLeft(k1);
  if (k1[0] & 0x80) k2[BLOCK - 1] ^= RB;

  const n = Math.max(1, Math.ceil(message.length / BLOCK));
  const complete = message.length > 0 && message.length % BLOCK === 0;
  const lastStart = (n - 1) * BLOCK;
  let last: Buffer;
  if (complete) {
    last = xor(message.subarray(lastStart, lastStart + BLOCK), k1);
  } else {
    const padded = Buffer.alloc(BLOCK);
    message.copy(padded, 0, lastStart);
    padded[message.length - lastStart] = 0x80;
    last = xor(padded, k2);
  }
  let x: Buffer = Buffer.alloc(BLOCK);
  for (let i = 0; i < n - 1; i++) x = aes(key, xor(x, message.subarray(i * BLOCK, (i + 1) * BLOCK)));
  return aes(key, xor(x, last));
}

/** Cabeçalhos de assinatura do contrato de ingestão (seção 7.2 da especificação). */
export function gatewayHeaders(gatewayId: number, secretHex: string, body: string, nonce: string, timestamp = Math.floor(Date.now() / 1000)) {
  const bodyHash = createHash("sha256").update(body, "utf8").digest("hex");
  const message = Buffer.from(`${gatewayId}\n${timestamp}\n${nonce}\n${bodyHash}`, "utf8");
  return {
    "Content-Type": "application/json",
    "X-Gateway-Id": String(gatewayId),
    "X-Timestamp": String(timestamp),
    "X-Nonce": nonce,
    "X-Signature": aesCmac(Buffer.from(secretHex, "hex"), message).toString("hex"),
  };
}
