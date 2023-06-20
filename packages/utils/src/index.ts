import * as ed from "@noble/ed25519"
import { bytesToHexString, hexStringToBytes } from "@farcaster/hub-web";

type keyGeneration = {
  publicKey: Uint8Array,
  privateKey: Uint8Array
}

type weirdResult = {
  token: string,
  deepLinkUrl: string
}

type signerRequestResult = {
  fid: string,
  base64SignedMessage: string
}

const getPublicKeyAsync = ed.getPublicKeyAsync;

const generateKeyPair = async (): Promise<keyGeneration> => {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  return { publicKey, privateKey };
}

// extract key from keygen
const sendPublicKey = async (publicKey: Uint8Array, name: string): Promise<weirdResult> => {
    
  let convertedKey = bytesToHexString(publicKey)._unsafeUnwrap();
    
  let response = await fetch("https://api.warpcast.com/v2/signer-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicKey: convertedKey, name: name }),
  });

  let {deepLinkUrl, token}: weirdResult = (await response.json()).result;

  return { deepLinkUrl, token };
}

const requestSignerAuthStatus = async (token: string) => {
  return await (
    await fetch(`https://api.warpcast.com/v2/signer-request?token=${token}`, {
      headers: {
        "Content-Type": "application/json"
      }
    })
  ).json();
}

export {
  generateKeyPair,
  sendPublicKey,
  requestSignerAuthStatus,
  getPublicKeyAsync,
  bytesToHexString,
  hexStringToBytes
}