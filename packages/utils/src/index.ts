import * as ed from "@noble/ed25519";
import { mnemonicToAccount } from "viem/accounts";
import { bytesToHexString, hexStringToBytes } from "@farcaster/hub-web";
import {Buffer} from "buffer";

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: "Farcaster SignedKeyRequestValidator",
  version: "1",
  chainId: 10,
  verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;

type KeyGeneration = {
  publicKey: Uint8Array,
  privateKey: Uint8Array,
  key: string
}

type DeepLinkResult = {
  deeplinkUrl: string,
  token: string
}

export interface WeirdResult {
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

type RequestSignatureParameters = {
  name: string,
  appFid: number,
  appMnemonic: string,
  deadline: number
}

// type signerRequestResult = {
//   fid: string,
//   base64SignedMessage: string
// }

const getPublicKeyAsync = ed.getPublicKeyAsync;

const generateKeyPair = async (): Promise<KeyGeneration> => {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  const key = `0x${Buffer.from(publicKey).toString("hex")}`;
  return { publicKey, privateKey, key };
}

const generateSignedKeyRequestSignature = async (parameters: RequestSignatureParameters, keypair: KeyGeneration) => {
  const { appFid, appMnemonic, deadline } = parameters;
  const key = keypair.key;

  const account = mnemonicToAccount(appMnemonic);

  return await account.signTypedData({
    domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
    },
    primaryType: "SignedKeyRequest",
    message: {
      requestFid: BigInt(appFid),
      /* @ts-expect-error */
      key,
      deadline: BigInt(deadline),
    },
  });
}

// extract key from keygen
const sendPublicKey = async (parameters: RequestSignatureParameters, keypair: KeyGeneration): Promise<DeepLinkResult> => {
  const { appFid, deadline, name } = parameters; 

  const convertedKey = bytesToHexString(keypair.publicKey)._unsafeUnwrap();
  const signature = await generateSignedKeyRequestSignature(parameters, keypair);

  const response = await fetch("https://api.warpcast.com/v2/signed-key-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        key: convertedKey, //key 
        name: name,
        requestFid: appFid, 
        deadline: deadline,
        signature: signature 
    }),
  });
  
  const {deeplinkUrl, token} = (await response.json() as WeirdResult).result.signedKeyRequest;

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
  SignedKeyRequest,
  RequestSignatureParameters,
  KeyGeneration
}
