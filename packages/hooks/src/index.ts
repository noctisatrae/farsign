import { useEffect, useState } from "react";
import { generateKeyPair, requestSignerAuthStatus, sendPublicKey, keyGeneration } from "@farsign/utils";
import { NobleEd25519Signer } from "@farcaster/hub-web";
import { SignedKeyRequest } from "./SignerAuthStatus";

type Token = {
  token: string,
  deepLink: string
}

type Keypair = {
  privateKey: Uint8Array,
  publicKey: Uint8Array
}

type Signer = {
  signerRequest: SignedKeyRequest|boolean,
}

const useToken = (clientName: string, fid: number, appMnemonic: string, keys: keyGeneration) => {
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
        const {token, deeplinkUrl} = await sendPublicKey(keys, clientName, fid, appMnemonic);

        localStorage.setItem("farsign-privateKey-" + clientName, keys.privateKey.toString())

        setFetchedToken({ token: token, deepLink: deeplinkUrl })
      }
    })();
  }, []);

  return [fetchedToken, setFetchedToken] as const
}

const isAlreadyConnected = (clientName: string) => {
  const fetchSignerLocalStorage = localStorage.getItem(`farsign-${clientName}`);
  return (fetchSignerLocalStorage === null) ? false : fetchSignerLocalStorage 
}

const useSigner = (clientName: string, token: Token) => {

  const [signer, setSigner] = useState<Signer>();

  useEffect(() => {
    (async () => {
      const isAlreadyConnectedCheck = isAlreadyConnected(clientName);
      console.log(token, isAlreadyConnectedCheck)
      if (token.token.length > 0 && typeof isAlreadyConnectedCheck == 'boolean') {
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 4000));

          const {result} = await requestSignerAuthStatus(token.token as `Ox${string}`);
          const res: SignedKeyRequest = result.signedKeyRequest;
  
          if (res.state == "completed") { 
            setSigner({
              signerRequest: res
            });

            localStorage.setItem(`farsign-${clientName}`, JSON.stringify(res));
            break
          }
        }
      } else {
        const fetchedSigner = JSON.parse(isAlreadyConnectedCheck as string)
        setSigner({signerRequest: fetchedSigner })
      }
    })()
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

const useEncryptedSigner = (clientName: string) => {
  const [encryptedSigner, setEncryptedSigner] = useState<NobleEd25519Signer>()

  useEffect(() => {
    if (localStorage.getItem(`farsign-${clientName}`) != null) {
      const privateKey = localStorage.getItem("farsign-privateKey-" + clientName)!;

      const privateKey_encoded = Uint8Array.from(privateKey.split(",").map(split => Number(split)))
      setEncryptedSigner(new NobleEd25519Signer(privateKey_encoded));
    }
  }, [])

  return [encryptedSigner, setEncryptedSigner] as const;
}

export { useSigner, useToken, useCheckSigner, useEncryptedSigner, SignedKeyRequest, generateKeyPair, keyGeneration };
export type { Token, Signer, Keypair };
