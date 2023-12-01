import * as ed from "@noble/ed25519";
import { mnemonicToAccount } from "viem/accounts";
import { bytesToHexString, hexStringToBytes } from "@farcaster/hub-web";
import {Buffer} from "buffer";

import * as contracts from "./contracts";

type keyGeneration = {
  publicKey: Uint8Array,
  privateKey: Uint8Array,
  key: string
}

type deepLinkResult = {
  deeplinkUrl: string,
  token: string
}

export interface weirdResult {
  result: Result
}

export interface Result {
  signedKeyRequest: SignedKeyRequest
}

interface SignedKeyRequest {
  token: string
  deeplinkUrl: string
  key: string
  requestFid: number
  state: string
}

// type signerRequestResult = {
//   fid: string,
//   base64SignedMessage: string
// }

const getPublicKeyAsync = ed.getPublicKeyAsync;

const generateKeyPair = async (): Promise<keyGeneration> => {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  const key = `0x${Buffer.from(publicKey).toString("hex")}`;
  return { publicKey, privateKey, key };
}

const generateSignedKeyRequestSignature = async (appFid: number, appMnemonic: string, key: string) => {
  const account = mnemonicToAccount(appMnemonic);
  const deadline = Math.floor(Date.now() / 1000) + 86400;// signature is valid for 1 day
  
  return await account.signTypedData({
    domain: contracts.SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: contracts.SIGNED_KEY_REQUEST_TYPE,
    },
    primaryType: "SignedKeyRequest",
    message: {
      requestFid: BigInt(appFid),
      // @ts-expect-error
      key,
      deadline: BigInt(deadline),
    },
  });
}

// extract key from keygen
const sendPublicKey = async (keys: keyGeneration, name: string, fid: number, appMnemonic: string): Promise<deepLinkResult> => {
    
  const convertedKey = bytesToHexString(keys.publicKey)._unsafeUnwrap();
  const signature = await generateSignedKeyRequestSignature(fid, appMnemonic, keys.key);
  const deadline = Math.floor(Date.now() / 1000) + 86400; // signature is valid for 1 day

  const response = await fetch("https://api.warpcast.com/v2/signed-key-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        key: convertedKey, //key 
        name: name,
        requestFid: fid, 
        deadline: deadline,
        signature: signature 
    }),
  });
  
  const {deeplinkUrl, token} = (await response.json() as weirdResult).result.signedKeyRequest;

  return { deeplinkUrl, token };
}

const requestSignerAuthStatus = async (token: `Ox${string}`) => {
  return await (
    await fetch(`https://api.warpcast.com/v2/signed-key-request?token=` + token, {
      headers: {
        "Content-Type": "application/json"
      }
    })
  ).json();
}

export {
  generateKeyPair,
  generateSignedKeyRequestSignature,
  sendPublicKey,
  requestSignerAuthStatus,
  getPublicKeyAsync,
  bytesToHexString,
  hexStringToBytes,
  SignedKeyRequest
}
