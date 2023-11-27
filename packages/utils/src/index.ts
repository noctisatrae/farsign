import * as ed from "@noble/ed25519";
import { mnemonicToAccount, signTypedData } from "viem/accounts";
import { bytesToHexString, hexStringToBytes } from "@farcaster/hub-web";

import * as contracts from "./contracts";

type keyGeneration = {
  publicKey: Uint8Array,
  privateKey: Uint8Array,
  key: string
}

type weirdResult = {
  token: string,
  deepLinkUrl: string
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

const generateSignedKeyRequestSignature = async (appFid: number, appMnemonic: string, key: `0x${string}`) => {
  const account = mnemonicToAccount(appMnemonic);
  const deadline = Math.floor(Date.now() / 1000) + 86400; // signature is valid for 1 day
  
  return await account.signTypedData({
    domain: contracts.SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: contracts.SIGNED_KEY_REQUEST_TYPE,
    },
    primaryType: "SignedKeyRequest",
    message: {
      requestFid: BigInt(appFid),
      key,
      deadline: BigInt(deadline),
    },
  });
}

// extract key from keygen
const sendPublicKey = async (keys: keyGeneration, name: string, fid: number, appMnemonic: string): Promise<weirdResult> => {
    
  const convertedKey = bytesToHexString(keys.publicKey)._unsafeUnwrap();
  const signature = generateSignedKeyRequestSignature(fid, appMnemonic, `0x${keys.key}`);


  const response = await fetch("https://api.warpcast.com/v2/signed-key-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicKey: convertedKey, 
        name: name, 
        fid: fid, 
        signature:signature 
    }),
  });

  const {deepLinkUrl, token}: weirdResult = (await response.json()).result;

  return { deepLinkUrl, token };
}

const requestSignerAuthStatus = async (token: string) => {
  return await (
    await fetch(`https://api.warpcast.com/v2/signed-key-request?token=${token}`, {
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
  hexStringToBytes
}
