import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aesCmac } from "../e2e/cmac.ts";

// Vetores de teste da RFC 4493 (seção 4)
const key = Buffer.from("2b7e151628aed2a6abf7158809cf4f3c", "hex");
const msg = Buffer.from(
  "6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411e5fbc1191a0a52eff69f2445df4f9b17ad2b417be66c3710",
  "hex",
);

describe("AES-CMAC (RFC 4493)", () => {
  it("mensagem vazia", () => assert.equal(aesCmac(key, Buffer.alloc(0)).toString("hex"), "bb1d6929e95937287fa37d129b756746"));
  it("16 bytes", () => assert.equal(aesCmac(key, msg.subarray(0, 16)).toString("hex"), "070a16b46b4d4144f79bdd9dd04a287c"));
  it("40 bytes", () => assert.equal(aesCmac(key, msg.subarray(0, 40)).toString("hex"), "dfa66747de9ae63030ca32611497c827"));
  it("64 bytes", () => assert.equal(aesCmac(key, msg).toString("hex"), "51f0bebf7e3b9d92fc49741779363cfe"));
});
