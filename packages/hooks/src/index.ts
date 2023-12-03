import { useEffect, useState } from "react";
import { generateKeyPair, requestSignerAuthStatus, sendPublicKey, KeyGeneration, RequestSignatureParameters } from "@farsign/utils";
import { NobleEd25519Signer, ed25519 } from "@farcaster/hub-web";
import { SignedKeyRequest } from "./SignerAuthStatus";
import { Buffer } from "buffer";

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

const useKeypair = (clientName: string) => {
  const [keygen, setKeyGen] = useState<KeyGeneration>();
  const [encryptedSigner, setEncyptedSigner] = useState<NobleEd25519Signer>();

  useEffect(() => {
    (async () => {
      if (localStorage.getItem("farsign-privateKey-" + clientName) == null) {
        const keyGenerationForUser = await generateKeyPair()

        localStorage.setItem("farsign-privateKey-" + clientName, JSON.stringify(keyGenerationForUser.privateKey))
        setKeyGen(keyGenerationForUser)
      }
      else {
        const privateKey = localStorage.getItem("farsign-privateKey-" + clientName);
        const parsedPrivateKey = Uint8Array.from(privateKey!.split(",").map(split => Number(split)))
        
        const reconstitutionOfPublicKey = (await ed25519.getPublicKey(parsedPrivateKey))._unsafeUnwrap();

        const reconstitutionOfKeypair: KeyGeneration = {
          privateKey: parsedPrivateKey,
          publicKey: reconstitutionOfPublicKey,
          key: `0x${Buffer.from(reconstitutionOfPublicKey).toString("hex")}`
        }

        setEncyptedSigner(new NobleEd25519Signer(parsedPrivateKey))
        setKeyGen(reconstitutionOfKeypair)
      }
    })();
  }, [])

  return [keygen, encryptedSigner] as const;
}

const useToken = (clientName: string, parameters: RequestSignatureParameters, keypair: KeyGeneration) => {
  const [fetchedToken, setFetchedToken] = useState<Token>({
    token: "",
    deepLink: ""
  });

  useEffect(() => {
    (async () => {      
      if (keypair !== undefined) {
        if (localStorage.getItem("farsign-signer-" + clientName) != null) {
          setFetchedToken({
            token: "already connected",
            deepLink: "already connected"
          })
        } else {
          const {token, deeplinkUrl} = await sendPublicKey(parameters, keypair);
  
          localStorage.setItem("farsign-privateKey-" + clientName, keypair.privateKey.toString())
  
          setFetchedToken({ token: token, deepLink: deeplinkUrl })
        }
      }
    })();
  }, [keypair]);

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

export { useSigner, useToken, useCheckSigner, useKeypair, SignedKeyRequest, generateKeyPair, KeyGeneration, RequestSignatureParameters };
export type { Token, Signer, Keypair };
