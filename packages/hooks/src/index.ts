import { useEffect, useState } from "react";
import { generateKeyPair, requestSignerAuthStatus, sendPublicKey } from "@farsign/utils";
import { NobleEd25519Signer } from "@farcaster/hub-web";

import { SignerAuthStatus } from "./SignerAuthStatus";

type Token = {
  token: string,
  deepLink: string
}

type Keypair = {
  privateKey: Uint8Array,
  publicKey: Uint8Array
}

type Signer = {
  signerRequest: SignerAuthStatus,
  isConnected: boolean
}

const useToken = (clientName: string, fid: number, appMnemonic: string) => {
  const [fetchedToken, setFetchedToken] = useState<Token>({
    token: "",
    deepLink: ""
  });

  useEffect(() => {
    (async () => {      
      if (localStorage.getItem("farsign-signer-" + clientName) != null) {
        setFetchedToken({
          token: "already connected",
          deepLink: "already connected"
        })
      } else {
        const keys = await generateKeyPair();
        const {token, deeplinkUrl} = await sendPublicKey(keys, clientName, fid, appMnemonic);

        localStorage.setItem("farsign-privateKey-" + clientName, keys.privateKey.toString())

        setFetchedToken({ token: token, deepLink: deeplinkUrl })
      }
    })();
  }, []);

  return [fetchedToken, setFetchedToken] as const
}

const useSigner = (clientName: string, token: Token) => {

  const [signer, setSigner] = useState<Signer>();

  useEffect(() => {
    if (localStorage.getItem("farsign-signer-" + clientName) === null) {
      (async () => {
        if (token.token.length > 0) {
          while (true) {
            await new Promise(resolve => setTimeout(resolve, 3000));
    
            const data: SignerAuthStatus = await requestSignerAuthStatus(token.token);
            console.log(data.signedKeyRequest.state);

            if (data.signedKeyRequest && data.signedKeyRequest.state == "completed") {
  
              localStorage.setItem("farsign-signer-" + clientName, JSON.stringify(data.signedKeyRequest));
  
              setSigner({
                signerRequest: data,
                isConnected: true
              });
              break
            }
          }
        }
      })()
    } else {
      setSigner((JSON.parse(localStorage.getItem("farsign-signer-" + clientName)!) as Signer));
    }
  }, [token])

  return [signer, setSigner] as const
}

const useCheckSigner = (clientName: string) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem("farsign-signer-" + clientName) === null) 
        setIsConnected(false)
      else 
        setIsConnected(true) 
    })();
  }, [])

  return [isConnected, setIsConnected] as const;
}

const useEncryptedSigner = (clientName: string, token: Token) => {
  const [encryptedSigner, setEncryptedSigner] = useState<NobleEd25519Signer>()

  useEffect(() => {
    if (token.token.length > 0) {
      const privateKey = localStorage.getItem("farsign-privateKey-" + clientName)!;

      const privateKey_encoded = Uint8Array.from(privateKey.split(",").map(split => Number(split)))
      setEncryptedSigner(new NobleEd25519Signer(privateKey_encoded));
    }
  }, [token])

  return [encryptedSigner, setEncryptedSigner] as const;
}

export { useSigner, useToken, useCheckSigner, useEncryptedSigner };
export type { Token, Signer, Keypair };
