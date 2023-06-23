import { useEffect, useState } from "react";
import { generateKeyPair, requestSignerAuthStatus, sendPublicKey } from "@farsign/utils";

type Token = {
  token: string,
  deepLink: string
}

type SignerData = {
  token: string,
  publicKey: string,
  timestamp: number,
  name: string,
  fid: number,
  messageHash: string,
  base64SignedMessage: string
}

type Signer = {
  signer: SignerData,
  isConnected: boolean
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

  return [isConnected, setIsConnected];
}

const useToken = (clientName: string) => {
  const [fetchedToken, setFetchedToken] = useState<Token>({
    token: "",
    deepLink: ""
  });

  useEffect(() => {
    (async () => {
        const { publicKey, privateKey } = await generateKeyPair();
        const {token, deepLinkUrl} = await sendPublicKey(publicKey, clientName);
        setFetchedToken({ token: token, deepLink: deepLinkUrl })
    })();
  }, []);

  return [fetchedToken, setFetchedToken]
}

const useSigner = (token: string, clientName: string) => {

  const [signer, setSigner] = useState<Signer>({
     signer: {
      token: "",
      publicKey: "",
      timestamp: 0,
      name: "",
      fid: 0,
      messageHash: "",
      base64SignedMessage: ""
     },
     isConnected: false
  });

  useEffect(() => {
    if (localStorage.getItem("farsign-signer-" + clientName) === null) {
      (async () => {
        if (token.length > 0) {
          while (true) {
            await new Promise(resolve => setTimeout(resolve, 3000));
    
            const data = await requestSignerAuthStatus(token);
    
            if (data.result && data.result.signerRequest.base64SignedMessage) {
  
              localStorage.setItem("farsign-signer-" + clientName, JSON.stringify(data.result));
  
              setSigner({
                signer: data.result.signerRequest,
                isConnected: true
              });
              break
            }
          }
        }
      })()
    } else {

    }
  }, [token])

  return [signer, setSigner]
}

export { useSigner, useToken, useCheckSigner };
export type { Token, Signer, SignerData };