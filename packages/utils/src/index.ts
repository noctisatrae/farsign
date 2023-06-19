import * as ed from "@noble/ed25519"
import { bytesToHexString } from "@farcaster/hub-web";

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

const requestSignerAuthStatus = async (token: string): Promise<boolean> => {
    while (true) {
        await new Promise(r => setTimeout(r, 2000));

        const signerRequest = await (
            await fetch(`https://api.warpcast.com/v2/signer-request?token=${token}`, {
                headers: {
                "Content-Type": "application/json"
                }
            })
        ).json();

        console.log(signerRequest);

        if (signerRequest.base64SignedMessage) {
            console.log("signer was approved with fid: " + signerRequest.fid)
            break;
        }

    }    

    return true;
}

export {
    generateKeyPair,
    sendPublicKey,
    requestSignerAuthStatus
}